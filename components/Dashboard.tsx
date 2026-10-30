import { formatLocaleDate } from "@/shared/formatting";
import {
  filterDashboardEntries,
  getDashboardEntryItemType,
  type DashboardFilterType,
} from "@/shared/entries/dashboardFilter";
import {
  computeWeatherNarrative,
  getWeatherEmptyReason,
} from "@/shared/weather/weatherNarrative";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { FlashList, FlashListRef, ListRenderItem } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { CloudSun, Flame, Leaf, Sprout } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useShallow } from "zustand/shallow";
import { COLORS } from "@/constants/colors";
import {
  DASHBOARD_SEGMENT_ORDER,
  getDashboardSegmentA11yLabel,
  getDashboardSegmentShortLabel,
} from "@/utils/dashboardSegmentLabels";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { useAppStore } from "../store/useAppStore";
import { createDashboardStyles } from "../styles/components/Dashboard.styles";
import { MoodEntry } from "../types";
import {
  registerAsoDashboardScroller,
  requestAsoDashboardScroll,
} from "@/services/asoPreviewScroll";
import { AppButton } from "./ui/AppButton";
import { AppSegmentedControl } from "./ui/AppSegmentedControl";
import { AppScreenShell } from "./AppScreenShell";
import Avatar from "./Avatar";
import EntryCard from "./EntryCard";
import { RevisitBanner } from "./retention/RevisitBanner";
import WeatherStation from "./WeatherStation";

// Type alias for dashboard filter (shared with dashboardFilter.ts)
type DashboardFilter = DashboardFilterType;

const EMPTY_FILTER_ICONS: Record<
  DashboardFilter,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  active: Sprout,
  resolved: Leaf,
  burned: Flame,
  all: CloudSun,
};

const FILTER_OPTIONS: DashboardFilter[] = [...DASHBOARD_SEGMENT_ORDER];

const Dashboard: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(
    () => createDashboardStyles(windowWidth, windowHeight),
    [windowWidth, windowHeight]
  );

  // 优化：使用单个 selector 减少多次渲染，使用 useShallow 避免无限循环
  const { entries, weather, user, effectiveLocale } = useAppStore(
    useShallow((state) => ({
      entries: state.entries,
      weather: state.weather,
      user: state.user,
      effectiveLocale: state.effectiveLocale,
    }))
  );
  const { colors } = useThemeStyles();
  const [filter, setFilter] = useState<DashboardFilter>("active");
  const listRef = useRef<FlashListRef<MoodEntry>>(null);
  /** App Preview：下滑时强制刷屏，避免 simctl 静止不写帧 */
  const [asoFramePulse, setAsoFramePulse] = useState(0);
  const asoPulseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // App Preview：aso-scroll-trigger → animated 下滑 + 帧脉冲
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    registerAsoDashboardScroller((offset, animated) => {
      listRef.current?.scrollToOffset({ offset, animated });
    });
    return () => {
      registerAsoDashboardScroller(null);
      if (asoPulseRef.current) {
        clearInterval(asoPulseRef.current);
        asoPulseRef.current = null;
      }
    };
  }, []);

  // 加载过滤偏好
  useEffect(() => {
    const loadFilterPreference = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem("dashboard_filter");
        if (
          savedFilter &&
          (FILTER_OPTIONS as readonly string[]).includes(savedFilter)
        ) {
          setFilter(savedFilter as DashboardFilter);
        }
      } catch (error) {
        console.error("加载过滤偏好失败:", error);
      }
    };
    loadFilterPreference();
  }, []);

  // 保存过滤偏好（键 dashboard_filter 不变 · D-21）
  const handleFilterChange = useCallback((newFilter: DashboardFilter) => {
    setFilter(newFilter);
    AsyncStorage.setItem("dashboard_filter", newFilter).catch((err) => {
      console.error("保存过滤偏好失败:", err);
    });
  }, []);

  const filteredEntries = useMemo(
    () => filterDashboardEntries(entries, filter),
    [entries, filter],
  );

  const getItemType = useCallback(
    (item: MoodEntry) => getDashboardEntryItemType(item),
    [],
  );

  const segmentItems = useMemo(
    () =>
      FILTER_OPTIONS.map((key) => ({
        value: key,
        label: getDashboardSegmentShortLabel(key, effectiveLocale),
        accessibilityLabel: getDashboardSegmentA11yLabel(key, effectiveLocale),
      })),
    [effectiveLocale],
  );

  const weatherEmptyReason = useMemo(
    () => getWeatherEmptyReason(entries),
    [entries],
  );
  const weatherAdvice = useMemo((): string => {
    const { adviceKey } = computeWeatherNarrative(entries, weather.condition);
    const translated = String(t(adviceKey as never));
    if (translated !== adviceKey) {
      return translated;
    }
    const fallbackKey =
      `weatherStation.descriptions.${weather.condition}` as const;
    const fallback = t(fallbackKey);
    return fallback === fallbackKey
      ? t("weatherStation.descriptions.sunny")
      : fallback;
  }, [entries, weather.condition, t]);
  const emptyStateContent = useMemo(
    () => ({
      title: t(`empty.${filter}.title`),
      desc: t(`empty.${filter}.desc`),
      cta: t(`empty.${filter}.cta`),
      ctaA11y: t(`empty.${filter}.ctaA11y`),
      ctaHint: t(`empty.${filter}.ctaHint`),
      showButton: true,
    }),
    [t, filter],
  );
  const EmptyFilterIcon = EMPTY_FILTER_ICONS[filter];

  // 焚烧处理函数已在 EntryCard 内部处理，这里无需操作
  const handleBurn = useCallback((_id: string) => {
    // EntryCard 内部会调用 burnEntry，这里保留空函数用于兼容
  }, []);

  // FlatList 渲染函数，使用 useCallback 优化性能
  const renderEntry = useCallback<ListRenderItem<MoodEntry>>(
    ({ item }) => <EntryCard entry={item} onBurn={handleBurn} />,
    [handleBurn],
  );

  // FlatList key 提取函数
  const keyExtractor = useCallback((item: MoodEntry) => item.id, []);

  const goToRecord = useCallback(() => {
    router.push("/record");
  }, [router]);

  // 渲染列表头部（WeatherStation + RevisitBanner；记一笔入口 = 中间 Tab + 空态 primary CTA · D-28 reopen）
  const renderListHeader = useCallback(
    () => (
      <View>
        <View style={styles.weatherSection}>
          <WeatherStation />
        </View>
        <RevisitBanner entries={entries} />
      </View>
    ),
    [styles.weatherSection, entries],
  );

  return (
    <AppScreenShell edges={["top", "left", "right"]} showHeader={false}>
      {/* Header - 固定在顶部 */}
      <View style={styles.header}>
        <View testID="dashboard-header">
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t("header.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {weatherEmptyReason != null
              ? formatLocaleDate(Date.now(), effectiveLocale)
              : `${formatLocaleDate(Date.now(), effectiveLocale)} · ${weatherAdvice}`}
          </Text>
        </View>
        <Avatar
          uri={user?.avatar}
          name={user?.name}
          size={40}
          onPress={() => router.push("/profile")}
          style={styles.avatar}
        />
        {/* App Preview：隐形触发，避免深链卸掉 Dashboard 导致滚动空跑 */}
        {__DEV__ ? (
          <Pressable
            testID="aso-scroll-trigger"
            accessibilityLabel="aso-scroll-trigger"
            onPress={() => {
              if (asoPulseRef.current) clearInterval(asoPulseRef.current);
              let n = 0;
              asoPulseRef.current = setInterval(() => {
                n += 1;
                setAsoFramePulse(n);
                if (n >= 90) {
                  if (asoPulseRef.current) {
                    clearInterval(asoPulseRef.current);
                    asoPulseRef.current = null;
                  }
                }
              }, 40);
              requestAsoDashboardScroll();
            }}
            // 放左上角，勿盖住右侧头像（否则 DEV 下点头像进不了 /profile）
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 56,
              height: 56,
              opacity: 0.03,
              zIndex: 20,
            }}
          />
        ) : null}
        {__DEV__ && asoFramePulse > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: 2,
              height: 2,
              opacity: 0.04,
              backgroundColor:
                asoFramePulse % 2 === 0
                  ? COLORS.shadow.primary
                  : COLORS.text.inverse,
            }}
          />
        ) : null}
      </View>

      {/* Sticky 通栏分段筛选 — 替换标题+数量+漏斗下拉（D-19..D-22） */}
      <View style={styles.listHeader}>
        <AppSegmentedControl
          segments={segmentItems}
          value={filter}
          onChange={handleFilterChange}
          testID="dashboard-filter"
          style={styles.segmentControl}
        />
      </View>

      {/* List - 包含天气站作为头部 */}
      <FlashList
        ref={listRef}
        contentContainerStyle={[
          styles.flashListContent,
          {
            paddingBottom:
              (typeof styles.flashListContent.paddingBottom === "number"
                ? styles.flashListContent.paddingBottom
                : 0) + tabBarHeight,
          },
        ]}
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View
              style={styles.emptyIconContainer}
              testID={`dashboard-empty-icon-${filter}`}
            >
              <EmptyFilterIcon size={48} color={COLORS.primaryLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {emptyStateContent.title}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {emptyStateContent.desc}
            </Text>
            {emptyStateContent.showButton && (
              <View style={styles.emptyCtaWrap}>
                <AppButton
                  variant="primary"
                  label={emptyStateContent.cta}
                  onPress={goToRecord}
                  accessibilityLabel={emptyStateContent.ctaA11y}
                  accessibilityHint={emptyStateContent.ctaHint}
                  testID="dashboard-empty-cta"
                />
              </View>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </AppScreenShell>
  );
};

export default Dashboard;
