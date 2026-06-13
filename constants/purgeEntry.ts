/**
 * 永久删除（B4）用户可见文案
 */

export const PURGE_ENTRY_COPY = {
  confirmTitle: "永久删除",
  confirmMessage:
    "永久删除后无法从回收站恢复；若已登录，同步时也会从云端清除且不可通过「从云端合并」找回。确定继续？",
  confirmCancel: "取消",
  confirmOk: "永久删除",
  buttonLabel: "永久删除",
  accessibilityLabel: "永久删除这条记录",
  successToast: "已永久删除",
} as const;
