/**
 * Wave 0 RED — AppChip selected Check affordance (PRIM-02)
 * Selected state must include Check, not color-only.
 * GREEN in Plan 04. Runtime require so missing module fails the test.
 */

type AppChipModule = {
  AppChip: unknown;
  appChipSelectedShowsCheck: (selected: boolean) => boolean;
};

function loadAppChip(): AppChipModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../../../../components/ui/AppChip") as AppChipModule;
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
