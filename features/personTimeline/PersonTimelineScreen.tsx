/**
 * Person Timeline — Garden Hero (UI-SPEC B / REL-01..04).
 */

import { AppScreenShell } from "@/components/AppScreenShell";
import EntryCard from "@/components/EntryCard/EntryCard";
import { INSIGHTS_COLORS } from "@/components/Insights/constants";
import { getFlowerPotStatus } from "@/components/Insights/utils";
import { resolvePeopleLabel } from "@/i18n/resolvePresetLabel";
import { forceCancelRecording } from "@/shared/audio/recordingCoordinator";
import {
  aggregateForPerson,
  entriesForPerson,
} from "@/shared/entries/personQueries";
import { formatRecentActivityLabel } from "@/shared/formatting";
import { useAppStore } from "@/store/useAppStore";
import type { MoodEntry } from "@/types";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Droplets, Flower2, Leaf, Sprout } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { normalizePersonParam } from "./normalizePersonParam";
import { createPersonTimelineStyles } from "./personTimeline.styles";

function renderPotIcon(status: string, color: string) {
  switch (status) {
    case "blooming":
      return <Flower2 size={36} color={color} />;
    case "growing":
      return <Leaf size={36} color={color} />;
    default:
      return <Droplets size={36} color={color} />;
  }
}

export function PersonTimelineScreen() {
  const router = useRouter();
  const { t } = useTranslation("personTimeline");
  const { t: tInsights } = useTranslation("insights");
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createPersonTimelineStyles(width, height),
    [width, height],
  );

  const entries = useAppStore((s) => s.entries);
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  const { person: personRaw } = useLocalSearchParams<{
    person?: string | string[];
  }>();
  const person = normalizePersonParam(personRaw);

  const timeline = useMemo(
    () => (person ? entriesForPerson(entries, person) : []),
    [entries, person],
  );

  const aggregate = useMemo(
    () => (person ? aggregateForPerson(entries, person) : null),
    [entries, person],
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      };
    }, []),
  );

  const potStatus = useMemo(() => {
    if (!aggregate) return null;
    return getFlowerPotStatus(
      aggregate.resolveRate,
      {
        bloomingColor: INSIGHTS_COLORS.bloomingColor,
        growingColor: INSIGHTS_COLORS.growingColor,
        needWaterColor: INSIGHTS_COLORS.needWaterColor,
      },
      tInsights,
    );
  }, [aggregate, tInsights]);

  const latestLabel = useMemo(() => {
    if (!aggregate) return t("metrics.emDash");
    return formatRecentActivityLabel(
      aggregate.latestTimestamp,
      new Date(),
      effectiveLocale,
      t("metrics.emDash"),
    );
  }, [aggregate, effectiveLocale, t]);

  const displayName = person ? resolvePeopleLabel(person) : "";

  const handleBurn = useCallback((_id: string) => {
    // EntryCard owns burnEntry; noop for Dashboard API compatibility
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEmptyRecord = useCallback(() => {
    router.push("/record");
  }, [router]);

  const renderItem = useCallback<ListRenderItem<MoodEntry>>(
    ({ item }) => (
      <View style={styles.row}>
        <View style={styles.spineCol}>
          <View style={styles.spineLine} />
          <View style={styles.spineDot} />
        </View>
        <View style={styles.rowCard}>
          <EntryCard entry={item} onBurn={handleBurn} />
        </View>
      </View>
    ),
    [handleBurn, styles],
  );

  const keyExtractor = useCallback((item: MoodEntry) => item.id, []);

  const listHeader = useMemo(() => {
    if (!aggregate || !potStatus) return null;
    return (
      <View>
        <View style={styles.hero} testID="person-timeline-hero">
          <View
            style={[styles.pot, { backgroundColor: `${potStatus.color}52` }]}
            accessibilityRole="image"
            accessibilityLabel={potStatus.label}
          >
            {renderPotIcon(potStatus.status, potStatus.color)}
          </View>
          <Text style={styles.personName} numberOfLines={1}>
            {displayName}
          </Text>
          <View
            style={[styles.ribbon, { backgroundColor: `${potStatus.color}59` }]}
          >
            <Text style={[styles.ribbonText, { color: potStatus.color }]}>
              {potStatus.label}
            </Text>
          </View>
        </View>

        <View style={styles.metricStrip} testID="person-timeline-metrics">
          <View style={styles.metricCell}>
            <Text style={styles.metricValue}>{aggregate.entryCount}</Text>
            <Text style={styles.metricKey}>{t("metrics.count")}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {latestLabel}
            </Text>
            <Text style={styles.metricKey}>{t("metrics.latest")}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {potStatus.label}
            </Text>
            <Text style={styles.metricKey}>{t("metrics.pot")}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("section.timeline")}</Text>
        <View testID="person-timeline-otd-slot" style={styles.otdSlot} />
      </View>
    );
  }, [aggregate, potStatus, displayName, latestLabel, styles, t]);

  const shellProps = {
    title: t("screen.title"),
    onBack: handleBack,
    backAccessibilityLabel: t("a11y.back"),
    headerStyle: styles.stackHeader,
    scrollable: false as const,
    style: styles.screenRoot,
  };

  if (!person) {
    return (
      <AppScreenShell {...shellProps}>
        <View
          style={styles.empty}
          testID="person-timeline-missing-person"
        >
          <Sprout size={40} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{t("empty.missing.title")}</Text>
          <Text style={styles.emptyBody}>{t("empty.missing.body")}</Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t("empty.missing.cta")}
            testID="person-timeline-missing-cta"
          >
            <Text style={styles.emptyCtaText}>{t("empty.missing.cta")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreenShell>
    );
  }

  if (timeline.length === 0) {
    return (
      <AppScreenShell {...shellProps}>
        <View style={styles.empty} testID="person-timeline-empty">
          <Sprout size={40} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{t("empty.timeline.title")}</Text>
          <Text style={styles.emptyBody}>{t("empty.timeline.body")}</Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={handleEmptyRecord}
            accessibilityRole="button"
            accessibilityLabel={t("empty.timeline.cta")}
            testID="person-timeline-empty-cta"
          >
            <Text style={styles.emptyCtaText}>{t("empty.timeline.cta")}</Text>
          </TouchableOpacity>
        </View>
      </AppScreenShell>
    );
  }

  return (
    <AppScreenShell {...shellProps}>
      <View style={styles.screenContent}>
        <View style={styles.listWrap}>
          <FlashList
            data={timeline}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </AppScreenShell>
  );
}
