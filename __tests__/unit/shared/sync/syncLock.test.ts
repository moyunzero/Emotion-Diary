/**
 * shared/sync/syncLock.ts — 同步互斥与 pending 标记
 */

import {
  consumePendingSyncRequest,
  hasPendingSyncRequest,
  isSyncLockHeld,
  releaseSyncLock,
  resetSyncLockForTests,
  tryBeginSync,
} from '../../../../shared/sync/syncLock';

describe('syncLock', () => {
  beforeEach(() => {
    resetSyncLockForTests();
  });

  it('首次 begin 成功并占用锁', () => {
    expect(tryBeginSync()).toEqual({ proceed: true });
    expect(isSyncLockHeld()).toBe(true);
  });

  it('并发 begin 标记 pending 并返回 busy', () => {
    tryBeginSync();
    expect(tryBeginSync()).toEqual({ proceed: false, reason: 'busy' });
    expect(hasPendingSyncRequest()).toBe(true);
  });

  it('release 后可再次 begin', () => {
    tryBeginSync();
    releaseSyncLock();
    expect(isSyncLockHeld()).toBe(false);
    expect(tryBeginSync()).toEqual({ proceed: true });
  });

  it('consumePendingSyncRequest 仅消费一次', () => {
    tryBeginSync();
    tryBeginSync();
    releaseSyncLock();
    expect(consumePendingSyncRequest()).toBe(true);
    expect(consumePendingSyncRequest()).toBe(false);
  });
});
