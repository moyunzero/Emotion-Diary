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
 * 归一化 deadline：自定义时取文案或「未定」
 */
export const normalizeDeadline = (
  isCustomDeadline: boolean,
  customDeadlineText: string,
  presetDeadline: string
): string => {
  return isCustomDeadline ? (customDeadlineText.trim() || '未定') : presetDeadline;
};
