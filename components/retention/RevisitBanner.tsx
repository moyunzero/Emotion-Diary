/**
 * 回访轻入口（A2）：距上次记录较久时展示。
 */

import { RETENTION_COPY } from "@/constants/retentionCopy";
import { shouldShowRevisitBanner } from "@/shared/retention/touchpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { PenLine, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { createRevisitBannerStyles } from "./retention.styles";

const DISMISS_KEY = "retention_revisit_dismissed_until";

function endOfLocalDayMs(now: Date = new Date()): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

type RevisitBannerProps = {
  entries: readonly import("@/types").MoodEntry[];
};

export function RevisitBanner({ entries }: RevisitBannerProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createRevisitBannerStyles(width, height),
    [width, height],
  );
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then((raw) => {
      if (!raw) return;
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) setDismissedUntil(n);
    });
  }, []);

  const { show, daysSince } = useMemo(
    () => shouldShowRevisitBanner(entries, dismissedUntil),
    [entries, dismissedUntil],
  );

  const handleDismiss = useCallback(async () => {
    const until = endOfLocalDayMs();
    setDismissedUntil(until);
    await AsyncStorage.setItem(DISMISS_KEY, String(until));
  }, []);

  if (!show) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <PenLine size={18} color="#EF4444" />
        <Text style={styles.title}>
          {RETENTION_COPY.revisitBannerTitle(daysSince)}
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={RETENTION_COPY.revisitBannerDismiss}
        >
          <X size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
        onPress={() => router.push("/record")}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>{RETENTION_COPY.revisitBannerAction}</Text>
      </Pressable>
    </View>
  );
}
