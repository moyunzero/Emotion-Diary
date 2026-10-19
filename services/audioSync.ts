/**
 * 音频云端同步模块
 * 处理音频文件上传与待同步批量上传
 */

import {
  EncodingType,
  getInfoAsync,
  readAsStringAsync,
} from "expo-file-system";
import {
  AUDIO_UPLOAD_MAX_ATTEMPTS,
  computeUploadRetryDelayMs,
  sleepMs,
} from "../shared/audio/uploadRetry";
import { looksLikeM4a } from "../shared/audio/playback";
import { extractAudiosObjectPath } from "../shared/audio/storagePath";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AudioData } from "../types";
import { logger } from "@/utils/logger";

const AUDIO_BUCKET = "audios";
/** D-07: signed URL TTL ≈ 24h */
const SIGNED_URL_TTL_SEC = 60 * 60 * 24;

export interface PendingAudioUploadResult {
  success: number;
  failed: number;
  results: Map<string, string>;
  failedAudioIds: string[];
}

/** 把 expo-file-system 读出的 base64 还原成上传用的二进制。 */
function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 上传单个音频文件到云端。
 * 必须读取 localUri 指向的文件字节。Storage 把普通字符串当成正文，
 * 传路径字符串会在云端存下一份不可播放的文本。
 * 成功时 remoteUrl 为 Storage object path（非公有/签名 URL）— D-08/D-10。
 */
export const uploadAudio = async (
  audioData: AudioData,
  userId: string,
): Promise<{ success: boolean; remoteUrl?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 未配置" };
  }

  if (!audioData.localUri) {
    return { success: false, error: "没有本地文件" };
  }

  const filePath = `${userId}/${audioData.id}.m4a`;

  try {
    const base64 = await readAsStringAsync(audioData.localUri, {
      encoding: EncodingType.Base64,
    });
    const body = decodeBase64ToArrayBuffer(base64);
    if (body.byteLength === 0) {
      return { success: false, error: "本地文件为空" };
    }
    const prefix = new Uint8Array(body, 0, Math.min(body.byteLength, 7));
    if (String.fromCharCode(...prefix) === "file://") {
      return { success: false, error: "文件内容不是音频" };
    }

    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, body, {
        contentType: "audio/m4a",
        upsert: true,
      });

    if (error) {
      logger.error("audioSync", "上传音频失败", error);
      return { success: false, error: error.message };
    }

    return { success: true, remoteUrl: filePath };
  } catch (error) {
    logger.error("audioSync", "上传音频异常", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * Play-time：从持久化的 path / legacy public URL 解析 object path 并 mint 签名 URL。
 * 不把 signed URL 写回 entry（D-06）。
 */
export async function resolvePlayableRemoteUrl(
  stored: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const objectPath = extractAudiosObjectPath(stored);
  if (!objectPath) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC);

    if (error || !data?.signedUrl) {
      logger.warn("audioSync", "createSignedUrl 失败", error ?? undefined);
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(data.signedUrl, {
        headers: { Range: "bytes=0-15" },
        signal: controller.signal,
      });
    } catch (error) {
      logger.warn("audioSync", "读取云端音频头失败", error);
      return null;
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok && response.status !== 206) {
      logger.warn("audioSync", "读取云端音频头失败", { status: response.status });
      return null;
    }
    const header = new Uint8Array(await response.arrayBuffer());
    if (!looksLikeM4a(header)) {
      logger.warn("audioSync", "云端对象不是 m4a");
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    logger.warn("audioSync", "createSignedUrl 异常", error);
    return null;
  }
}

/**
 * 单条音频：最多尝试 AUDIO_UPLOAD_MAX_ATTEMPTS 次，失败间指数退避。
 */
export async function uploadAudioWithRetry(
  audio: AudioData,
  userId: string,
  deps: {
    upload?: typeof uploadAudio;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<{ success: true; remoteUrl: string } | { success: false }> {
  const upload = deps.upload ?? uploadAudio;
  const sleep = deps.sleep ?? sleepMs;

  for (let attempt = 0; attempt < AUDIO_UPLOAD_MAX_ATTEMPTS; attempt++) {
    const result = await upload(audio, userId);
    if (result.success && result.remoteUrl) {
      return { success: true, remoteUrl: result.remoteUrl };
    }
    if (attempt < AUDIO_UPLOAD_MAX_ATTEMPTS - 1) {
      await sleep(computeUploadRetryDelayMs(attempt));
    }
  }

  return { success: false };
}

/**
 * 本机还有文件、且云端还没有可用对象时需要上传。
 * 已同步但 remoteUrl 仍是 http(s) 公有链接的，是旧数据：桶改为私有后这些链接签不出文件。
 * 只有本机还留着录音时才能补传；传成功后 remoteUrl 会改成对象路径，不会每次备份都重传。
 */
export function audioNeedsCloudUpload(audio: {
  localUri?: string;
  remoteUrl?: string;
  syncStatus?: string;
}): boolean {
  if (!audio.localUri) return false;
  if (audio.syncStatus === "pending" || audio.syncStatus === "failed") {
    return true;
  }
  return typeof audio.remoteUrl === "string" && /^https?:\/\//i.test(audio.remoteUrl);
}

async function localAudioExists(uri: string): Promise<boolean> {
  try {
    const info = await getInfoAsync(uri);
    return info.exists && info.size > 0;
  } catch {
    return false;
  }
}

export type RepairAction = "skip" | "skip-missing" | "upload" | "fail-missing";

/** 补传决策：本机没有可读文件时，待上传记失败，旧公有链接只跳过。 */
export async function repairActionForAudio(audio: {
  localUri?: string;
  remoteUrl?: string;
  syncStatus?: string;
}): Promise<RepairAction> {
  if (!audioNeedsCloudUpload(audio) || !audio.localUri) {
    return "skip";
  }
  if (!(await localAudioExists(audio.localUri))) {
    if (audio.syncStatus === "pending" || audio.syncStatus === "failed") {
      return "fail-missing";
    }
    return "skip-missing";
  }
  return "upload";
}

/** D-10: pending audio upload concurrency cap (hand-rolled pool; no p-limit). */
const UPLOAD_CONCURRENCY = 3;

/**
 * 批量上传待同步的音频文件（pending + failed，failed 在备份时自动重试）。
 * D-10/D-11/D-13: pool cap 3 + fail-continue + per-item uploadAudioWithRetry.
 * D-12: batch writeback stays at syncToCloud call site (not here).
 */
export const uploadPendingAudios = async (
  audios: AudioData[],
  userId: string,
): Promise<PendingAudioUploadResult> => {
  const results = new Map<string, string>();
  const failedAudioIds: string[] = [];
  let success = 0;
  let failed = 0;

  const pendingAudios = audios.filter(audioNeedsCloudUpload);

  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = nextIndex++;
      if (i >= pendingAudios.length) break;

      const audio = pendingAudios[i];
      const action = await repairActionForAudio(audio);
      if (action === "fail-missing") {
        failed++;
        failedAudioIds.push(audio.id);
        logger.error("audioSync", "本地录音文件不存在", { audioId: audio.id });
        continue;
      }
      if (action !== "upload") {
        continue;
      }
      const outcome = await uploadAudioWithRetry(audio, userId);
      if (outcome.success) {
        results.set(audio.id, outcome.remoteUrl);
        success++;
      } else {
        failed++;
        failedAudioIds.push(audio.id);
        logger.error(
          "audioSync",
          `音频上传失败，已重试 ${AUDIO_UPLOAD_MAX_ATTEMPTS} 次`,
          { audioId: audio.id },
        );
      }
    }
  };

  const workerCount = Math.min(UPLOAD_CONCURRENCY, pendingAudios.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );

  return { success, failed, results, failedAudioIds };
};
