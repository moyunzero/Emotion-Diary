import { Sun } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MOOD_CONFIG } from '../../constants';
import { MoodEntry } from '../../types';
import { responsiveBorderRadius, responsiveFontSize, responsivePadding, responsiveSpacing } from '../../utils/responsiveUtils';
import { INSIGHTS_COLORS } from './constants';
import { getMoodFlowerStatus, getMoodWeatherIcon, getWeekDates, getWeekdayName, isToday } from './utils';

interface WeeklyMoodWeatherProps {
  entries: MoodEntry[];
}

const WeeklyMoodWeatherComponent: React.FC<WeeklyMoodWeatherProps> = ({ entries }) => {
  const weekDates = getWeekDates();

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
        <Sun size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>本周情绪天气</Text>
      </View>
      <View style={styles.weekContainer}>
        {weekDates.map((date, index) => {
          const moodLevel = dailyMoods[index];
          const today = isToday(date);
          return (
            <View
              key={index}
              style={[
                styles.dayCard,
                today && styles.todayCard,
              ]}
            >
              <Text style={[styles.weekday, today && styles.todayText]}>
                {getWeekdayName(date)}
              </Text>
              <View style={styles.iconContainer}>
                {getMoodWeatherIcon(moodLevel, 28)}
              </View>
              <Text style={[styles.status, today && styles.todayText]}>
                {getMoodFlowerStatus(moodLevel)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: INSIGHTS_COLORS.cardBg,
    marginBottom: responsiveSpacing.cardGap(),
    padding: responsivePadding.card(),
    borderRadius: responsiveBorderRadius.card(),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: responsiveSpacing.component(16),
  },
  title: {
    fontSize: responsiveFontSize.cardTitle(16),
    fontWeight: 'bold',
    color: INSIGHTS_COLORS.text,
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
    borderRadius: 12,
  },
  todayCard: {
    backgroundColor: '#FFF1F2',
  },
  weekday: {
    fontSize: responsiveFontSize.small(12),
    fontWeight: '500',
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: 8,
    height: 16,
  },
  todayText: {
    color: INSIGHTS_COLORS.accent,
    fontWeight: 'bold',
  },
  iconContainer: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: responsiveFontSize.small(10),
    color: INSIGHTS_COLORS.textSecondary,
    textAlign: 'center',
    height: 28,
    lineHeight: 14,
  },
});

export const WeeklyMoodWeather = memo(WeeklyMoodWeatherComponent);
