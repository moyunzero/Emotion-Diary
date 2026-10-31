import { Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, DESIGN_TOKENS } from '@/constants/colors';
import { useAppStore } from '../store/useAppStore';
import {
  computeWeatherNarrative,
  getWeatherEmptyReason,
} from '@/shared/weather/weatherNarrative';

const WeatherStationComponent: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const weather = useAppStore((state) => state.weather);
  const entries = useAppStore((state) => state.entries);

  // 天气配置：统一引用 COLORS.weatherCard 粉系 token
  const weatherConfig = useMemo(() => ({
    sunny: {
      icon: <Sun size={48} color={COLORS.weatherCard.sunny.icon} />,
      bgColor: COLORS.weatherCard.sunny.bg,
      textColor: COLORS.weatherCard.sunny.text,
    },
    cloudy: {
      icon: <Cloud size={48} color={COLORS.weatherCard.cloudy.icon} />,
      bgColor: COLORS.weatherCard.cloudy.bg,
      textColor: COLORS.weatherCard.cloudy.text,
    },
    rainy: {
      icon: <CloudRain size={48} color={COLORS.weatherCard.rainy.icon} />,
      bgColor: COLORS.weatherCard.rainy.bg,
      textColor: COLORS.weatherCard.rainy.text,
    },
    stormy: {
      icon: <CloudSnow size={48} color={COLORS.weatherCard.stormy.icon} />,
      bgColor: COLORS.weatherCard.stormy.bg,
      textColor: COLORS.weatherCard.stormy.text,
    },
  }), []);

  const emptyReason = useMemo(
    () => getWeatherEmptyReason(entries),
    [entries],
  );

  const currentWeather = useMemo(
    () =>
      emptyReason != null
        ? weatherConfig.cloudy
        : weatherConfig[weather.condition] || weatherConfig.sunny,
    [emptyReason, weather.condition, weatherConfig],
  );

  const narrativeLabel = useMemo((): string => {
    if (emptyReason != null) {
      return t(`weatherStation.empty.${emptyReason}`);
    }
    const { narrativeKey } = computeWeatherNarrative(entries, weather.condition);
    const translated = String(t(narrativeKey as never));
    if (translated !== narrativeKey) {
      return translated;
    }
    const fallbackKey = `weatherStation.descriptions.${weather.condition}` as const;
    const fallback = t(fallbackKey);
    return fallback === fallbackKey
      ? t('weatherStation.descriptions.sunny')
      : fallback;
  }, [emptyReason, entries, weather.condition, t]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: currentWeather.bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentWeather.textColor }]}>
          {t('weatherStation.title')}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        {currentWeather.icon}
      </View>

      <Text style={[styles.narrative, { color: currentWeather.textColor }]}>
        {narrativeLabel}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  narrative: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 22,
  },
});

/**
 * Memoized WeatherStation component
 * Since this component uses Zustand selectors internally and has no props,
 * React.memo will prevent re-renders when parent components re-render
 * but the Zustand state hasn't changed (Zustand handles its own optimization)
 */
const WeatherStation = React.memo(WeatherStationComponent);

export default WeatherStation;
