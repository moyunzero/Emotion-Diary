/**
 * Pure Storage wipe path helpers (SEC-01).
 * Segment-equality matching — mirror the same rule in Edge Deno (do not import this into Deno).
 */

/**
 * True when any path segment equals userId (not raw substring includes).
 */
export function pathSegmentIncludesUserId(path: string, userId: string): boolean {
  if (!userId) return false;
  return path.split('/').includes(userId);
}

/**
 * Keep object paths whose segments include userId. Empty input → empty output.
 */
export function filterWipeCandidatePaths(paths: string[], userId: string): string[] {
  return paths.filter((path) => pathSegmentIncludesUserId(path, userId));
}
