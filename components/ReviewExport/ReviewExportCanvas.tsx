/**
 * @deprecated Wave 2 (04-02) — weekly export uses ShareCardWeekContent inside
 * ShareCardShell. This module remains only for import stability; do not render
 * in production paths (D-11).
 */

export type { ShareCardAiStatus as ReviewExportAiStatus } from "../share/ShareCardWeekContent";

/** @deprecated Use ShareCardShell + ShareCardWeekContent instead. */
export const ReviewExportCanvas = (): null => null;
