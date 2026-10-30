/**
 * Wave 0 RED — components/ui/AppButton (PRIM-01 / D-01..D-05)
 * Four variants; disabled reason above control; loading locks press.
 * GREEN in Plan 02/03. Runtime require so missing module fails the test.
 */

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
  return require("../../../../components/ui/AppButton") as AppButtonModule;
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
