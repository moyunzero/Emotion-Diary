import { formatDateChinese } from "@/shared/formatting";
import { MessageCircle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { MOOD_CONFIG } from "../../constants";
import { MoodLevel } from "../../types";
import { getMoodIcon } from "../../utils/moodIconUtils";
import type { ReviewExportDerivedState } from "../../utils/reviewExportDerived";
import type { ExportWeatherBucket } from "../../utils/reviewStatsWeather";
import { INSIGHTS_COLORS } from "../Insights/constants";

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

export type ReviewExportAiStatus = "idle" | "loading" | "ready" | "fallback";

export interface ReviewExportCanvasProps {
  /** 与 AI 摘要同源的派生统计（画布不再重复计算） */
  derived: ReviewExportDerivedState;
  /** 底部温柔一句（由 Screen 调用 Groq 后传入） */
  closingLine: string;
  aiStatus: ReviewExportAiStatus;
}

/**
 * 解决率 null 时展示「—」（与 2-UI-SPEC 一致）
 */
export const ReviewExportCanvas: React.FC<ReviewExportCanvasProps> = ({
  derived,
  closingLine,
  aiStatus,
}) => {
  const {
    current,
    compare,
    companionDays,
    monthlySeries,
    topWeather,
    topTriggers,
  } = derived;

  const ratePct =
    compare.current.resolutionRate === null
      ? null
      : Math.round(compare.current.resolutionRate * 100);

  const deltaPct =
    compare.deltaRate === null ? null : Math.round(compare.deltaRate * 100);

  const { width: windowWidth } = useWindowDimensions();
  const chartW = Math.min(320, Math.max(200, windowWidth - 72));
  const chartH = 100;
  /** 与旧版 SVG 公式一致：柱宽 ≈ (可用宽 − 间距) / n，在 flex 列内用百分比还原 */
  const n = Math.max(1, monthlySeries.length);
  const MARGIN_H = 24;
  const BAR_GAP = 12;
  const barWFrac =
    n > 0
      ? (chartW - 2 * MARGIN_H - (n - 1) * BAR_GAP) / n / (chartW / n)
      : 0.66;
  const hasMonthlyData = monthlySeries.some((pt) => pt.rate !== null);

  return (
    <View style={styles.root} collapsable={false}>
      <Text style={styles.rangeTitle}>
        {formatDateChinese(current.startMs)}～{formatDateChinese(current.endMs)}
      </Text>
      <Text style={styles.companionLine}>陪伴心晴MO第 {companionDays} 天</Text>

      <View style={styles.section}>
        <Text style={styles.rateLabel}>本期情绪解决率</Text>
        <Text style={styles.bigRate}>
          {ratePct === null ? "—" : `${ratePct}%`}
        </Text>
        <Text style={styles.deltaLine}>
          {deltaPct === null
            ? "本期暂无环比对比"
            : `${deltaPct >= 0 ? "↑" : "↓"}${Math.abs(deltaPct)}% vs 上一期`}
        </Text>
        <Text style={styles.smallCount}>
          本期共记录 {compare.current.total} 笔，已和解{" "}
          {compare.current.resolved} 笔
        </Text>
      </View>

      <View style={styles.trendBlock}>
        <Text style={styles.trendBlockTitle}>解决率趋势（近 6 个月）</Text>
        <Text style={styles.trendCaption}>
          柱高代表当月已和解占比，月份从左到右由旧到新
        </Text>
        {!hasMonthlyData ? (
          <Text style={styles.trendEmptyHint}>
            最近 6 个月暂无记录，先从一条小情绪开始。
          </Text>
        ) : null}
        <View style={[styles.svgWrap, { width: chartW }]}>
          <View style={styles.trendChartRow}>
            {monthlySeries.map((pt) => {
              const h =
                pt.rate === null ? 0 : Math.max(2, pt.rate * (chartH - 24));
              return (
                <View
                  key={`${pt.year}-${pt.monthIndex0}`}
                  style={styles.trendChartCol}
                >
                  <View style={[styles.trendBarTrack, { height: chartH }]}>
                    {h > 0 ? (
                      <View
                        style={[
                          styles.trendBarFill,
                          {
                            width: `${Number((barWFrac * 100).toFixed(2))}%`,
                            height: h,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.monthLabel, styles.trendMonthLabelSpacing]}
                  >
                    {pt.monthIndex0 + 1}月
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
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
        <View style={styles.aiIconWrap}>
          <MessageCircle size={20} color={INSIGHTS_COLORS.textSecondary} />
        </View>
        {aiStatus === "loading" && (
          <Text style={styles.aiLoading}>正在写一句话…</Text>
        )}
        <Text style={styles.aiText}>{closingLine}</Text>
        {(aiStatus === "fallback" || aiStatus === "ready") && (
          <Text style={styles.aiHint}>
            {aiStatus === "fallback" ? "当前为默认文案" : "由 AI 生成"}
          </Text>
        )}
      </View>

      <Text style={styles.footerBrand}>心晴MO · 情绪回顾</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    padding: 22,
    backgroundColor: INSIGHTS_COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.primary + "35",
  },
  rangeTitle: {
    fontFamily: "Lato_700Bold",
    fontSize: 18,
    color: INSIGHTS_COLORS.text,
  },
  companionLine: {
    marginTop: GAP.xs,
    fontFamily: "Lato_400Regular",
    fontSize: 14,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginTop: GAP.md,
  },
  rateLabel: {
    fontFamily: "Lato_400Regular",
    fontSize: 13,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: GAP.sm,
    letterSpacing: 0.2,
  },
  bigRate: {
    fontFamily: "Lato_700Bold",
    fontSize: 42,
    color: INSIGHTS_COLORS.accent,
    lineHeight: 48,
  },
  deltaLine: {
    marginTop: GAP.sm,
    fontFamily: "Lato_400Regular",
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    lineHeight: 22,
  },
  smallCount: {
    marginTop: GAP.sm,
    fontFamily: "Lato_400Regular",
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
    fontFamily: "Lato_700Bold",
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    marginBottom: GAP.xs,
  },
  trendCaption: {
    fontFamily: "Lato_400Regular",
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: GAP.sm,
    lineHeight: 16,
  },
  trendEmptyHint: {
    fontFamily: "Lato_400Regular",
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: GAP.xs,
    lineHeight: 16,
  },
  svgWrap: {
    alignSelf: "center",
    paddingVertical: GAP.xs,
  },
  trendChartRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-end",
  },
  trendChartCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  trendBarTrack: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  trendBarFill: {
    backgroundColor: INSIGHTS_COLORS.accent,
    opacity: 0.85,
    borderRadius: 4,
  },
  trendMonthLabelSpacing: {
    marginTop: 6,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: GAP.sm,
  },
  monthCell: {
    alignItems: "center",
  },
  monthLabel: {
    fontFamily: "Lato_400Regular",
    fontSize: 10,
    color: INSIGHTS_COLORS.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Lato_700Bold",
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
    marginBottom: GAP.sm,
  },
  sectionAfterBlock: {
    marginTop: GAP.xl,
  },
  muted: {
    fontFamily: "Lato_400Regular",
    fontSize: 14,
    color: INSIGHTS_COLORS.textSecondary,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: GAP.sm,
  },
  weatherText: {
    marginLeft: 10,
    fontFamily: "Lato_400Regular",
    fontSize: 15,
    color: INSIGHTS_COLORS.text,
  },
  triggerBlock: {
    marginBottom: GAP.sm,
  },
  triggerName: {
    fontFamily: "Lato_700Bold",
    fontSize: 14,
    color: INSIGHTS_COLORS.text,
  },
  triggerAdvice: {
    marginTop: 4,
    fontFamily: "Lato_400Regular",
    fontSize: 13,
    color: INSIGHTS_COLORS.textSecondary,
    lineHeight: 20,
  },
  placeholderAi: {
    marginTop: GAP.xl,
    paddingHorizontal: GAP.md,
    paddingVertical: GAP.md,
    backgroundColor: INSIGHTS_COLORS.primary + "18",
    borderRadius: 12,
  },
  aiIconWrap: {
    marginBottom: GAP.xs,
  },
  aiText: {
    fontFamily: "Lato_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: INSIGHTS_COLORS.text,
  },
  aiHint: {
    marginTop: 8,
    fontFamily: "Lato_400Regular",
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
  },
  aiLoading: {
    fontFamily: "Lato_400Regular",
    fontSize: 11,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: GAP.xs,
  },
  footerBrand: {
    marginTop: GAP.lg,
    textAlign: "center",
    fontFamily: "Lato_400Regular",
    fontSize: 12,
    color: INSIGHTS_COLORS.textSecondary,
  },
});
