/**
 * NIGHT-02 Wave 0 — night palette source contract (RED until Plan 02).
 * Forbids invert/filter hacks and cold-gray dominant night page bg.
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");
const colorsPath = path.join(root, "constants/colors.ts");

describe("nightPaletteContract (NIGHT-02)", () => {
  it("exports getColors and COLORS_NIGHT with warm pink-ink page bg", () => {
    const source = fs.readFileSync(colorsPath, "utf8");
    expect(source).toMatch(/export\s+(const|function)\s+COLORS_NIGHT\b/);
    expect(source).toMatch(/export\s+function\s+getColors\b/);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const colorsModule = require("@/constants/colors") as {
      COLORS_NIGHT?: { background?: { page?: string }; bg?: string };
      getColors?: (scheme: "light" | "night") => unknown;
    };

    expect(typeof colorsModule.getColors).toBe("function");
    expect(colorsModule.COLORS_NIGHT).toBeDefined();

    const night = colorsModule.COLORS_NIGHT!;
    const pageBg =
      night.background?.page ?? (night as { bg?: string }).bg ?? "";
    expect(pageBg).toBe("#1C1418");
    expect(pageBg).not.toBe("#111827");
    expect(pageBg.toLowerCase()).not.toBe("#000000");
  });

  it("does not implement night via CSS invert or filter hacks", () => {
    const source = fs.readFileSync(colorsPath, "utf8");
    expect(source).not.toMatch(/\binvert\s*\(/);
    expect(source).not.toMatch(/\bfilter\s*:\s*['"]?\s*invert/);
    expect(source).not.toMatch(/StyleSheet\.flatten.*invert/);
  });
});
