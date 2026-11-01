/**
 * Plan 23-11 / G-23-2 — AppChip selected without checkmark (PRIM-02 / PRIM-05)
 * Selected = brandSoft + brand label + brand border weight — not color-only; no Check glyph.
 * Contract helpers + UI-SPEC Selected wording + AppChip.tsx source scan.
 */

import * as fs from "node:fs";
import * as path from "node:path";

type AppChipContract = {
  appChipSelectedShowsCheck: (selected: boolean) => boolean;
  appChipSelectedBorderWidth: (selected: boolean) => number;
};

function loadContract(): AppChipContract {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../../../../components/ui/appChipContract") as AppChipContract;
}

function readAppChipSource(): string {
  const componentPath = path.join(
    __dirname,
    "../../../../components/ui/AppChip.tsx",
  );
  return fs.readFileSync(componentPath, "utf8");
}

describe("AppChip selected without checkmark (PRIM-02 / PRIM-05)", () => {
  it("appChipSelectedShowsCheck is always false (no checkmark glyph)", () => {
    const { appChipSelectedShowsCheck } = loadContract();
    expect(appChipSelectedShowsCheck(true)).toBe(false);
    expect(appChipSelectedShowsCheck(false)).toBe(false);
  });

  it("appChipSelectedBorderWidth returns 1.5–2 when selected and 1 when not", () => {
    const { appChipSelectedBorderWidth } = loadContract();
    const selectedWidth = appChipSelectedBorderWidth(true);
    expect(selectedWidth).toBeGreaterThanOrEqual(1.5);
    expect(selectedWidth).toBeLessThanOrEqual(2);
    expect(appChipSelectedBorderWidth(false)).toBe(1);
  });

  it("AppChip shellSelected uses themed brandSoft fill + brand border; no Check element", () => {
    const src = readAppChipSource();
    expect(src).toMatch(/export function AppChip\b/);
    expect(src).toMatch(/shellSelected/);
    // Phase 26: palette from useThemeStyles — not module COLORS
    expect(src).toMatch(/backgroundColor:\s*colors\.brandSoft/);
    expect(src).toMatch(/borderColor:\s*colors\.brand\b/);
    expect(src).not.toMatch(/backgroundColor:\s*COLORS\.brandSoft/);
    expect(src).toMatch(/appChipSelectedBorderWidth/);
    // Selected checkmark glyph must be gone; X delete affordance may remain.
    expect(src).not.toMatch(/\bCheck\b/);
    expect(src).toMatch(/\bX\b/);
  });
});
