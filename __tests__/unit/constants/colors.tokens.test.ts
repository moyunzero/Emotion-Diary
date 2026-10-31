/**
 * TOKEN-01 Wave 0 — semantic COLORS vs sketch default.css (must stay RED until Plan 02).
 * Jest -t 'bg|brand' selects only paper/brand (+ brandPressed/brandSoft + aliases) asserts.
 */

import { COLORS } from "@/constants/colors";

/** Future semantic shape (Plan 02); cast so Wave 0 compiles against candy COLORS. */
type SketchColors = {
  bg: string;
  brand: string;
  brandPressed: string;
  brandSoft: string;
  primary: string;
  danger: string;
  background: { page: string };
  text: { primary: string; secondary: string; tertiary: string };
  weather: {
    sunny: { icon: string; bg: string };
    cloudy: { icon: string; bg: string };
    rainy: { icon: string; bg: string };
    stormy: { icon: string; bg: string };
  };
  ritual: { resolve: string; burn: string };
  mood: { icon: { level5: string } };
};

const c = COLORS as unknown as SketchColors;

describe("COLORS semantic tokens (TOKEN-01)", () => {
  describe("bg and brand paper CTA", () => {
    it("bg equals sketch paper #FFF8F9", () => {
      expect(c.bg).toBe("#FFF8F9");
    });

    it("brand equals sketch brand #C2416B", () => {
      expect(c.brand).toBe("#C2416B");
    });

    it("brandPressed and brandSoft match sketch", () => {
      expect(c.brandPressed).toBe("#A8355B");
      expect(c.brandSoft).toBe("#FCE4EB");
    });

    it("primary aliases brand; background.page aliases bg", () => {
      expect(c.primary).toBe(c.brand);
      expect(c.background.page).toBe(c.bg);
    });
  });

  describe("text roles from sketch", () => {
    it("text primary secondary tertiary match sketch --text ladder", () => {
      expect(c.text.primary).toBe("#2B2326");
      expect(c.text.secondary).toBe("#6B5F63");
      expect(c.text.tertiary).toBe("#8C8084");
    });
  });

  describe("weather icon and fill (not purple candy)", () => {
    it("sunny cloudy rainy stormy icon+fill match sketch weather hues", () => {
      expect(c.weather.sunny).toEqual({ icon: "#B57A12", bg: "#FBF3E4" });
      expect(c.weather.cloudy).toEqual({ icon: "#7A8794", bg: "#F0F2F4" });
      expect(c.weather.rainy).toEqual({ icon: "#5B7FA6", bg: "#ECF2F8" });
      expect(c.weather.stormy).toEqual({ icon: "#7A5C8E", bg: "#F2EDF6" });
      // Guard: stormy icon must stay mauve sketch, not candy purple #C084FC / #A78BFA
      expect(c.weather.stormy.icon).not.toBe("#C084FC");
      expect(c.weather.cloudy.icon).not.toBe("#C084FC");
    });
  });

  describe("ritual and danger semantics", () => {
    it("ritual resolve burn and danger match sketch", () => {
      expect(c.ritual.resolve).toBe("#2F8F6A");
      expect(c.ritual.burn).toBe("#C2541D");
      expect(c.danger).toBe("#C93A3A");
    });
  });

  describe("mood rose ladder retained", () => {
    it("mood icon level5 remains rose-family key", () => {
      expect(c.mood.icon.level5).toBeDefined();
      expect(typeof c.mood.icon.level5).toBe("string");
      expect(c.mood.icon.level5.toUpperCase()).toMatch(/^#[EFef0-9A-Fa-f]{5}/);
      // Rose family: not purple weather candy
      expect(c.mood.icon.level5).not.toBe("#C084FC");
      expect(c.mood.icon.level5).not.toBe("#A78BFA");
    });
  });
});

/** Night anchors from night.css / night-role-map (NIGHT-02 · Plan 02 GREEN). */
type NightSketchColors = {
  bg: string;
  brand: string;
  background: { page: string };
  tab?: { barBg?: string };
};

describe("COLORS_NIGHT semantic tokens (NIGHT-02)", () => {
  it("getColors returns COLORS for light and COLORS_NIGHT for night", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const colorsModule = require("@/constants/colors") as {
      getColors?: (scheme: "light" | "night") => unknown;
      COLORS_NIGHT?: unknown;
      COLORS: typeof COLORS;
    };
    expect(typeof colorsModule.getColors).toBe("function");
    expect(colorsModule.COLORS_NIGHT).toBeDefined();
    expect(colorsModule.getColors!("light")).toBe(colorsModule.COLORS);
    expect(colorsModule.getColors!("night")).toBe(colorsModule.COLORS_NIGHT);
  });

  it("night page bg and brand accent match pink-ink sketch", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { COLORS_NIGHT } = require("@/constants/colors") as {
      COLORS_NIGHT: NightSketchColors;
    };
    const night = COLORS_NIGHT;
    expect(night.background.page).toBe("#1C1418");
    expect(night.bg).toBe("#1C1418");
    expect(night.brand).toBe("#F08AA8");
  });

  it("night tab wash matches UI-SPEC rgba(39, 28, 34, 0.82)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { COLORS_NIGHT } = require("@/constants/colors") as {
      COLORS_NIGHT: NightSketchColors;
    };
    const night = COLORS_NIGHT;
    expect(night.tab?.barBg).toBe("rgba(39, 28, 34, 0.82)");
  });

  it("night weather card and weather fills match night.css washes", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { COLORS_NIGHT } = require("@/constants/colors") as {
      COLORS_NIGHT: {
        weather: {
          sunny: { bg: string };
          cloudy: { bg: string };
          rainy: { bg: string };
          stormy: { bg: string };
        };
        weatherCard: {
          sunny: { bg: string };
          cloudy: { bg: string };
          rainy: { bg: string };
        };
      };
    };
    const night = COLORS_NIGHT;
    expect(night.weather.sunny.bg).toBe("#2B2419");
    expect(night.weather.cloudy.bg).toBe("#22262A");
    expect(night.weather.rainy.bg).toBe("#1E2530");
    expect(night.weatherCard.sunny.bg).toBe("#2B2419");
    expect(night.weatherCard.cloudy.bg).toBe("#22262A");
    expect(night.weatherCard.rainy.bg).toBe("#1E2530");
  });
});
