/**
 * AI 功能模块测试
 */

import { createAIModule, isForecastExpired, isPodcastExpired } from '../../../store/modules/ai';
import { EmotionForecast, EmotionPodcast, MoodEntry, MoodLevel, Status } from '../../../types';
import * as aiService from '../../../utils/aiService';

// Mock AI service
jest.mock('../../../utils/aiService');

describe('AI Module', () => {
  describe('createAIModule', () => {
    let aiModule: ReturnType<typeof createAIModule>;
    let mockSet: jest.Mock;
    let mockGet: jest.Mock;

    beforeEach(() => {
      mockSet = jest.fn();
      mockGet = jest.fn();
      aiModule = createAIModule(mockSet, mockGet);
      jest.clearAllMocks();
    });

    it('should initialize with null values', () => {
      expect(aiModule.emotionForecast).toBeNull();
      expect(aiModule.emotionPodcast).toBeNull();
    });

    describe('generateForecast', () => {
      it('should generate forecast with sufficient data', async () => {
        const entries: MoodEntry[] = Array(5).fill(null).map((_, i) => ({
          id: `${i}`,
          timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
          moodLevel: MoodLevel.ANNOYED,
          content: `Test ${i}`,
          deadline: 'today',
          people: [],
          triggers: [],
          status: Status.ACTIVE,
        }));

        const mockForecast: EmotionForecast = {
          predictions: [],
          warnings: [],
          summary: 'Test forecast',
        };

        mockGet.mockReturnValue({ entries });
        (aiService.predictEmotionTrend as jest.Mock).mockResolvedValue(mockForecast);

        await aiModule.generateForecast(7);

        expect(aiService.predictEmotionTrend).toHaveBeenCalledWith(entries, 7);
        expect(mockSet).toHaveBeenCalledWith({
          emotionForecast: {
            ...mockForecast,
            lastUpdated: expect.any(Number),
          },
        });
      });

      it('should not generate forecast with insufficient data', async () => {
        const entries: MoodEntry[] = [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: MoodLevel.ANNOYED,
            content: 'Test',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.ACTIVE,
          },
        ];

        mockGet.mockReturnValue({ entries });

        await aiModule.generateForecast();

        expect(aiService.predictEmotionTrend).not.toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith({ emotionForecast: null });
      });

      it('should handle errors gracefully', async () => {
        const entries: MoodEntry[] = Array(5).fill(null).map((_, i) => ({
          id: `${i}`,
          timestamp: Date.now(),
          moodLevel: MoodLevel.ANNOYED,
          content: `Test ${i}`,
          deadline: 'today',
          people: [],
          triggers: [],
          status: Status.ACTIVE,
        }));

        mockGet.mockReturnValue({ entries });
        (aiService.predictEmotionTrend as jest.Mock).mockRejectedValue(new Error('AI error'));

        await aiModule.generateForecast();

        expect(mockSet).toHaveBeenCalledWith({ emotionForecast: null });
      });
    });

    describe('generatePodcast', () => {
      it('should generate podcast successfully', async () => {
        const entries: MoodEntry[] = [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: MoodLevel.ANNOYED,
            content: 'Test',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.ACTIVE,
          },
        ];

        mockGet.mockReturnValue({ entries });
        (aiService.generateEmotionPodcast as jest.Mock).mockResolvedValue('Test podcast content');

        await aiModule.generatePodcast('week');

        expect(aiService.generateEmotionPodcast).toHaveBeenCalledWith(entries, 'week');
        expect(mockSet).toHaveBeenCalledWith({
          emotionPodcast: {
            content: 'Test podcast content',
            period: 'week',
            generatedAt: expect.any(Number),
          },
        });
      });

      it('should not set podcast if content is null', async () => {
        const entries: MoodEntry[] = [];

        mockGet.mockReturnValue({ entries });
        (aiService.generateEmotionPodcast as jest.Mock).mockResolvedValue(null);

        await aiModule.generatePodcast();

        expect(mockSet).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        const entries: MoodEntry[] = [];

        mockGet.mockReturnValue({ entries });
        (aiService.generateEmotionPodcast as jest.Mock).mockRejectedValue(new Error('AI error'));

        await aiModule.generatePodcast();

        expect(mockSet).toHaveBeenCalledWith({ emotionPodcast: null });
      });
    });

    describe('clearForecast', () => {
      it('should clear forecast', () => {
        aiModule.clearForecast();
        expect(mockSet).toHaveBeenCalledWith({ emotionForecast: null });
      });
    });

    describe('clearPodcast', () => {
      it('should clear podcast', () => {
        aiModule.clearPodcast();
        expect(mockSet).toHaveBeenCalledWith({ emotionPodcast: null });
      });
    });
  });

  describe('isForecastExpired', () => {
    it('should return true for null forecast', () => {
      expect(isForecastExpired(null)).toBe(true);
    });

    it('should return true for forecast without lastUpdated', () => {
      const forecast: EmotionForecast = {
        predictions: [],
        warnings: [],
        summary: 'Test',
      };
      expect(isForecastExpired(forecast)).toBe(true);
    });

    it('should return false for recent forecast', () => {
      const forecast: EmotionForecast = {
        predictions: [],
        warnings: [],
        summary: 'Test',
        lastUpdated: Date.now(),
      };
      expect(isForecastExpired(forecast)).toBe(false);
    });

    it('should return true for expired forecast', () => {
      const forecast: EmotionForecast = {
        predictions: [],
        warnings: [],
        summary: 'Test',
        lastUpdated: Date.now() - 13 * 60 * 60 * 1000, // 13 hours ago
      };
      expect(isForecastExpired(forecast)).toBe(true);
    });

    it('should respect custom maxAge', () => {
      const forecast: EmotionForecast = {
        predictions: [],
        warnings: [],
        summary: 'Test',
        lastUpdated: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      };
      expect(isForecastExpired(forecast, 1 * 60 * 60 * 1000)).toBe(true); // 1 hour maxAge
      expect(isForecastExpired(forecast, 3 * 60 * 60 * 1000)).toBe(false); // 3 hours maxAge
    });
  });

  describe('isPodcastExpired', () => {
    it('should return true for null podcast', () => {
      expect(isPodcastExpired(null)).toBe(true);
    });

    it('should return false for recent podcast', () => {
      const podcast: EmotionPodcast = {
        content: 'Test',
        period: 'week',
        generatedAt: Date.now(),
      };
      expect(isPodcastExpired(podcast)).toBe(false);
    });

    it('should return true for expired podcast', () => {
      const podcast: EmotionPodcast = {
        content: 'Test',
        period: 'week',
        generatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      expect(isPodcastExpired(podcast)).toBe(true);
    });

    it('should respect custom maxAge', () => {
      const podcast: EmotionPodcast = {
        content: 'Test',
        period: 'week',
        generatedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      };
      expect(isPodcastExpired(podcast, 1 * 60 * 60 * 1000)).toBe(true); // 1 hour maxAge
      expect(isPodcastExpired(podcast, 3 * 60 * 60 * 1000)).toBe(false); // 3 hours maxAge
    });
  });
});
