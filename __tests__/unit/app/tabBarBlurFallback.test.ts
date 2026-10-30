/**
 * Plan 23-10 / G-23-1 · G-23-4 — TabBarBackground BlurView native probe
 * When ExpoBlurView is missing, chrome must use solid COLORS.bg (no Unimplemented).
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

describe("TabBarBackground BlurView native probe (PRIM-04 / G-23-1 · G-23-4)", () => {
  it("probes requireOptionalNativeModule('ExpoBlurView') before mounting BlurView", () => {
    const src = readTabLayoutSrc();

    expect(src).toMatch(/requireOptionalNativeModule/);
    expect(src).toMatch(/['"]ExpoBlurView['"]/);
    expect(src).toMatch(
      /requireOptionalNativeModule\s*\(\s*['"]ExpoBlurView['"]\s*\)/,
    );

    // BlurView must not be the sole iOS !solid return without a probe/solid branch
    const unconditionalIosBlur =
      /Platform\.OS\s*===\s*['"]ios['"]\s*&&\s*!solid\s*\)\s*\{[\s\S]*?<BlurView\b/;
    expect(src).not.toMatch(unconditionalIosBlur);
  });
});
