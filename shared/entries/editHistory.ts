/**
 * 编辑历史的核心纯逻辑（抽自 store/modules/entries.ts 的 updateEntry）
 *
 * 之所以独立成模块，是为了：
 * 1. 在不挂依赖 Zustand / AsyncStorage 的前提下做单元测试（H4 回归点）。
 * 2. 把"快照构造 + 上限截断"两步分开，方便后续做诸如「跳过空更新」之类的策略调整。
 */

import { EditHistory, MoodEntry } from '../../types';

/**
 * 基于条目当前快照构造一条 EditHistory。
 *
 * 关键约定：
 * - `previousPeople` / `previousTriggers` **必须**做浅拷贝，
 *   否则后续对 entry.people 的写操作会反向污染历史快照。
 * - `editedAt` 由调用方注入，避免在测试中依赖 `Date.now()`。
 */
export function buildEditHistorySnapshot(
  entry: Pick<
    MoodEntry,
    'content' | 'moodLevel' | 'deadline' | 'people' | 'triggers'
  >,
  editedAt: number,
): EditHistory {
  return {
    editedAt,
    previousContent: entry.content,
    previousMoodLevel: entry.moodLevel,
    previousDeadline: entry.deadline,
    previousPeople: [...entry.people],
    previousTriggers: [...entry.triggers],
  };
}

/**
 * 把新快照追加到历史列表，并按 `limit` 保留最近 N 条。
 *
 * 约束：
 * - 不会修改入参 `currentHistory`（返回全新数组）。
 * - `limit <= 0` 视作"不保留任何历史"，返回 `[]`，避免负数 slice 反向行为。
 * - `currentHistory` 为 `undefined` 时按空数组处理。
 */
export function appendEditHistoryWithLimit(
  currentHistory: EditHistory[] | undefined,
  snapshot: EditHistory,
  limit: number,
): EditHistory[] {
  if (limit <= 0) {
    return [];
  }

  const base = currentHistory ?? [];
  return [...base, snapshot].slice(-limit);
}
