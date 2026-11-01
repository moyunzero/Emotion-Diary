import { countPendingEntries } from "@/shared/entries/dashboardFilter";
import { excludeSoftDeletedEntries } from "@/shared/entries/visibility";
import { DESIGN_TOKENS } from "@/constants/colors";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useResponsiveStyles } from "../../hooks/useResponsiveStyles";
import {
  clearPendingMilestone,
  loadPendingMilestone,
  markStageSeen,
  type GrowthStageId,
} from "../../services/gardenMilestone";
import { useAppStore } from "../../store/useAppStore";
import { Status } from "../../types";
import { AppScreenShell } from "../AppScreenShell";
import { WeeklyReviewBanner } from "../retention/WeeklyReviewBanner";
import { CareCountLine } from "./CareCountLine";
import { EmptyGarden } from "./EmptyGarden";
import { GardenHeader } from "./GardenHeader";
import { InsightsDeferredSections } from "./InsightsDeferredSections";
import { RelationshipGarden } from "./RelationshipGarden";
import { WeeklyMoodWeather } from "./WeeklyMoodWeather";

const InsightsComponent: React.FC = () => {
  const { t } = useTranslation("insights");
  const { colors } = useThemeStyles();
  const shellStyles = useMemo(
    () =>
      StyleSheet.create({
        contentWrapper: {
          width: "100%",
          marginHorizontal: "auto",
        },
        content: {},
        moreSection: {
          marginTop: DESIGN_TOKENS.spacing.xxxl,
        },
        moreHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        },
        moreHeaderPressed: {
          opacity: 0.72,
        },
        moreHeaderText: {
          fontSize: DESIGN_TOKENS.fontSize.base,
          fontWeight: "600",
          color: colors.text.secondary,
        },
      }),
    [colors],
  );
  const entries = useAppStore((state) => state.entries);
  const responsive = useResponsiveStyles();
  const { trigger } = useHapticFeedback();
  const tabBarHeight = useBottomTabBarHeight();
  const [pendingStage, setPendingStage] = useState<GrowthStageId | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const userId = useAppStore((state) => state.user?.id ?? null);

  useEffect(() => {
    void loadPendingMilestone(userId).then((pending) => {
      if (pending?.stage && pending.stage !== "seed") {
        setPendingStage(pending.stage);
      }
    });
  }, [userId]);

  const handleMilestoneShown = useCallback(async (stage: GrowthStageId) => {
    trigger("success");
    await markStageSeen(userId, stage);
    await clearPendingMilestone(userId);
    setPendingStage(null);
  }, [trigger, userId]);

  const visibleEntries = useMemo(
    () => excludeSoftDeletedEntries(entries),
    [entries],
  );

  // 计算统计数据（优化：合并多次遍历为单次遍历）
  const stats = useMemo(() => {
    if (visibleEntries.length === 0) {
      return {
        total: 0,
        resolved: 0,
        pending: 0,
        thisMonthCount: 0,
        lastMonthCount: 0,
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1).getTime();
    const startOfLastMonth = new Date(
      currentYear,
      currentMonth - 1,
      1,
    ).getTime();

    // 单次遍历计算所有统计数据
    let resolvedCount = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    visibleEntries.forEach((e) => {
      if (e.status === Status.RESOLVED) {
        resolvedCount++;
      }
      if (e.timestamp >= startOfThisMonth) {
        thisMonthCount++;
      } else if (
        e.timestamp >= startOfLastMonth &&
        e.timestamp < startOfThisMonth
      ) {
        lastMonthCount++;
      }
    });

    return {
      total: visibleEntries.length,
      resolved: resolvedCount,
      pending: countPendingEntries(visibleEntries),
      thisMonthCount,
      lastMonthCount,
    };
  }, [visibleEntries]);

  // 获取最大内容宽度和实际padding
  const maxWidth = responsive.layout.maxContentWidth;
  const horizontalPadding = responsive.padding.horizontal;

  // 如果没有任何条目，显示整体空状态
  if (visibleEntries.length === 0) {
    return (
      <AppScreenShell edges={["top", "left", "right"]} showHeader={false}>
        <View
          testID="insights-screen"
          style={{ flex: 1, paddingBottom: tabBarHeight }}
        >
          <EmptyGarden />
        </View>
      </AppScreenShell>
    );
  }

  return (
    <AppScreenShell
      edges={["top", "left", "right"]}
      showHeader={false}
      scrollable
      removeClippedSubviews
      contentContainerStyle={{ paddingBottom: tabBarHeight }}
    >
      <View testID="insights-screen" style={{ flex: 1 }}>
      {/* 内容包装器 - 在大屏设备上居中显示 */}
      <View style={[shellStyles.contentWrapper, { maxWidth }]}>
        {/* 花园主题头部 */}
        <GardenHeader
          totalEntries={stats.total}
          resolvedCount={stats.resolved}
        />

        <View
          style={[shellStyles.content, { paddingHorizontal: horizontalPadding }]}
        >
          <WeeklyReviewBanner entries={visibleEntries} />

          {/* First screen (D-18): 本周 → 关系 → 照料 */}
          <WeeklyMoodWeather entries={visibleEntries} />
          <RelationshipGarden entries={visibleEntries} />
          <CareCountLine entries={visibleEntries} />

          {/* 「更多回看」 accordion (D-22 / D-26) — default collapsed; no persist */}
          <View style={shellStyles.moreSection}>
            <Pressable
              testID="insights-more-accordion"
              style={({ pressed }) => [
                shellStyles.moreHeader,
                pressed && shellStyles.moreHeaderPressed,
              ]}
              onPress={() => setMoreOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: moreOpen }}
              accessibilityLabel={t("more.toRevisit")}
            >
              <Text style={shellStyles.moreHeaderText}>{t("more.toRevisit")}</Text>
              {moreOpen ? (
                <ChevronUp size={18} color={colors.text.secondary} />
              ) : (
                <ChevronDown size={18} color={colors.text.secondary} />
              )}
            </Pressable>

            <InsightsDeferredSections
              expanded={moreOpen}
              entries={visibleEntries}
              thisMonthCount={stats.thisMonthCount}
              lastMonthCount={stats.lastMonthCount}
              resolvedCount={stats.resolved}
              totalCount={stats.total}
              pendingCount={stats.pending}
              pendingStage={pendingStage}
              onMilestoneShown={handleMilestoneShown}
            />
          </View>
        </View>
      </View>
      </View>
    </AppScreenShell>
  );
};

export default React.memo(InsightsComponent);
