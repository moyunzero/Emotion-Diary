/**
 * constants/syncDataOps.ts — 状态文案
 */

import {
  formatStoreSyncStatusLabel,
  SYNC_DATA_OPS,
} from '../../../constants/syncDataOps';

describe('formatStoreSyncStatusLabel', () => {
  it('syncing / pending / error 有固定文案', () => {
    expect(formatStoreSyncStatusLabel('syncing', '最后同步：刚刚')).toBe(
      '正在同步…',
    );
    expect(formatStoreSyncStatusLabel('pending', '最后同步：刚刚')).toBe(
      '同步排队中…',
    );
    expect(formatStoreSyncStatusLabel('error', '最后同步：刚刚')).toBe(
      '上次同步失败，请重试',
    );
  });

  it('idle 使用最后同步文案', () => {
    expect(formatStoreSyncStatusLabel('idle', '最后同步：1分钟前')).toBe(
      '最后同步：1分钟前',
    );
  });
});

describe('SYNC_DATA_OPS', () => {
  it('上传与合并标题不同', () => {
    expect(SYNC_DATA_OPS.uploadTitle).not.toBe(SYNC_DATA_OPS.pullTitle);
  });
});
