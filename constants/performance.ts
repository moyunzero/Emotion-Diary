/**
 * 性能相关常量（E-D · 008）
 */

/** FlashList 折叠态 EntryCard 典型高度（dp），含 margin */
export const DASHBOARD_ENTRY_ESTIMATED_SIZE = 148;

/** 回顾图 PNG 截图质量（0–1） */
export const REVIEW_EXPORT_CAPTURE_QUALITY = 0.92;

/** 回顾图截图输出最大宽度（px），超宽屏压采样以降低 OOM */
export const REVIEW_EXPORT_CAPTURE_MAX_WIDTH = 1080;

/**
 * 单用户条目规模设计参考上限（非运行时硬截断）。
 * 超出时主列表/Insights/导出仍可用，但滚动与首开可能变慢。
 */
export const LARGE_DATA_ENTRY_SOFT_LIMIT = 5000;
