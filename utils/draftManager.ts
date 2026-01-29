import { StorageManager } from './storage';

const DRAFT_KEY = 'draft_entry';

/**
 * 草稿数据结构
 */
export interface DraftEntry {
  moodLevel: number;
  content: string;
  deadline: string;
  customDeadlineText: string;
  isCustomDeadline: boolean;
  selectedPeople: string[];
  selectedTriggers: string[];
}

/**
 * 保存草稿
 */
export const saveDraft = async (draft: DraftEntry): Promise<void> => {
  await StorageManager.set(DRAFT_KEY, draft);
};

/**
 * 加载草稿
 */
export const loadDraft = async (): Promise<DraftEntry | null> => {
  return StorageManager.get<DraftEntry | null>(DRAFT_KEY, null);
};

/**
 * 清除草稿
 */
export const clearDraft = async (): Promise<void> => {
  await StorageManager.remove(DRAFT_KEY);
};

/**
 * 检查是否有草稿
 */
export const hasDraft = async (): Promise<boolean> => {
  return StorageManager.has(DRAFT_KEY);
};

