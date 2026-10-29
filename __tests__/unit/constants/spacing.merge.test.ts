/**
 * TOKEN-02 Wave 0 — merged scale + md collision docs (RED until Plan 02).
 */

import { DESIGN_TOKENS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";

const LEGAL_SPACING = new Set([4, 8, 12, 16, 20, 24, 32, 48]);

describe("DESIGN_TOKENS / SPACING merge (TOKEN-02)", () => {
  it("DESIGN_TOKENS.spacing values stay in legal sketch scale (+ pageX 20)", () => {
    const values = Object.values(DESIGN_TOKENS.spacing);
    for (const n of values) {
      expect(LEGAL_SPACING.has(n)).toBe(true);
    }
    // page / layout gutter (sketch --page-x) allowed as dedicated key after merge
    const tokens = DESIGN_TOKENS.spacing as Record<string, number>;
    expect(tokens.pageX ?? tokens.page_x).toBe(20);
  });

  it("borderRadius chrome maps to sketch 8/14/22 + capsule", () => {
    expect(DESIGN_TOKENS.borderRadius.small).toBe(8);
    expect(DESIGN_TOKENS.borderRadius.medium).toBe(14);
    expect(DESIGN_TOKENS.borderRadius.large).toBe(14);
    expect(DESIGN_TOKENS.borderRadius.xl).toBe(22);
    expect(DESIGN_TOKENS.borderRadius.xxl).toBe(22);
    expect([9999, 999]).toContain(DESIGN_TOKENS.borderRadius.full);
  });

  it("fontSize.xs footnote min is 12 (no product 10)", () => {
    expect(DESIGN_TOKENS.fontSize.xs).toBe(12);
    expect(DESIGN_TOKENS.fontSize.xs).toBeGreaterThanOrEqual(12);
  });

  it("documents md collision: DESIGN_TOKENS.spacing.md is 12, SPACING.md is 16", () => {
    // Pitfall 1 — unequal aliases must stay explicit after merge (D-07/D-08)
    expect(DESIGN_TOKENS.spacing.md).toBe(12);
    expect(SPACING.md).toBe(16);
    expect(DESIGN_TOKENS.spacing.md).not.toBe(SPACING.md);
  });
});
