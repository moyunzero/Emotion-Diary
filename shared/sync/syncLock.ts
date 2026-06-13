/**
 * 进程内同步互斥锁：`syncToCloud` 与 `syncFromCloud` 共用，防止并发拉/推。
 * 第二个请求标记 pending，由 `processPendingSync` 在释放后防抖执行 `syncToCloud`。
 */

let held = false;
let pending = false;

export type SyncLockBusyReason = "busy";

/** 尝试占用锁；若已有同步在进行则标记 pending 并返回 busy。 */
export function tryBeginSync():
  | { proceed: true }
  | { proceed: false; reason: SyncLockBusyReason } {
  if (held) {
    pending = true;
    return { proceed: false, reason: "busy" };
  }
  held = true;
  return { proceed: true };
}

/** 同步流程结束（成功或失败）后释放锁。 */
export function releaseSyncLock(): void {
  held = false;
}

export function isSyncLockHeld(): boolean {
  return held;
}

export function hasPendingSyncRequest(): boolean {
  return pending;
}

/** 消费 pending 标记（仅 processPendingSync 调用）。 */
export function consumePendingSyncRequest(): boolean {
  if (!pending) return false;
  pending = false;
  return true;
}

/** 单测重置 */
export function resetSyncLockForTests(): void {
  held = false;
  pending = false;
}
