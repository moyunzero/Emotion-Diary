/**
 * Wave 0 RED — dashboard segment short vs a11y labels (PRIM-04 / D-21..D-22)
 * Short: 未处理/已和解/灰烬/全部 · Open/Done/Ash/All
 * a11y uses full names separately.
 * GREEN in Plan 08 (utils/dashboardSegmentLabels).
 */

type SegmentKey = "active" | "resolved" | "burned" | "all";

type SegmentLabelsModule = {
  DASHBOARD_SEGMENT_ORDER: readonly SegmentKey[];
  getDashboardSegmentShortLabel: (
    key: SegmentKey,
    locale: "zh-Hans" | "en-US",
  ) => string;
  getDashboardSegmentA11yLabel: (
    key: SegmentKey,
    locale: "zh-Hans" | "en-US",
  ) => string;
};

function loadSegmentLabels(): SegmentLabelsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../../../../utils/dashboardSegmentLabels") as SegmentLabelsModule;
}

describe("segment short labels (PRIM-04)", () => {
  it("orders active → resolved → burned → all", () => {
    const { DASHBOARD_SEGMENT_ORDER } = loadSegmentLabels();
    expect(DASHBOARD_SEGMENT_ORDER).toEqual([
      "active",
      "resolved",
      "burned",
      "all",
    ]);
  });

  it("maps zh short labels 未处理/已和解/灰烬/全部", () => {
    const { getDashboardSegmentShortLabel } = loadSegmentLabels();
    expect(getDashboardSegmentShortLabel("active", "zh-Hans")).toBe("未处理");
    expect(getDashboardSegmentShortLabel("resolved", "zh-Hans")).toBe("已和解");
    expect(getDashboardSegmentShortLabel("burned", "zh-Hans")).toBe("灰烬");
    expect(getDashboardSegmentShortLabel("all", "zh-Hans")).toBe("全部");
  });

  it("maps en short labels Open/Done/Ash/All", () => {
    const { getDashboardSegmentShortLabel } = loadSegmentLabels();
    expect(getDashboardSegmentShortLabel("active", "en-US")).toBe("Open");
    expect(getDashboardSegmentShortLabel("resolved", "en-US")).toBe("Done");
    expect(getDashboardSegmentShortLabel("burned", "en-US")).toBe("Ash");
    expect(getDashboardSegmentShortLabel("all", "en-US")).toBe("All");
  });

  it("a11y full names differ from short labels", () => {
    const {
      DASHBOARD_SEGMENT_ORDER,
      getDashboardSegmentShortLabel,
      getDashboardSegmentA11yLabel,
    } = loadSegmentLabels();
    for (const key of DASHBOARD_SEGMENT_ORDER) {
      const shortZh = getDashboardSegmentShortLabel(key, "zh-Hans");
      const a11yZh = getDashboardSegmentA11yLabel(key, "zh-Hans");
      expect(a11yZh).not.toBe(shortZh);
      expect(a11yZh.length).toBeGreaterThan(shortZh.length);

      const shortEn = getDashboardSegmentShortLabel(key, "en-US");
      const a11yEn = getDashboardSegmentA11yLabel(key, "en-US");
      expect(a11yEn).not.toBe(shortEn);
      expect(a11yEn.length).toBeGreaterThan(shortEn.length);
    }
  });
});
