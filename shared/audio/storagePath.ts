/**
 * Supabase Storage `audios` bucket — object path helpers (pure, no supabase).
 * SEC-02: remoteUrl may be a path or a legacy public/sign URL; play-time signing
 * needs the object path only (D-08/D-09).
 */

/**
 * Extract Storage object path from a stored remoteUrl value.
 * - Bare path → normalized path
 * - Public or sign URL under audios → object path (query stripped)
 * - Unparseable http(s) → null
 */
export function extractAudiosObjectPath(stored: string): string | null {
  const trimmed = stored.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\//, "");
  }
  const markers = [
    "/storage/v1/object/public/audios/",
    "/storage/v1/object/sign/audios/",
  ];
  for (const m of markers) {
    const i = trimmed.indexOf(m);
    if (i >= 0) {
      const rest = trimmed.slice(i + m.length).split("?")[0];
      try {
        return decodeURIComponent(rest);
      } catch {
        return null;
      }
    }
  }
  return null;
}
