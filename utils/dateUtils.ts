/**
 * 时间戳格式化工具函数
 * 统一处理时间戳格式，确保跨时区一致性
 * 中文/月日展示请使用 @/shared/formatting
 */

/**
 * 格式化日期为本地日期字符串（YYYY-MM-DD格式，避免时区问题）
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化的日期字符串，如 "2024-01-15"
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  // 使用本地时区的年月日，避免跨时区问题
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * 确保时间戳为毫秒格式（如果数据库返回秒级时间戳，转换为毫秒）
 * @param timestamp 时间戳（可能是秒或毫秒）
 * @returns 毫秒级时间戳
 */
export const ensureMilliseconds = (timestamp: number): number => {
  // 10000000000 (10 billion) is year 2286 in seconds, and April 1970 in milliseconds.
  // This threshold safely distinguishes between seconds and milliseconds for practical dates.
  if (timestamp < 10000000000) {
    return timestamp * 1000;
  }
  return timestamp;
};
