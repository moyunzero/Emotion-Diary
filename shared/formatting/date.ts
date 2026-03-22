export type DateInput = number | Date | null | undefined;

const DAY_MS = 24 * 60 * 60 * 1000;

function toValidDate(input: DateInput): Date | null {
  if (input == null) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatDateChinese(input: DateInput): string {
  const date = toValidDate(input);
  if (!date) return '日期未知';

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

export function formatMonthDay(input: DateInput): string {
  const date = toValidDate(input);
  if (!date) return '--/--';

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 格式化日期为本地日期字符串（YYYY-MM-DD格式，避免时区问题）
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 确保时间戳为毫秒格式（如果数据库返回秒级时间戳，转换为毫秒）
 */
export function ensureMilliseconds(timestamp: number): number {
  if (timestamp < 10000000000) {
    return timestamp * 1000;
  }
  return timestamp;
}

export function formatRelativeDayLabel(inputDate: DateInput, now: Date = new Date()): string {
  const target = toValidDate(inputDate);
  const nowDate = toValidDate(now);
  if (!target || !nowDate) return '未知时间';

  const diffDays = Math.round((startOfLocalDay(nowDate) - startOfLocalDay(target)) / DAY_MS);

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === -1) return '明天';
  if (diffDays > 1) return `${diffDays}天前`;
  return `${Math.abs(diffDays)}天后`;
}
