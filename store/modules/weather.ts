/**
 * 天气状态模块
 * 负责计算和管理情绪天气状态
 */

import { MoodEntry, Status, WeatherState } from '../../types';
import { WeatherModule } from './types';

/**
 * 天气阈值配置
 */
const WEATHER_THRESHOLDS = {
  cloudy: 10,
  rainy: 20,
  stormy: 30,
} as const;

/**
 * 创建天气状态模块
 */
export const createWeatherModule = (
  set: (partial: Partial<WeatherModule>) => void,
  get: () => WeatherModule & { entries: MoodEntry[] }
): WeatherModule => ({
  weather: {
    score: 0,
    condition: 'sunny',
    description: '关系晴朗',
  },

  /**
   * 设置天气状态
   */
  _setWeather: (weather: WeatherState) => {
    set({ weather });
  },

  /**
   * 计算天气状态
   * 基于活跃情绪记录的情绪等级总和
   */
  _calculateWeather: () => {
    const { entries } = get();
    
    // 只计算活跃状态的条目
    const activeEntries = entries.filter((e) => e.status === Status.ACTIVE);
    
    // 计算情绪分数：情绪等级 * 2
    const score = activeEntries.reduce(
      (acc, curr) => acc + curr.moodLevel * 2,
      0
    );

    // 根据分数确定天气状态
    let condition: WeatherState['condition'] = 'sunny';
    let description = '相处不错哦~';

    if (score > WEATHER_THRESHOLDS.stormy) {
      condition = 'stormy';
      description = '预警！关系需要紧急维护！';
    } else if (score > WEATHER_THRESHOLDS.rainy) {
      condition = 'rainy';
      description = '建议安排一次深度沟通';
    } else if (score > WEATHER_THRESHOLDS.cloudy) {
      condition = 'cloudy';
      description = '有些小情绪，需要关注';
    }

    set({ weather: { score, condition, description } });
  },
});

/**
 * 获取天气状态的颜色
 */
export const getWeatherColor = (condition: WeatherState['condition']): string => {
  const colors = {
    sunny: '#FCD34D',
    cloudy: '#9CA3AF',
    rainy: '#60A5FA',
    stormy: '#DC2626',
  };
  return colors[condition];
};

/**
 * 获取天气状态的图标名称
 */
export const getWeatherIcon = (condition: WeatherState['condition']): string => {
  const icons = {
    sunny: 'Sun',
    cloudy: 'Cloud',
    rainy: 'CloudRain',
    stormy: 'CloudLightning',
  };
  return icons[condition];
};
