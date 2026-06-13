/**
 * 数据管理页：云端操作说明（B3）
 */

export const SYNC_DATA_OPS = {
  sectionHint: "下列为两种云端操作，请按需要选择。",

  uploadTitle: "备份到云端",
  uploadSubtext: "上传本机记录到云端",
  uploadProgress: "正在备份到云端…",

  pullTitle: "从云端合并",
  pullSubtext: "下载并与本机合并；同一条以云端为准",
  pullProgress: "正在从云端合并…",

  pullConfirmTitle: "从云端合并",
  pullConfirmMessage:
    "将把云端记录与本机合并。若同一条在两边都存在，以云端内容为准（可找回本机已删条目）。仅本机独有的记录会保留。确定继续？",
  pullConfirmCancel: "取消",
  pullConfirmOk: "继续合并",

  pendingMessage: "已有同步进行中，完成后将自动尝试备份",
  notLoggedIn: "请先登录后再操作",
  uploadSuccess: (n: number) => `已备份 ${n} 条记录到云端`,
  pullSuccess: (n: number) => `已合并 ${n} 条记录`,
} as const;

export type StoreSyncStatus = "idle" | "syncing" | "pending" | "error";

export function formatStoreSyncStatusLabel(
  status: StoreSyncStatus,
  lastSyncLabel: string,
): string {
  switch (status) {
    case "syncing":
      return "正在同步…";
    case "pending":
      return "同步排队中…";
    case "error":
      return "上次同步失败，请重试";
    default:
      return lastSyncLabel;
  }
}
