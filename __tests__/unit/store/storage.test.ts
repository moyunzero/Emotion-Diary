/**
 * 存储管理模块测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getStorageKey,
    loadFromStorage,
    mergeEntries,
    removeFromStorage,
    saveToStorage,
} from '../../../store/modules/storage';
import { MoodEntry, MoodLevel, Status } from '../../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('storage module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStorageKey', () => {
    it('should return guest key for null userId', () => {
      expect(getStorageKey(null)).toBe('mood_entries_guest');
    });

    it('should return user-specific key for userId', () => {
      expect(getStorageKey('user123')).toBe('mood_entries_user123');
    });
  });

  describe('mergeEntries', () => {
    const entry1: MoodEntry = {
      id: '1',
      timestamp: 1000,
      moodLevel: MoodLevel.ANNOYED,
      content: 'Test 1',
      deadline: 'today',
      people: [],
      triggers: [],
      status: Status.ACTIVE,
    };

    const entry2: MoodEntry = {
      id: '2',
      timestamp: 2000,
      moodLevel: MoodLevel.UPSET,
      content: 'Test 2',
      deadline: 'week',
      people: [],
      triggers: [],
      status: Status.ACTIVE,
    };

    const entry1Updated: MoodEntry = {
      ...entry1,
      timestamp: 3000,
      content: 'Test 1 Updated',
    };

    it('should merge entries without duplicates', () => {
      const result = mergeEntries([entry1], [entry2]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2'); // Sorted by timestamp desc
      expect(result[1].id).toBe('1');
    });

    it('should keep first entry on conflict with keep-first strategy', () => {
      const result = mergeEntries([entry1], [entry1Updated], 'keep-first');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test 1');
    });

    it('should keep second entry on conflict with keep-second strategy', () => {
      const result = mergeEntries([entry1], [entry1Updated], 'keep-second');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test 1 Updated');
    });

    it('should keep latest entry on conflict with keep-latest strategy', () => {
      const result = mergeEntries([entry1], [entry1Updated], 'keep-latest');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test 1 Updated');
      expect(result[0].timestamp).toBe(3000);
    });
  });

  describe('loadFromStorage', () => {
    it('should load entries from storage', async () => {
      const mockEntries = [
        { id: '1', timestamp: 1000, content: 'Test' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockEntries));

      const result = await loadFromStorage('test_key');
      expect(result).toEqual(mockEntries);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return empty array if no data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await loadFromStorage('test_key');
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await loadFromStorage('test_key');
      expect(result).toEqual([]);
    });
  });

  describe('saveToStorage', () => {
    it('should save entries to storage', async () => {
      const mockEntries: MoodEntry[] = [
        {
          id: '1',
          timestamp: 1000,
          moodLevel: MoodLevel.ANNOYED,
          content: 'Test',
          deadline: 'today',
          people: [],
          triggers: [],
          status: Status.ACTIVE,
        },
      ];
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await saveToStorage('test_key', mockEntries);
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify(mockEntries)
      );
    });

    it('should return false on error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await saveToStorage('test_key', []);
      expect(result).toBe(false);
    });
  });

  describe('removeFromStorage', () => {
    it('should remove data from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await removeFromStorage('test_key');
      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should return false on error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await removeFromStorage('test_key');
      expect(result).toBe(false);
    });
  });
});
