import AsyncStorage from '@react-native-async-storage/async-storage';

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
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('保存草稿失败:', error);
  }
};

/**
 * 加载草稿
 */
export const loadDraft = async (): Promise<DraftEntry | null> => {
  try {
    const draft = await AsyncStorage.getItem(DRAFT_KEY);
    if (draft) {
      return JSON.parse(draft) as DraftEntry;
    }
    return null;
  } catch (error) {
    console.error('加载草稿失败:', error);
    return null;
  }
};

/**
 * 清除草稿
 */
export const clearDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('清除草稿失败:', error);
  }
};

/**
 * 检查是否有草稿
 */
export const hasDraft = async (): Promise<boolean> => {
  try {
    const draft = await AsyncStorage.getItem(DRAFT_KEY);
    return draft !== null;
  } catch (error) {
    console.error('检查草稿失败:', error);
    return false;
  }
};

