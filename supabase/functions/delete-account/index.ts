// Supabase Edge Function: 注销账号
// Storage wipe（audios，path-segment 含 userId）→ 删 entry_tombstones / entries / profiles → Auth admin user removal
// Storage list/remove 失败则 fail-closed：跳过 Auth 用户删除

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIST_LIMIT = 1000;
const REMOVE_BATCH = 1000;

/** Mirror shared/audio/storageWipe.ts — segment equality, not substring. */
function pathSegmentIncludesUserId(path: string, userId: string): boolean {
  if (!userId) return false;
  return path.split("/").includes(userId);
}

type AdminClient = ReturnType<typeof createClient>;

/**
 * Recursively list object paths under a prefix ("" = bucket root).
 * Folders: Storage list items with id === null.
 */
async function listObjectPathsRecursive(
  supabaseAdmin: AdminClient,
  prefix: string,
): Promise<{ paths: string[]; error: { message: string; name?: string } | null }> {
  const paths: string[] = [];
  const queue: string[] = [prefix];

  while (queue.length > 0) {
    const current = queue.shift()!;
    let offset = 0;

    for (;;) {
      const { data, error } = await supabaseAdmin.storage
        .from("audios")
        .list(current, { limit: LIST_LIMIT, offset });

      if (error) {
        return { paths: [], error: { message: error.message, name: error.name } };
      }
      if (!data || data.length === 0) break;

      for (const item of data) {
        const itemPath = current ? `${current}/${item.name}` : item.name;
        if (item.id === null) {
          queue.push(itemPath);
        } else {
          paths.push(itemPath);
        }
      }

      if (data.length < LIST_LIMIT) break;
      offset += LIST_LIMIT;
    }
  }

  return { paths, error: null };
}

/**
 * Collect wipe candidates: prefer `${userId}/` walk, then full-bucket drift filter.
 */
async function collectUserAudioPaths(
  supabaseAdmin: AdminClient,
  userId: string,
): Promise<{ paths: string[]; error: { message: string; name?: string } | null }> {
  const collected = new Set<string>();

  const primary = await listObjectPathsRecursive(supabaseAdmin, userId);
  if (primary.error) return { paths: [], error: primary.error };
  for (const p of primary.paths) {
    collected.add(p);
  }

  const all = await listObjectPathsRecursive(supabaseAdmin, "");
  if (all.error) return { paths: [], error: all.error };
  for (const p of all.paths) {
    if (pathSegmentIncludesUserId(p, userId)) {
      collected.add(p);
    }
  }

  return { paths: Array.from(collected), error: null };
}

async function wipeUserAudios(
  supabaseAdmin: AdminClient,
  userId: string,
): Promise<{ ok: true; removed: number } | { ok: false; message: string; code?: string }> {
  const { paths, error: listError } = await collectUserAudioPaths(
    supabaseAdmin,
    userId,
  );
  if (listError) {
    console.error("storage list error", {
      userId,
      code: listError.name,
      message: listError.message,
    });
    return {
      ok: false,
      message: "Storage list failed",
      code: listError.name,
    };
  }

  console.log("storage wipe candidates", { userId, count: paths.length });

  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const batch = paths.slice(i, i + REMOVE_BATCH);
    const { error: removeError } = await supabaseAdmin.storage
      .from("audios")
      .remove(batch);
    if (removeError) {
      console.error("storage remove error", {
        userId,
        batchSize: batch.length,
        code: removeError.name,
        message: removeError.message,
      });
      return {
        ok: false,
        message: "Storage remove failed",
        code: removeError.name,
      };
    }
  }

  return { ok: true, removed: paths.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "缺少 Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "认证失败" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 0. Storage wipe BEFORE DB/Auth deletes (D-01/D-02/D-03) — fail-closed
    const wipe = await wipeUserAudios(supabaseAdmin, userId);
    if (!wipe.ok) {
      return new Response(
        JSON.stringify({
          error: wipe.message,
          code: wipe.code ?? "storage_wipe_failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.log("storage wipe ok", { userId, removed: wipe.removed });

    // 1. 删除 entry_tombstones（与 entries 并列，均挂在 user_id 上）
    await supabaseAdmin.from("entry_tombstones").delete().eq("user_id", userId);

    // 2. 删除 entries
    await supabaseAdmin.from("entries").delete().eq("user_id", userId);

    // 3. 删除 profiles
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 4. 删除 Auth 用户（真删除，无法恢复）
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("deleteUser error:", { userId, message: deleteError.message });
      return new Response(
        JSON.stringify({ error: "删除账号失败: " + deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "账号已成功注销" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
