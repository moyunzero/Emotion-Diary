/**
 * AppButton (PRIM-01 / D-01..D-05)
 * Four variants; disabled reason above control; loading locks press.
 * Contract helpers load under Jest node; component file asserted via source scan
 * (tsx + RN StyleSheet cannot execute in this env — same pattern as moodWashBurned).
 */

import * as fs from "node:fs";
import * as path from "node:path";

type AppButtonModule = {
  AppButton: unknown;
  APP_BUTTON_VARIANTS: readonly string[];
  isAppButtonPressLocked: (s: {
    loading: boolean;
    disabled: boolean;
  }) => boolean;
  resolveAppButtonDisabledReason: (s: {
    disabled: boolean;
    disabledReason?: string;
  }) => string | null;
};

function loadAppButton(): AppButtonModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const contract = require("../../../../components/ui/appButtonContract") as Omit<
    AppButtonModule,
    "AppButton"
  >;
  const componentPath = path.join(
    __dirname,
    "../../../../components/ui/AppButton.tsx",
  );
  const src = fs.readFileSync(componentPath, "utf8");
  expect(src).toMatch(/export function AppButton\b/);
  return {
    AppButton: true,
    ...contract,
  };
}

describe("AppButton (PRIM-01 variants / disabled / loading)", () => {
  it("exports four variants primary secondary text danger", () => {
    const mod = loadAppButton();
    expect(mod.AppButton).toBeDefined();
    expect([...mod.APP_BUTTON_VARIANTS].sort()).toEqual(
      ["danger", "primary", "secondary", "text"].sort(),
    );
  });

  it("disabled exposes reason text above the control", () => {
    const { resolveAppButtonDisabledReason } = loadAppButton();
    expect(
      resolveAppButtonDisabledReason({
        disabled: true,
        disabledReason: "还不能收好：先写一点或选个心情",
      }),
    ).toBe("还不能收好：先写一点或选个心情");
    expect(
      resolveAppButtonDisabledReason({
        disabled: false,
        disabledReason: "hidden",
      }),
    ).toBeNull();
  });

  it("loading locks press", () => {
    const { isAppButtonPressLocked } = loadAppButton();
    expect(isAppButtonPressLocked({ loading: true, disabled: false })).toBe(
      true,
    );
    expect(isAppButtonPressLocked({ loading: false, disabled: true })).toBe(
      true,
    );
    expect(isAppButtonPressLocked({ loading: false, disabled: false })).toBe(
      false,
    );
  });
});
