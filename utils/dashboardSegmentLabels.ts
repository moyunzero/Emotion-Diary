/**
 * Dashboard sticky segment labels (PRIM-04 / D-21..D-22).
 * Short labels locked; a11y uses longer full names — never diary body text.
 */

export type DashboardSegmentKey = "active" | "resolved" | "burned" | "all";

export type DashboardSegmentLocale = "zh-Hans" | "en-US";

export const DASHBOARD_SEGMENT_ORDER = [
  "active",
  "resolved",
  "burned",
  "all",
] as const satisfies readonly DashboardSegmentKey[];

const SHORT_LABELS: Record<
  DashboardSegmentLocale,
  Record<DashboardSegmentKey, string>
> = {
  "zh-Hans": {
    active: "未处理",
    resolved: "已和解",
    burned: "灰烬",
    all: "全部",
  },
  "en-US": {
    active: "Open",
    resolved: "Done",
    burned: "Ash",
    all: "All",
  },
};

/** Full names for VoiceOver / TalkBack — longer than short; no entry content. */
const A11Y_LABELS: Record<
  DashboardSegmentLocale,
  Record<DashboardSegmentKey, string>
> = {
  "zh-Hans": {
    active: "筛选：未处理的情绪记录",
    resolved: "筛选：已和解的情绪记录",
    burned: "筛选：灰烬回忆",
    all: "筛选：全部记录",
  },
  "en-US": {
    active: "Filter: Open entries",
    resolved: "Filter: Resolved entries",
    burned: "Filter: Ashes",
    all: "Filter: All entries",
  },
};

export function getDashboardSegmentShortLabel(
  key: DashboardSegmentKey,
  locale: DashboardSegmentLocale,
): string {
  return SHORT_LABELS[locale][key];
}

export function getDashboardSegmentA11yLabel(
  key: DashboardSegmentKey,
  locale: DashboardSegmentLocale,
): string {
  return A11Y_LABELS[locale][key];
}
