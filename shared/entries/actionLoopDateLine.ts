/**
 * 行动闭环日期行：48h 再访窗口内显示约定日，过期后只锚到记录日（TRUST-02 / D-03、D-04）。
 * 纯函数：当前时间只经 `now` 注入，不读系统时钟。
 */

export const REVISIT_WINDOW_MS = 48 * 60 * 60 * 1000;

export type ActionLoopDateLine =
  | { readonly kind: 'revisit'; readonly timestamp: number }
  | { readonly kind: 'recorded'; readonly timestamp: number };

export function getActionLoopDateLine(
  latestTimestamp: number,
  now: number,
): ActionLoopDateLine {
  if (now < latestTimestamp + REVISIT_WINDOW_MS) {
    return {
      kind: 'revisit' as const,
      timestamp: latestTimestamp + REVISIT_WINDOW_MS,
    };
  }
  return {
    kind: 'recorded' as const,
    timestamp: latestTimestamp,
  };
}
