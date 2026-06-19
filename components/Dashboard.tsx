import { formatLocaleDate } from "@/shared/formatting";
import {
  filterDashboardEntries,
  getDashboardEntryItemType,
  type DashboardFilterType,
} from "@/shared/entries/dashboardFilter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Filter, PenLine } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { useAppStore } from "../store/useAppStore";
import { createDashboardStyles } from "../styles/components/Dashboard.styles";
import { calculateResponsiveDimension } from "../styles/constants";
import { MoodEntry } from "../types";
import { AppScreenShell } from "./AppScreenShell";
import Avatar from "./Avatar";
import EntryCard from "./EntryCard";
import { RevisitBanner } from "./retention/RevisitBanner";
import WeatherStation from "./WeatherStation";

// Type alias for dashboard filter (shared with dashboardFilter.ts)
type DashboardFilter = DashboardFilterType;

const FILTER_OPTIONS: DashboardFilter[] = [
  "active",
  "resolved",
  "burned",
  "all",
];

/**
 * Calculate filter dropdown position with boundary detection
 * Uses responsive sizing based on screen width
 *
 * minTop 用于阻止下拉菜单进入页面顶部固定 header 的占位区域，是抽出 sticky 筛选条后的护栏。
 */
const calculateDropdownPosition = (
  filterButtonLayout: { x: number; y: number; width: number; height: number },
  windowWidth: number,
  windowHeight: number,
  dropdownWidth: number,
  dropdownHeight: number = 200,
  minTop: number = 0,
): { top: number; right: number } => {
  const rightPosition = windowWidth - filterButtonLayout.x - filterButtonLayout.width;
  const topPosition = filterButtonLayout.y + filterButtonLayout.height;

  // Boundary detection: ensure menu doesn't exceed screen bounds
  const adjustedRight = Math.max(
    16,
    Math.min(rightPosition, windowWidth - dropdownWidth - 16),
  );
  const rawTop =
    topPosition + dropdownHeight > windowHeight
      ? filterButtonLayout.y - dropdownHeight // Show above if not enough space below
      : topPosition;
  // 防御：即便上翻或测量异常，也不让下拉与顶部固定 header 重叠
  const adjustedTop = Math.max(rawTop, minTop);

  return { top: adjustedTop, right: adjustedRight };
};

/**
 * 顶部固定 header 的竖向占位估算（dp），用于下拉菜单 top 的下限护栏。
 * 来源：styles.header paddingTop(sm=8) + title 行高 33.6 + xs(4) + subtitle 行高 16.8 + paddingBottom(xxl=24) ≈ 86.4。
 * 若未来调整 styles.header 的 padding 或字号，必须同步更新本常量。
 */
const STICKY_HEADER_TOP_GUARD = 88;

const Dashboard: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createDashboardStyles(windowWidth, windowHeight),
    [windowWidth, windowHeight]
  );

  // Calculate responsive dimensions based on screen width
  const dropdownWidth = useMemo(() => calculateResponsiveDimension(windowWidth, 0.35), [windowWidth]); // 35% of screen width
  const dropdownHeight = 200; // Fixed height for dropdown

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterButtonRef = useRef<View>(null);

  // 加载过滤偏好
  useEffect(() => {
    const loadFilterPreference = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem("dashboard_filter");
        if (
          savedFilter &&
          ["all", "active", "resolved", "burned"].includes(savedFilter)
        ) {
          setFilter(savedFilter as DashboardFilter);
        }
      } catch (error) {
        console.error("加载过滤偏好失败:", error);
      }
    };
    loadFilterPreference();
  }, []);

  // 保存过滤偏好
  const handleFilterChange = useCallback(
    (newFilter: DashboardFilter) => {
      setFilter(newFilter);
      setIsFilterOpen(false);
      AsyncStorage.setItem("dashboard_filter", newFilter).catch((err) => {
        console.error("保存过滤偏好失败:", err);
      });
    },
    [],
  );

  // 测量筛选按钮位置，转换为容器内坐标
  const measureFilterButton = useCallback((callback?: () => void) => {
    filterButtonRef.current?.measure(
      (_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
        setFilterButtonLayout({ x: pageX, y: pageY - insets.top, width, height });
        callback?.();
      },
    );
  }, [insets.top]);

  // 处理筛选按钮点击，测量按钮位置
  const handleFilterButtonPress = useCallback(() => {
    if (filterButtonRef.current) {
      measureFilterButton(() => setIsFilterOpen((prev) => !prev));
    } else {
      setIsFilterOpen((prev) => !prev);
    }
  }, [measureFilterButton]);

  const filteredEntries = useMemo(
    () => filterDashboardEntries(entries, filter),
    [entries, filter],
  );

  const getItemType = useCallback(
    (item: MoodEntry) => getDashboardEntryItemType(item),
    [],
  );

  const filterLabel = useMemo(() => t(`filter.${filter}`), [t, filter]);
  const weatherAdvice = useMemo(
    () =>
      t(
        weather.condition === "sunny"
          ? "weatherAdvice.sunny"
          : "weatherAdvice.cloudy",
      ),
    [t, weather.condition],
  );
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

  // 渲染列表头部（仅 WeatherStation；筛选条已提到 FlashList 外侧固定，避免随列表滚动）
  const renderListHeader = useCallback(() => (
    <View>
      <View style={styles.weatherSection}>
        <WeatherStation />
      </View>
      <RevisitBanner entries={entries} />
    </View>
  ), [styles.weatherSection, entries]);

  return (
    <AppScreenShell edges={["top", "left", "right"]} showHeader={false}>
      {/* Header - 固定在顶部 */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t("header.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {formatLocaleDate(Date.now(), effectiveLocale)} · {weatherAdvice}
          </Text>
        </View>
        <Avatar
          uri={user?.avatar}
          name={user?.name}
          size={40}
          onPress={() => router.push("/profile")}
          style={styles.avatar}
        />
      </View>

      {/* 筛选条 - sticky 在 header 下方，不随列表滚动（避免按钮 measure 坐标随滚动漂移导致下拉错位） */}
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.text.primary }]}>
          {filterLabel}
          <Text style={[styles.count, { color: colors.text.tertiary }]}>
            {" "}
            ({filteredEntries.length})
          </Text>
        </Text>

        <TouchableOpacity
          ref={filterButtonRef}
          onPress={handleFilterButtonPress}
          onLayout={() => {
            // 抽到 FlashList 外后按钮位置基本稳定，这里仍保留以覆盖旋转/字号变更等极端场景
            measureFilterButton();
          }}
          style={[
            styles.filterButton,
            isFilterOpen && styles.filterButtonActive,
            { backgroundColor: colors.background.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("filter.buttonA11y", { label: filterLabel })}
          accessibilityHint={t("filter.buttonHint")}
          accessibilityState={{ expanded: isFilterOpen }}
        >
          <Filter
            size={18}
            color={isFilterOpen ? colors.submit : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* List - 包含天气站作为头部 */}
      <FlashList
        contentContainerStyle={styles.flashListContent}
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        ListHeaderComponent={renderListHeader}
        // 勿用 onScroll：惯性滚动期间会持续触发，用户未停滑时点筛选会先开后立刻被关掉
        onScrollBeginDrag={() => {
          if (isFilterOpen) setIsFilterOpen(false);
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <PenLine size={48} color="#D1D5DB" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {emptyStateContent.title}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {emptyStateContent.desc}
            </Text>
            {emptyStateContent.showButton && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.submit }]}
                onPress={() => router.push("/record")}
                accessibilityRole="button"
                accessibilityLabel={emptyStateContent.ctaA11y}
                accessibilityHint={emptyStateContent.ctaHint}
              >
                <Text
                  style={[
                    styles.emptyButtonText,
                    { color: colors.text.inverse },
                  ]}
                >
                  {emptyStateContent.cta}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* 筛选下拉菜单 - 显示在按钮下方 */}
      {isFilterOpen &&
        filterButtonLayout &&
        (() => {
          const dropdownPosition = calculateDropdownPosition(
            filterButtonLayout,
            windowWidth,
            windowHeight,
            dropdownWidth,
            dropdownHeight,
            STICKY_HEADER_TOP_GUARD,
          );

          return (
            <>
              <TouchableOpacity
                style={styles.filterBackdrop}
                activeOpacity={1}
                onPress={() => setIsFilterOpen(false)}
              />
              <View
                style={[
                  styles.filterDropdown,
                  {
                    width: dropdownWidth,
                    top: dropdownPosition.top,
                    right: dropdownPosition.right,
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
              >
                {FILTER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleFilterChange(option)}
                    style={[
                      styles.filterOption,
                      filter === option && {
                        backgroundColor: colors.background.page,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t(`filter.${option}A11y`)}
                    accessibilityHint={t(`filter.${option}Hint`)}
                    accessibilityState={{ selected: filter === option }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: colors.text.secondary },
                        filter === option && {
                          color: colors.submit,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {t(`filter.${option}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          );
        })()}
    </AppScreenShell>
  );
};

export default Dashboard;
