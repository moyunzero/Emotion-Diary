import type { PullConflictCountResult } from "@/store/sync/countPullConflicts";

/** Which merge prompt to show. The number is a count, never diary text. */
export type MergeConfirm =
  | { kind: "short" }
  | { kind: "counted"; total: number }
  | { kind: "unknown" };

export type MergeConfirmAction = "upload" | "download" | "cancel";

type AlertButton = {
  text: string;
  style?: "cancel" | "default" | "destructive";
  onPress?: () => void;
};

type AlertFn = (title: string, message: string, buttons: AlertButton[]) => void;

/**
 * Zero still uses the existing short confirm.
 * A positive count must be spoken. Unknown must not be presented as zero.
 */
export function mergeConfirmForCount(
  result: PullConflictCountResult,
): MergeConfirm {
  if (result.status === "unknown") return { kind: "unknown" };
  if (result.total === 0) return { kind: "short" };
  return { kind: "counted", total: result.total };
}

/**
 * Profile and the Maestro probe share this alert.
 * Cancel does not upload or merge. Upload does not merge.
 */
export function presentMergeConfirm(
  confirm: MergeConfirm,
  onAction: (action: MergeConfirmAction) => void,
  deps: {
    alert: AlertFn;
    t: (key: string, options?: Record<string, unknown>) => string;
  },
): void {
  const { alert, t } = deps;
  const title = t("pull.confirmTitle", { ns: "sync" });
  const cancel = {
    text: t("actions.cancel", { ns: "common" }),
    style: "cancel" as const,
    onPress: () => onAction("cancel"),
  };

  if (confirm.kind === "short") {
    alert(title, t("pull.confirmMessage", { ns: "sync" }), [
      cancel,
      {
        text: t("pull.confirmOk", { ns: "sync" }),
        onPress: () => onAction("download"),
      },
    ]);
    return;
  }

  const message =
    confirm.kind === "counted"
      ? t("pull.confirmReplace", { ns: "sync", count: confirm.total })
      : t("pull.confirmUnknown", { ns: "sync" });
  alert(title, message, [
    {
      text: t("pull.uploadFirst", { ns: "sync" }),
      onPress: () => onAction("upload"),
    },
    {
      text: t("pull.mergeAnyway", { ns: "sync" }),
      onPress: () => onAction("download"),
    },
    cancel,
  ]);
}
