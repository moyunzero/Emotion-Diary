import { StorageManager } from './storage';

const CUSTOM_PEOPLE_KEY = 'custom_people';
const CUSTOM_TRIGGERS_KEY = 'custom_triggers';

/**
 * 自定义标签管理工具
 * 负责管理用户自定义的人物标签和触发器标签
 */

/**
 * 加载所有自定义标签
 * @returns 返回自定义人物和触发器标签数组
 */
export const loadCustomOptions = async (): Promise<{
  people: string[];
  triggers: string[];
}> => {
  const people = await StorageManager.get<string[]>(CUSTOM_PEOPLE_KEY, []);
  const triggers = await StorageManager.get<string[]>(CUSTOM_TRIGGERS_KEY, []);
  return { people, triggers };
};

/**
 * 保存自定义人物标签
 * @param people - 人物标签数组
 */
export const saveCustomPeople = async (people: string[]): Promise<void> => {
  const success = await StorageManager.set(CUSTOM_PEOPLE_KEY, people);
  if (!success) {
    throw new Error('保存自定义人物标签失败');
  }
};

/**
 * 保存自定义触发器标签
 * @param triggers - 触发器标签数组
 */
export const saveCustomTriggers = async (triggers: string[]): Promise<void> => {
  const success = await StorageManager.set(CUSTOM_TRIGGERS_KEY, triggers);
  if (!success) {
    throw new Error('保存自定义触发器标签失败');
  }
};

/**
 * 添加新的人物标签
 * @param currentOptions - 当前的人物标签数组
 * @param newPerson - 新的人物标签
 * @returns 更新后的人物标签数组
 */
export const addCustomPerson = async (
  currentOptions: string[],
  newPerson: string
): Promise<string[]> => {
  try {
    const trimmedPerson = newPerson.trim();
    if (!trimmedPerson) {
      return currentOptions;
    }
    
    // 避免重复
    if (currentOptions.includes(trimmedPerson)) {
      return currentOptions;
    }
    
    const updatedOptions = [...currentOptions, trimmedPerson];
    await saveCustomPeople(updatedOptions);
    return updatedOptions;
  } catch (error) {
    console.error('Error adding custom person:', error);
    throw error;
  }
};

/**
 * 添加新的触发器标签
 * @param currentOptions - 当前的触发器标签数组
 * @param newTrigger - 新的触发器标签
 * @returns 更新后的触发器标签数组
 */
export const addCustomTrigger = async (
  currentOptions: string[],
  newTrigger: string
): Promise<string[]> => {
  try {
    const trimmedTrigger = newTrigger.trim();
    if (!trimmedTrigger) {
      return currentOptions;
    }
    
    // 避免重复
    if (currentOptions.includes(trimmedTrigger)) {
      return currentOptions;
    }
    
    const updatedOptions = [...currentOptions, trimmedTrigger];
    await saveCustomTriggers(updatedOptions);
    return updatedOptions;
  } catch (error) {
    console.error('Error adding custom trigger:', error);
    throw error;
  }
};

/**
 * 删除人物标签
 * @param currentOptions - 当前的人物标签数组
 * @param personToRemove - 要删除的人物标签
 * @returns 更新后的人物标签数组
 */
export const removeCustomPerson = async (
  currentOptions: string[],
  personToRemove: string
): Promise<string[]> => {
  try {
    const updatedOptions = currentOptions.filter(p => p !== personToRemove);
    await saveCustomPeople(updatedOptions);
    return updatedOptions;
  } catch (error) {
    console.error('Error removing custom person:', error);
    throw error;
  }
};

/**
 * 删除触发器标签
 * @param currentOptions - 当前的触发器标签数组
 * @param triggerToRemove - 要删除的触发器标签
 * @returns 更新后的触发器标签数组
 */
export const removeCustomTrigger = async (
  currentOptions: string[],
  triggerToRemove: string
): Promise<string[]> => {
  try {
    const updatedOptions = currentOptions.filter(t => t !== triggerToRemove);
    await saveCustomTriggers(updatedOptions);
    return updatedOptions;
  } catch (error) {
    console.error('Error removing custom trigger:', error);
    throw error;
  }
};



