import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { Sun } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '@/constants/colors';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { MOOD_CONFIG } from '../../constants';
import { MoodEntry } from '../../types';
import { getInsightsColors } from './constants';
import { getMoodFlowerStatus, getMoodWeatherIcon, getWeekDates, getWeekdayName, isToday } from './utils';

interface WeeklyMoodWeatherProps {
  readonly entries: MoodEntry[];
}

const WeeklyMoodWeatherComponent: React.FC<WeeklyMoodWeatherProps> = ({ entries }) => {
  const { t } = useTranslation('insights');
  const { padding, fontSize, spacing, borderRadius } = useResponsiveStyles();
  const { colors } = useThemeStyles();
  const insightsColors = useMemo(
    () => getInsightsColors(colors),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: insightsColors.cardBg,
          marginBottom: spacing.cardGap,
          padding: padding.card,
          borderRadius: borderRadius.card,
          ...DESIGN_TOKENS.shadow.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.hairline,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: spacing.component,
        },
        title: {
          fontSize: fontSize.cardTitle,
          fontWeight: 'bold',
          color: insightsColors.text,
        },
        weekContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        dayCard: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 2,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
        },
        todayCard: {
          backgroundColor: colors.mood.level1,
        },
        weekday: {
          fontSize: fontSize.small,
          fontWeight: '500',
          color: insightsColors.textSecondary,
          marginBottom: 8,
          alignSelf: 'stretch',
          textAlign: 'center',
        },
        todayText: {
          color: insightsColors.accent,
          fontWeight: 'bold',
        },
        iconContainer: {
          height: 32,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        },
        /** No-entry week day: dashed circle only (D-23); omit seed status label */
        emptyDayDot: {
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.text.tertiary,
          borderStyle: 'dashed',
          backgroundColor: 'transparent',
        },
        status: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
          textAlign: 'center',
          alignSelf: 'stretch',
          lineHeight: fontSize.small * 1.2,
        },
      }),
    [padding, fontSize, spacing, borderRadius, colors, insightsColors],
  );
  const weekDates = useMemo(() => getWeekDates(), []);

  // 计算每天的最高情绪等级
  const dailyMoods = useMemo(() => {
    return weekDates.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate >= dayStart && entryDate <= dayEnd;
      });

      if (dayEntries.length === 0) return null;

      // 返回当天最高情绪等级
      return Math.max(...dayEntries.map(e => {
        const config = MOOD_CONFIG[e.moodLevel];
        return config?.level || e.moodLevel;
      }));
    });
  }, [entries, weekDates]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sun size={20} color={insightsColors.accent} />
        <Text style={styles.title}>{t('weeklyWeather.title')}</Text>
      </View>
      <View style={styles.weekContainer}>
        {weekDates.map((date, index) => {
          const moodLevel = dailyMoods[index];
          const today = isToday(date);
          return (
            <View
              key={date.getTime()}
              style={[
                styles.dayCard,
                today && styles.todayCard,
              ]}
            >
              <Text style={[styles.weekday, today && styles.todayText]}>
                {getWeekdayName(date, t)}
              </Text>
              <View style={styles.iconContainer}>
                {moodLevel === null ? (
                  <View style={styles.emptyDayDot} testID="week-empty-day-dot" />
                ) : (
                  getMoodWeatherIcon(moodLevel, 28)
                )}
              </View>
              {moodLevel !== null ? (
                <Text style={[styles.status, today && styles.todayText]}>
                  {getMoodFlowerStatus(moodLevel, t)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const WeeklyMoodWeather = memo(WeeklyMoodWeatherComponent);
