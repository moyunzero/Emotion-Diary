import { Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DESIGN_TOKENS, SERIF_STACK } from '@/constants/colors';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAppStore } from '../store/useAppStore';
import {
  computeWeatherNarrative,
  getWeatherEmptyReason,
} from '@/shared/weather/weatherNarrative';

/** iOS needs PostScript face; family name `Songti SC` silently falls back to UI font (looks oversized/ugly). */
const BRAND_SERIF = Platform.select({
  ios: 'SongtiSC-Regular',
  android: 'serif',
  default: SERIF_STACK,
});

const WeatherStationComponent: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { colors } = useThemeStyles();
  const weather = useAppStore((state) => state.weather);
  const entries = useAppStore((state) => state.entries);

  const weatherConfig = useMemo(
    () => ({
      sunny: {
        icon: <Sun size={48} color={colors.weatherCard.sunny.icon} />,
        bgColor: colors.weatherCard.sunny.bg,
        textColor: colors.weatherCard.sunny.text,
      },
      cloudy: {
        icon: <Cloud size={48} color={colors.weatherCard.cloudy.icon} />,
        bgColor: colors.weatherCard.cloudy.bg,
        textColor: colors.weatherCard.cloudy.text,
      },
      rainy: {
        icon: <CloudRain size={48} color={colors.weatherCard.rainy.icon} />,
        bgColor: colors.weatherCard.rainy.bg,
        textColor: colors.weatherCard.rainy.text,
      },
      stormy: {
        icon: <CloudSnow size={48} color={colors.weatherCard.stormy.icon} />,
        bgColor: colors.weatherCard.stormy.bg,
        textColor: colors.weatherCard.stormy.text,
      },
    }),
    [colors.weatherCard],
  );

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

const NARRATIVE_SIZE = DESIGN_TOKENS.fontSize.xxl; // 22 — UI-SPEC brand sentence

const styles = StyleSheet.create({
  container: {
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    padding: DESIGN_TOKENS.spacing.pageX,
    marginHorizontal: DESIGN_TOKENS.spacing.pageX,
    ...DESIGN_TOKENS.shadow.none,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  /** Card eyebrow — quieter than page H1; was title/600 and competed with「情绪气象站」. */
  title: {
    fontSize: DESIGN_TOKENS.fontSize.caption,
    fontWeight: '600',
    letterSpacing: 0.4,
    opacity: 0.72,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  narrative: {
    fontFamily: BRAND_SERIF,
    fontSize: NARRATIVE_SIZE,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    marginTop: DESIGN_TOKENS.spacing.xs,
    // Chinese brand line needs a bit more air than Latin 1.45
    lineHeight: Math.round(NARRATIVE_SIZE * 1.55),
    letterSpacing: 0.5,
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
