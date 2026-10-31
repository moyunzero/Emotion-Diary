/**
 * Plan 23-12 / G-23-6 · G-23-5 — solid iOS tab chrome + no weather record text link
 * Source-scan under Jest node (tsx + RN cannot execute here — AppButton pattern).
 */

import * as fs from "node:fs";
import * as path from "node:path";

const root = path.join(__dirname, "../../..");
const layoutPath = path.join(root, "app/(tabs)/_layout.tsx");
const dashboardPath = path.join(root, "components/Dashboard.tsx");

function readTabLayoutSrc(): string {
  return fs.readFileSync(layoutPath, "utf8");
}

describe("TabBarBackground solid iOS chrome (PRIM-04 / G-23-6)", () => {
  it("fills iOS tab chrome with solid themed page bg and does not mount BlurView", () => {
    const src = readTabLayoutSrc();

    expect(src).toMatch(/colors\.bg/);
    expect(src).toMatch(/StyleSheet\.absoluteFill/);
    expect(src).toMatch(/colors\.hairline/);

    // No live BlurView mount in TabBarBackground chrome path
    expect(src).not.toMatch(/<BlurView\b/);
    expect(src).not.toMatch(/from ['"]expo-blur['"]/);
    expect(src).not.toMatch(/requireOptionalNativeModule/);
  });
});

describe("Dashboard weather record text link removed (D-28 / G-23-5)", () => {
  it("does not mount dashboard-record-link under weather header", () => {
    const src = fs.readFileSync(dashboardPath, "utf8");
    expect(src).not.toMatch(/dashboard-record-link/);
    expect(src).not.toMatch(/recordLink/);
  });
});
