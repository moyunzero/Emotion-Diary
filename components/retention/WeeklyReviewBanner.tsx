/**
 * 周回顾触达（A3）：周末应用内提示生成回顾图。
 */

import { RETENTION_COPY } from "@/constants/retentionCopy";
import {
  getIsoWeekKey,
  shouldShowWeeklyReviewBanner,
} from "@/shared/retention/touchpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ImageIcon, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { createWeeklyReviewBannerStyles } from "./retention.styles";

const DISMISS_KEY = "retention_weekly_review_dismissed_week";

type WeeklyReviewBannerProps = {
  entries: readonly import("@/types").MoodEntry[];
};

export function WeeklyReviewBanner({ entries }: WeeklyReviewBannerProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createWeeklyReviewBannerStyles(width, height),
    [width, height],
  );
  const [dismissedWeek, setDismissedWeek] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then((raw) => {
      if (raw) setDismissedWeek(raw);
    });
  }, []);

  const show = useMemo(
    () => shouldShowWeeklyReviewBanner(entries, dismissedWeek),
    [entries, dismissedWeek],
  );

  const handleDismiss = useCallback(async () => {
    const weekKey = getIsoWeekKey();
    setDismissedWeek(weekKey);
    await AsyncStorage.setItem(DISMISS_KEY, weekKey);
  }, []);

  const handleOpen = useCallback(() => {
    router.push({
      pathname: "/review-export",
      params: { preset: "last_week" },
    });
  }, [router]);

  if (!show) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <ImageIcon size={18} color="#3B82F6" />
        <View style={styles.textCol}>
          <Text style={styles.title}>{RETENTION_COPY.weeklyBannerTitle}</Text>
          <Text style={styles.body}>{RETENTION_COPY.weeklyBannerBody}</Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={RETENTION_COPY.weeklyBannerDismiss}
        >
          <X size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
        onPress={handleOpen}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>
          {RETENTION_COPY.weeklyBannerAction}
        </Text>
      </Pressable>
    </View>
  );
}
