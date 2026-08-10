/**
 * On This Day — Memory Lane (UI-SPEC B / REL-05..06).
 */

import { AppScreenShell } from "@/components/AppScreenShell";
import EntryCard from "@/components/EntryCard/EntryCard";
import { forceCancelRecording } from "@/shared/audio/recordingCoordinator";
import { entriesOnThisDayPriorYears } from "@/shared/entries/onThisDay";
import {
  buildOnThisDaySections,
  type OnThisDayListItem,
} from "@/shared/entries/onThisDaySections";
import { formatOnThisDayHeroDate } from "@/shared/formatting/onThisDayHeroDate";
import { useAppStore } from "@/store/useAppStore";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { Clock, Sprout } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, useWindowDimensions } from "react-native";
import { createOnThisDayStyles } from "./onThisDay.styles";

export function OnThisDayScreen() {
  const router = useRouter();
  const { t } = useTranslation("onThisDay");
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createOnThisDayStyles(width, height),
    [width, height],
  );

  const entries = useAppStore((s) => s.entries);
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);

  const anchorMs = useMemo(() => Date.now(), []);

  const rows = useMemo(
    () => entriesOnThisDayPriorYears(entries, anchorMs),
    [entries, anchorMs],
  );

  const items = useMemo(() => buildOnThisDaySections(rows), [rows]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      };
    }, []),
  );

  const handleBurn = useCallback((_id: string) => {
    // EntryCard owns burnEntry; noop for Dashboard API compatibility
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const heroDate = useMemo(
    () => formatOnThisDayHeroDate(anchorMs, effectiveLocale),
    [anchorMs, effectiveLocale],
  );

  const heroSubtitle =
    rows.length === 0
      ? t("hero.subtitleEmpty")
      : t("hero.subtitle", { n: rows.length });

  const listHeader = useMemo(
    () => (
      <View style={styles.hero} testID="on-this-day-hero">
        <View
          style={styles.orbit}
          accessibilityRole="image"
          accessibilityLabel={heroDate}
        >
          <Clock size={32} color="#FB7185" />
        </View>
        <Text style={styles.heroDate}>{heroDate}</Text>
        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
      </View>
    ),
    [styles, heroDate, heroSubtitle],
  );

  const renderItem = useCallback<ListRenderItem<OnThisDayListItem>>(
    ({ item }) => {
      if (item.type === "year") {
        return (
          <View style={styles.yearRow} testID={`on-this-day-year-${item.year}`}>
            <View style={styles.yearSpineCol}>
              <View style={styles.yearSpineLine} />
              <View style={styles.yearBead} />
            </View>
            <Text style={styles.yearLabel}>{String(item.year)}</Text>
          </View>
        );
      }

      return (
        <View style={styles.entryRow}>
          <View style={styles.spineCol}>
            <View style={styles.spineLine} />
            <View style={styles.spineDot} />
          </View>
          <View style={styles.rowCard}>
            <EntryCard entry={item.entry} onBurn={handleBurn} />
          </View>
        </View>
      );
    },
    [handleBurn, styles],
  );

  const keyExtractor = useCallback((item: OnThisDayListItem) => {
    if (item.type === "year") return `year-${item.year}`;
    return item.entry.id;
  }, []);

  const getItemType = useCallback(
    (item: OnThisDayListItem) => item.type,
    [],
  );

  const shellProps = {
    title: t("screen.title"),
    onBack: handleBack,
    backAccessibilityLabel: t("a11y.back"),
    headerStyle: styles.stackHeader,
    scrollable: false as const,
    style: styles.screenRoot,
  };

  if (rows.length === 0) {
    return (
      <AppScreenShell {...shellProps}>
        <View style={styles.screenContent} testID="on-this-day-empty">
          <View style={styles.listContent}>
            {listHeader}
            <View style={styles.empty}>
              <Sprout size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t("empty.title")}</Text>
              <Text style={styles.emptyBody}>{t("empty.body")}</Text>
            </View>
          </View>
        </View>
      </AppScreenShell>
    );
  }

  return (
    <AppScreenShell {...shellProps}>
      <View style={styles.screenContent}>
        <View style={styles.listWrap}>
          <FlashList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemType={getItemType}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </AppScreenShell>
  );
}
