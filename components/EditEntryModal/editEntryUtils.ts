/**
 * 纯函数工具：与 React 无关的 EditEntryModal 计算逻辑
 */

/**
 * Toggle an item in a list (add if not present, remove if present)
 */
export const toggleSelection = <T,>(list: T[], item: T): T[] => {
  if (list.includes(item)) {
    return list.filter((i) => i !== item);
  }
  return [...list, item];
};

/**
 * 归一化自定义截止日期文本（空文本返回「未定」）
 */
export const normalizeCustomDeadline = (customText: string): string => {
  return customText.trim() || '未定';
};

/**
 * 归一化预设截止日期（直接返回）
 */
export const normalizePresetDeadline = (presetKey: string): string => {
  return presetKey;
};

/**
 * 根据类型归一化截止日期
 * @deprecated 建议直接使用 normalizeCustomDeadline 或 normalizePresetDeadline
 */
export const normalizeDeadline = (
  isCustomDeadline: boolean,
  customDeadlineText: string,
  presetDeadline: string
): string => {
  return isCustomDeadline 
    ? normalizeCustomDeadline(customDeadlineText) 
    : normalizePresetDeadline(presetDeadline);
};
