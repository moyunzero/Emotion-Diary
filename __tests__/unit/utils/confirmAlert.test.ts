/**
 * Wave 0 RED — utils/confirmAlert (PRIM-03 / D-13)
 * Cancel always present; resolve true/false; destructive confirm style.
 * GREEN in Plan 02+. Runtime require so missing module fails the test (not TS2307).
 */

const mockAlert = jest.fn();

jest.mock("react-native", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

type AlertButton = {
  text?: string;
  style?: string;
  onPress?: () => void;
};

function loadConfirmAlert(): (options: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}) => Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("../../../utils/confirmAlert") as {
    confirmAlert: (options: {
      title: string;
      message?: string;
      confirmLabel: string;
      cancelLabel?: string;
      destructive?: boolean;
    }) => Promise<boolean>;
  };
  return mod.confirmAlert;
}

function lastButtons(): AlertButton[] {
  const buttons = mockAlert.mock.calls[0]?.[2] as AlertButton[] | undefined;
  expect(Array.isArray(buttons)).toBe(true);
  return buttons ?? [];
}

describe("confirmAlert (PRIM-03 cancel always)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("always presents cancel + confirm buttons", async () => {
    const confirmAlert = loadConfirmAlert();
    const pending = confirmAlert({
      title: "Delete?",
      message: "This removes the entry",
      confirmLabel: "Delete",
    });

    const buttons = lastButtons();
    expect(buttons).toHaveLength(2);
    const styles = buttons.map((b) => b.style);
    expect(styles).toContain("cancel");
    expect(buttons.some((b) => b.text === "Delete")).toBe(true);

    const cancel = buttons.find((b) => b.style === "cancel");
    cancel?.onPress?.();
    await expect(pending).resolves.toBe(false);
  });

  it("resolves true when confirm is pressed", async () => {
    const confirmAlert = loadConfirmAlert();
    const pending = confirmAlert({
      title: "Confirm",
      confirmLabel: "Continue",
    });

    const buttons = lastButtons();
    const confirm = buttons.find((b) => b.style !== "cancel");
    confirm?.onPress?.();
    await expect(pending).resolves.toBe(true);
  });

  it("marks confirm destructive when requested", async () => {
    const confirmAlert = loadConfirmAlert();
    const pending = confirmAlert({
      title: "Purge",
      confirmLabel: "Purge forever",
      destructive: true,
    });

    const buttons = lastButtons();
    const confirm = buttons.find((b) => b.style === "destructive");
    expect(confirm?.text).toBe("Purge forever");
    confirm?.onPress?.();
    await expect(pending).resolves.toBe(true);
  });
});
