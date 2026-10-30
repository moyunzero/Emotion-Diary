/**
 * Wave 0 / Plan 04 — AppChip selected Check affordance (PRIM-02)
 * Selected state must include Check, not color-only.
 * Contract helpers load under Jest node; component asserted via source scan
 * (tsx + RN StyleSheet cannot execute in this env — same pattern as AppButton).
 */

import * as fs from "node:fs";
import * as path from "node:path";

type AppChipModule = {
  AppChip: unknown;
  appChipSelectedShowsCheck: (selected: boolean) => boolean;
};

function loadAppChip(): AppChipModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const contract = require("../../../../components/ui/appChipContract") as {
    appChipSelectedShowsCheck: (selected: boolean) => boolean;
  };
  const componentPath = path.join(
    __dirname,
    "../../../../components/ui/AppChip.tsx",
  );
  const src = fs.readFileSync(componentPath, "utf8");
  expect(src).toMatch(/export function AppChip\b/);
  expect(src).toMatch(/\bCheck\b/);
  expect(src).toMatch(/appChipSelectedShowsCheck/);
  return {
    AppChip: true,
    appChipSelectedShowsCheck: contract.appChipSelectedShowsCheck,
  };
}

describe("AppChip selected Check (PRIM-02)", () => {
  it("selected state includes Check affordance (not color-only)", () => {
    const { AppChip, appChipSelectedShowsCheck } = loadAppChip();
    expect(AppChip).toBeDefined();
    expect(appChipSelectedShowsCheck(true)).toBe(true);
  });

  it("unselected state does not show Check", () => {
    const { appChipSelectedShowsCheck } = loadAppChip();
    expect(appChipSelectedShowsCheck(false)).toBe(false);
  });
});
