import { useRouter } from "expo-router";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { MoodEntry } from "../../types";
import type { GrowthStageId } from "../../services/gardenMilestone";
import EmotionPodcast from "../ai/EmotionPodcast";
import { OnThisDayInsightsCard } from "../onThisDay/OnThisDayInsightsCard";
import { EmotionForecastSection } from "./EmotionForecastSection";
import { EmotionReleaseArchive } from "./EmotionReleaseArchive";
import { GardenFooter } from "./GardenFooter";
import { HealingProgress } from "./HealingProgress";
import { TriggerInsight } from "./TriggerInsight";
import { getInsightsColors } from "./constants";

type InsightsDeferredSectionsProps = {
  expanded: boolean;
  entries: MoodEntry[];
  thisMonthCount: number;
  lastMonthCount: number;
  resolvedCount: number;
  totalCount: number;
  pendingStage: GrowthStageId | null;
  onMilestoneShown: (stage: GrowthStageId) => void;
};

/**
 * 「更多回看」展开内容：交互结束后再挂载，减轻首开主线程压力。
 * Collapsed → null（不阻塞花园首屏）；expanded → InteractionManager lazy mount.
 */
export function InsightsDeferredSections({
  expanded,
  entries,
  thisMonthCount,
  lastMonthCount,
  resolvedCount,
  totalCount,
  pendingStage,
  onMilestoneShown,
}: InsightsDeferredSectionsProps) {
  const router = useRouter();
  const { t } = useTranslation("insights");
  const [ready, setReady] = useState(false);
  const { colors } = useThemeStyles();
  const insightsColors = useMemo(
    () => getInsightsColors(colors),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        reviewCtaWrap: {
          width: "100%",
          marginBottom: 12,
          marginTop: 8,
        },
        reviewCta: {
          alignSelf: "stretch",
          paddingVertical: 14,
          paddingHorizontal: 18,
          borderRadius: 14,
          backgroundColor: insightsColors.primary + "22",
          borderWidth: 1,
          borderColor: insightsColors.accent + "55",
        },
        reviewCtaPressed: {
          opacity: 0.88,
        },
        reviewCtaText: {
          textAlign: "center",
          fontWeight: "700",
          fontSize: 16,
          color: insightsColors.accent,
        },
      }),
    [insightsColors],
  );

  useEffect(() => {
    if (!expanded) {
      return;
    }
    if (ready) {
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, [expanded, ready]);

  if (!expanded) {
    return null;
  }

  if (!ready) {
    return (
      <View style={{ paddingVertical: 28, alignItems: "center" }}>
        <ActivityIndicator color={colors.primaryDark} />
      </View>
    );
  }

  return (
    <>
      <HealingProgress
        totalCount={totalCount}
        resolvedCount={resolvedCount}
        pendingStage={pendingStage}
        onMilestoneShown={onMilestoneShown}
      />

      <EmotionPodcast />
      <EmotionReleaseArchive entries={entries} />
      <OnThisDayInsightsCard entries={entries} />
      <TriggerInsight entries={entries} />
      <GardenFooter
        thisMonthCount={thisMonthCount}
        lastMonthCount={lastMonthCount}
        resolvedCount={resolvedCount}
      />

      <View style={styles.reviewCtaWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.reviewCta,
            pressed && styles.reviewCtaPressed,
          ]}
          onPress={() => router.push("/review-export")}
        >
          <Text style={styles.reviewCtaText}>{t("reviewCta")}</Text>
        </Pressable>
      </View>

      <EmotionForecastSection />
    </>
  );
}
