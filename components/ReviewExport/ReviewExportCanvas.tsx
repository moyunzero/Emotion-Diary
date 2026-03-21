import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { MOOD_CONFIG } from '../../constants';
import { calculateDaysAsOf } from '../../services/companionDaysService';
import { MoodEntry, MoodLevel } from '../../types';
import {
  compareResolutionToPreviousPeriod,
  getMonthlyResolutionRateSeries,
} from '../../utils/reviewStats';
import type { ExportWeatherBucket } from '../../utils/reviewStatsWeather';
import { getTopThreeWeatherBucketsByDays } from '../../utils/reviewStatsWeather';
import { getTopTriggersWithAdvice } from '../../utils/reviewStatsTriggers';
import type { ReviewExportPreset } from '../../utils/reviewStatsTimeRange';
import { getReviewExportPeriods } from '../../utils/reviewStatsTimeRange';
import { formatDateChinese } from '../../utils/dateUtils';
import { getMoodIcon } from '../../utils/moodIconUtils';
import { INSIGHTS_COLORS } from '../Insights/constants';

const BUCKET_TO_MOOD: Record<ExportWeatherBucket, MoodLevel> = {
  sunny: MoodLevel.ANNOYED,
  cloudy: MoodLevel.UPSET,
  rainy: MoodLevel.ANGRY,
  stormy: MoodLevel.FURIOUS,
};

/** 回顾图纵向节奏：8 的倍数，区块略松、图表区内略紧，偏「治愈花园」呼吸感 */
const GAP = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
} as const;

export interface ReviewExportCanvasProps {
  entries: MoodEntry[];
  firstEntryDate: number | null;
  preset: ReviewExportPreset;
  /** 用于环比小字，如「上一期」 */
  now: Date;
}

/**
 * 解决率 null 时展示「—」（与 2-UI-SPEC 一致）
 */
export const ReviewExportCanvas: React.FC<ReviewExportCanvasProps> = ({
  entries,
  firstEntryDate,
  preset,
  now,
}) => {
  const { current, previous } = useMemo(
    () => getReviewExportPeriods(now, preset),
    [now, preset],
  );

  const compare = useMemo(
    () =>
      compareResolutionToPreviousPeriod(
        entries,
        current.startMs,
        current.endMs,
        previous.startMs,
        previous.endMs,
      ),
    [entries, current, previous],
  );

  const companionDays = calculateDaysAsOf(firstEntryDate, current.endMs);

  const monthlySeries = useMemo(
    () => getMonthlyResolutionRateSeries(entries, 6, now),
    [entries, now],
  );

  const topWeather = useMemo(
    () => getTopThreeWeatherBucketsByDays(entries, current.startMs, current.endMs),
    [entries, current.startMs, current.endMs],
  );

  const topTriggers = useMemo(
    () => getTopTriggersWithAdvice(entries, current.startMs, current.endMs),
    [entries, current.startMs, current.endMs],
  );

  const ratePct =
    compare.current.resolutionRate === null
      ? null
      : Math.round(compare.current.resolutionRate * 100);

  const deltaPct =
    compare.deltaRate === null ? null : Math.round(compare.deltaRate * 100);

  const chartW = Math.min(
    320,
    Math.max(200, Dimensions.get('window').width - 72),
  );
  const chartH = 100;
  const barPad = 4;
  const n = Math.max(1, monthlySeries.length);
  const barW = (chartW - barPad * (n + 1)) / n;

  return (
    <View style={styles.root} collapsable={false}>
      <Text style={styles.rangeTitle}>
        {formatDateChinese(current.startMs)}～{formatDateChinese(current.endMs)}
      </Text>
      <Text style={styles.companionLine}>陪伴焚语第 {companionDays} 天</Text>

      <View style={styles.section}>
        <Text style={styles.rateLabel}>本期情绪解决率</Text>
        <Text style={styles.bigRate}>
          {ratePct === null ? '—' : `${ratePct}%`}
        </Text>
        <Text style={styles.deltaLine}>
          {deltaPct === null
            ? '本期暂无环比对比'
            : `${deltaPct >= 0 ? '↑' : '↓'}${Math.abs(deltaPct)}% vs 上一期`}
        </Text>
        <Text style={styles.smallCount}>
          本期共记录 {compare.current.total} 笔，已和解 {compare.current.resolved}{' '}
          笔
        </Text>
      </View>

      <View style={styles.trendBlock}>
        <Text style={styles.trendBlockTitle}>解决率趋势（近 6 个月）</Text>
        <View style={styles.svgWrap}>
        <Svg width={chartW} height={chartH}>
          {monthlySeries.map((pt, i) => {
            const r = pt.rate === null ? 0 : pt.rate;
            const h = Math.max(2, r * (chartH - 24));
            const x = barPad + i * (barW + barPad);
            const y = chartH - h - 8;
            return (
              <Rect
                key={`${pt.year}-${pt.monthIndex0}`}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill={INSIGHTS_COLORS.accent}
                opacity={0.85}
              />
            );
          })}
        </Svg>
        </View>
        <Text style={styles.trendHint}>数据已接入，样式可在后续版本美化</Text>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionAfterBlock]}>
        本期情绪气象站
      </Text>
      {topWeather.length === 0 ? (
        <Text style={styles.muted}>本期暂无天气分布数据</Text>
      ) : (
        topWeather.map((w) => {
          const mood = BUCKET_TO_MOOD[w.bucket];
          const iconName = MOOD_CONFIG[mood].iconName;
          const iconColor = MOOD_CONFIG[mood].iconColor;
          return (
            <View key={w.bucket} style={styles.weatherRow}>
              {getMoodIcon(iconName, iconColor, 22)}
              <Text style={styles.weatherText}>
                {w.labelZh} {w.days} 天
              </Text>
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, styles.sectionAfterBlock]}>
        Top 情绪触发
      </Text>
      {topTriggers.length === 0 ? (
        <Text style={styles.muted}>本期暂无触发器统计</Text>
      ) : (
        topTriggers.map((t) => (
          <View key={t.name} style={styles.triggerBlock}>
            <Text style={styles.triggerName}>
              {t.name} · {t.count} 次
            </Text>
            <Text style={styles.triggerAdvice}>{t.advice}</Text>
          </View>
        ))
      )}

      <View style={styles.placeholderAi}>
        <Text style={styles.aiEmoji}>💬</Text>
        <Text style={styles.aiText}>
          这个月你认真记录了自己的感受，这份温柔很值得被看见。焚语会一直在。
        </Text>
        <Text style={styles.aiHint}>（预览文案，完整版即将上线）</Text>
      </View>

      <Text style={styles.footerBrand}>焚语 · 情绪回顾</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    padding: 22,
    backgroundColor: INSIGHTS_COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.primary + '35',
  },
  rangeTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: INSIGHTS_COLORS.text,
  },
  companionLine: {
    marginTop: GAP.xs,
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginTop: GAP.md,
  },
  rateLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: GAP.sm,
    letterSpacing: 0.2,
  },
  bigRate: {
    fontFamily: 'Lato_700Bold',
    fontSize: 42,
    color: INSIGHTS_COLORS.accent,
    lineHeight: 48,
  },
  deltaLine: {
    marginTop: GAP.sm,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    lineHeight: 22,
  },
  smallCount: {
    marginTop: GAP.sm,
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 20,
  },
  trendBlock: {
    marginTop: GAP.lg,
    paddingHorizontal: GAP.md,
    paddingTop: GAP.md,
    paddingBottom: GAP.md + 2,
    backgroundColor: INSIGHTS_COLORS.bgStart,
    borderRadius: 12,
  },
  trendBlockTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    marginBottom: GAP.sm,
  },
  svgWrap: {
    alignItems: 'center',
    paddingVertical: GAP.xs,
  },
  sectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    marginBottom: GAP.sm,
  },
  sectionAfterBlock: {
    marginTop: GAP.xl,
  },
  trendHint: {
    marginTop: GAP.md,
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 16,
  },
  muted: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: INSIGHTS_COLORS.textSecondary,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GAP.sm,
  },
  weatherText: {
    marginLeft: 10,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
  },
  triggerBlock: {
    marginBottom: GAP.sm,
  },
  triggerName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: INSIGHTS_COLORS.text,
  },
  triggerAdvice: {
    marginTop: 4,
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 20,
  },
  placeholderAi: {
    marginTop: GAP.xl,
    paddingHorizontal: GAP.md,
    paddingVertical: GAP.md,
    backgroundColor: INSIGHTS_COLORS.primary + '18',
    borderRadius: 12,
  },
  aiEmoji: {
    fontSize: 18,
    marginBottom: GAP.xs,
  },
  aiText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: INSIGHTS_COLORS.text,
  },
  aiHint: {
    marginTop: 8,
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
  },
  footerBrand: {
    marginTop: GAP.lg,
    textAlign: 'center',
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: INSIGHTS_COLORS.textSecondary,
  },
});
