/**
 * Plan 23-12 / G-23-6 — iOS tab chrome solid COLORS.bg + hairline
 * BlurView deferred until opaque underlay ships (stops pink fringe bleed).
 * Source-scan under Jest node (tsx + RN cannot execute here — AppButton pattern).
 */

import * as fs from "node:fs";
import * as path from "node:path";

const layoutPath = path.join(
  __dirname,
  "../../../app/(tabs)/_layout.tsx",
);

function readTabLayoutSrc(): string {
  return fs.readFileSync(layoutPath, "utf8");
}

describe("TabBarBackground solid iOS chrome (PRIM-04 / G-23-6)", () => {
  it("fills iOS tab chrome with solid COLORS.bg and does not mount BlurView", () => {
    const src = readTabLayoutSrc();

    expect(src).toMatch(/COLORS\.bg/);
    expect(src).toMatch(/StyleSheet\.absoluteFill/);
    expect(src).toMatch(/COLORS\.hairline/);

    // No live BlurView mount in TabBarBackground chrome path
    expect(src).not.toMatch(/<BlurView\b/);
    expect(src).not.toMatch(/from ['"]expo-blur['"]/);
    expect(src).not.toMatch(/requireOptionalNativeModule/);
  });
});
