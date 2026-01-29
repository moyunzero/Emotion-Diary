/**
 * 天气状态模块测试
 */

import { createWeatherModule, getWeatherColor, getWeatherIcon } from '../../../store/modules/weather';
import { MoodEntry, MoodLevel, Status } from '../../../types';

describe('Weather Module', () => {
  describe('createWeatherModule', () => {
    let weatherModule: ReturnType<typeof createWeatherModule>;
    let mockSet: jest.Mock;
    let mockGet: jest.Mock;

    beforeEach(() => {
      mockSet = jest.fn();
      mockGet = jest.fn();
      weatherModule = createWeatherModule(mockSet, mockGet);
    });

    it('should initialize with default weather', () => {
      expect(weatherModule.weather).toEqual({
        score: 0,
        condition: 'sunny',
        description: '关系晴朗',
      });
    });

    it('should set weather state', () => {
      const newWeather = {
        score: 15,
        condition: 'cloudy' as const,
        description: '有些小情绪',
      };

      weatherModule._setWeather(newWeather);

      expect(mockSet).toHaveBeenCalledWith({ weather: newWeather });
    });

    describe('_calculateWeather', () => {
      it('should calculate sunny weather for low scores', () => {
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

        weatherModule._calculateWeather();

        expect(mockSet).toHaveBeenCalledWith({
          weather: {
            score: 2, // MoodLevel.ANNOYED (1) * 2
            condition: 'sunny',
            description: '相处不错哦~',
          },
        });
      });

      it('should calculate cloudy weather for medium scores', () => {
        const entries: MoodEntry[] = [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: MoodLevel.ANGRY,
            content: 'Test 1',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.ACTIVE,
          },
          {
            id: '2',
            timestamp: Date.now(),
            moodLevel: MoodLevel.ANGRY,
            content: 'Test 2',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.ACTIVE,
          },
        ];

        mockGet.mockReturnValue({ entries });

        weatherModule._calculateWeather();

        expect(mockSet).toHaveBeenCalledWith({
          weather: {
            score: 12, // (MoodLevel.ANGRY (3) * 2) * 2 entries
            condition: 'cloudy',
            description: '有些小情绪，需要关注',
          },
        });
      });

      it('should calculate rainy weather for high scores', () => {
        const entries: MoodEntry[] = Array(4).fill(null).map((_, i) => ({
          id: `${i}`,
          timestamp: Date.now(),
          moodLevel: MoodLevel.ANGRY,
          content: `Test ${i}`,
          deadline: 'today',
          people: [],
          triggers: [],
          status: Status.ACTIVE,
        }));

        mockGet.mockReturnValue({ entries });

        weatherModule._calculateWeather();

        expect(mockSet).toHaveBeenCalledWith({
          weather: {
            score: 24, // (MoodLevel.ANGRY (3) * 2) * 4 entries
            condition: 'rainy',
            description: '建议安排一次深度沟通',
          },
        });
      });

      it('should calculate stormy weather for very high scores', () => {
        const entries: MoodEntry[] = Array(4).fill(null).map((_, i) => ({
          id: `${i}`,
          timestamp: Date.now(),
          moodLevel: MoodLevel.EXPLOSIVE,
          content: `Test ${i}`,
          deadline: 'today',
          people: [],
          triggers: [],
          status: Status.ACTIVE,
        }));

        mockGet.mockReturnValue({ entries });

        weatherModule._calculateWeather();

        expect(mockSet).toHaveBeenCalledWith({
          weather: {
            score: 40, // (MoodLevel.EXPLOSIVE (5) * 2) * 4 entries
            condition: 'stormy',
            description: '预警！关系需要紧急维护！',
          },
        });
      });

      it('should only count active entries', () => {
        const entries: MoodEntry[] = [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: MoodLevel.EXPLOSIVE,
            content: 'Active',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.ACTIVE,
          },
          {
            id: '2',
            timestamp: Date.now(),
            moodLevel: MoodLevel.EXPLOSIVE,
            content: 'Resolved',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.RESOLVED,
          },
          {
            id: '3',
            timestamp: Date.now(),
            moodLevel: MoodLevel.EXPLOSIVE,
            content: 'Burned',
            deadline: 'today',
            people: [],
            triggers: [],
            status: Status.BURNED,
          },
        ];

        mockGet.mockReturnValue({ entries });

        weatherModule._calculateWeather();

        expect(mockSet).toHaveBeenCalledWith({
          weather: {
            score: 10, // Only 1 active entry: MoodLevel.EXPLOSIVE (5) * 2
            condition: 'sunny',
            description: '相处不错哦~',
          },
        });
      });
    });
  });

  describe('getWeatherColor', () => {
    it('should return correct color for sunny', () => {
      expect(getWeatherColor('sunny')).toBe('#FCD34D');
    });

    it('should return correct color for cloudy', () => {
      expect(getWeatherColor('cloudy')).toBe('#9CA3AF');
    });

    it('should return correct color for rainy', () => {
      expect(getWeatherColor('rainy')).toBe('#60A5FA');
    });

    it('should return correct color for stormy', () => {
      expect(getWeatherColor('stormy')).toBe('#DC2626');
    });
  });

  describe('getWeatherIcon', () => {
    it('should return correct icon for sunny', () => {
      expect(getWeatherIcon('sunny')).toBe('Sun');
    });

    it('should return correct icon for cloudy', () => {
      expect(getWeatherIcon('cloudy')).toBe('Cloud');
    });

    it('should return correct icon for rainy', () => {
      expect(getWeatherIcon('rainy')).toBe('CloudRain');
    });

    it('should return correct icon for stormy', () => {
      expect(getWeatherIcon('stormy')).toBe('CloudLightning');
    });
  });
});
