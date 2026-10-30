/**
 * Plan 23-11 / G-23-2 — AppChip selected without checkmark (PRIM-02 / PRIM-05)
 * Selected = brandSoft + brand label + brand border weight — not color-only; no Check glyph.
 * Task 1: contract helpers + UI-SPEC Selected wording (AppChip.tsx source scan in Task 2).
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

function readUiSpecChipSelectedRow(): string {
  const specPath = path.join(
    __dirname,
    "../../../../.planning/phases/23-ui-primitives/23-UI-SPEC.md",
  );
  const md = fs.readFileSync(specPath, "utf8");
  const chipSection = md.slice(md.indexOf("### Chip (PRIM-02)"));
  const selectedLine = chipSection
    .split("\n")
    .find((line) => /^\|\s*Selected\s*\|/.test(line));
  expect(selectedLine).toBeDefined();
  return selectedLine as string;
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

  it("UI-SPEC Selected row: brandSoft + brand border; no Check glyph requirement", () => {
    const selectedRow = readUiSpecChipSelectedRow();
    expect(selectedRow).toMatch(/brandSoft/i);
    expect(selectedRow).toMatch(/brand/i);
    expect(selectedRow).toMatch(/border/i);
    expect(selectedRow).not.toMatch(/\bCheck\b/);
  });
});
