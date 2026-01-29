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
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import { useThemeStyles } from "../hooks/useThemeStyles";
import { useAppStore } from "../store/useAppStore";
import { styles } from "../styles/components/Dashboard.styles";
import { MoodEntry, Status } from "../types";
import { formatDateChinese } from "../utils/dateUtils";
import Avatar from "./Avatar";
import EntryCard from "./EntryCard";
import WeatherStation from "./WeatherStation";

const Dashboard: React.FC = () => {
  const router = useRouter();
  // 优化：使用单个 selector 减少多次渲染，使用 useShallow 避免无限循环
  const { entries, weather, user } = useAppStore(
    useShallow((state) => ({
      entries: state.entries,
      weather: state.weather,
      user: state.user,
    }))
  );
  const { colors } = useThemeStyles();
  const [filter, setFilter] = useState<
    "all" | "active" | "resolved" | "burned"
  >("active");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterButtonRef = useRef<View>(null);
  const windowWidth = Dimensions.get("window").width;

  // 加载过滤偏好
  useEffect(() => {
    const loadFilterPreference = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem("dashboard_filter");
        if (
          savedFilter &&
          ["all", "active", "resolved", "burned"].includes(savedFilter)
        ) {
          setFilter(savedFilter as "all" | "active" | "resolved" | "burned");
        }
      } catch (error) {
        console.error("加载过滤偏好失败:", error);
      }
    };
    loadFilterPreference();
  }, []);

  // 保存过滤偏好
  const handleFilterChange = useCallback(
    (newFilter: "all" | "active" | "resolved" | "burned") => {
      setFilter(newFilter);
      setIsFilterOpen(false);
      AsyncStorage.setItem("dashboard_filter", newFilter).catch((err) => {
        console.error("保存过滤偏好失败:", err);
      });
    },
    [],
  );

  // 处理筛选按钮点击，测量按钮位置
  const handleFilterButtonPress = useCallback(() => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number,
        ) => {
          // pageX, pageY 是相对于屏幕的绝对位置
          setFilterButtonLayout({
            x: pageX,
            y: pageY,
            width,
            height,
          });
          setIsFilterOpen(!isFilterOpen);
        },
      );
    } else {
      setIsFilterOpen(!isFilterOpen);
    }
  }, [isFilterOpen]);

  const filteredEntries = useMemo(() => {
    if (filter === "all") {
      const activeEntries = entries
        .filter((e) => e.status === Status.ACTIVE)
        .sort((a, b) => b.timestamp - a.timestamp);
      const resolvedEntries = entries
        .filter((e) => e.status === Status.RESOLVED)
        .sort((a, b) => b.timestamp - a.timestamp);
      const burnedEntries = entries
        .filter((e) => e.status === Status.BURNED)
        .sort((a, b) => b.timestamp - a.timestamp);
      return [...activeEntries, ...resolvedEntries, ...burnedEntries];
    }

    let filtered = entries;
    if (filter === "active") {
      filtered = entries.filter((e) => e.status === Status.ACTIVE);
    } else if (filter === "resolved") {
      filtered = entries.filter((e) => e.status === Status.RESOLVED);
    } else if (filter === "burned") {
      filtered = entries.filter((e) => e.status === Status.BURNED);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, filter]);

  const getEmptyStateContent = useMemo(() => {
    switch (filter) {
      case "active":
        return {
          title: "暂无待处理的情绪",
          desc: "你的心情花园正在茁壮成长",
          showButton: true,
        };
      case "resolved":
        return {
          title: "还没有已和解的记录",
          desc: "记录情绪，与自己和解",
          showButton: true,
        };
      case "burned":
        return {
          title: "还没有焚烧过的气话",
          desc: "负面情绪可以通过焚烧释放",
          showButton: true,
        };
      default:
        return {
          title: "开始记录你的第一份情绪吧",
          desc: "让每一次表达都成为照料心灵的过程",
          showButton: true,
        };
    }
  }, [filter]);

  // 焚烧处理函数已在 EntryCard 内部处理，这里无需操作
  const handleBurn = useCallback((id: string) => {
    // EntryCard 内部会调用 burnEntry，这里保留空函数用于兼容
  }, []);

  // FlatList 渲染函数，使用 useCallback 优化性能
  const renderEntry = useCallback<ListRenderItem<MoodEntry>>(
    ({ item }) => <EntryCard entry={item} onBurn={handleBurn} />,
    [handleBurn],
  );

  // FlatList key 提取函数
  const keyExtractor = useCallback((item: MoodEntry) => item.id, []);

  const getFilterLabel = () => {
    switch (filter) {
      case "active":
        return "未处理";
      case "resolved":
        return "已和解";
      case "burned":
        return "灰烬回忆";
      default:
        return "全部记录";
    }
  };

  const getWeatherAdvice = () => {
    return weather.condition === "sunny" ? "宜开心" : "宜沟通";
  };

  // 渲染列表头部（只包含天气站和标题）
  const renderListHeader = () => (
    <>
      {/* Weather Station */}
      <View style={styles.weatherSection}>
        <WeatherStation />
      </View>

      {/* List Header - 标题和筛选按钮 */}
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.text.primary }]}>
          {getFilterLabel()}
          <Text style={[styles.count, { color: colors.text.tertiary }]}>
            {" "}
            ({filteredEntries.length})
          </Text>
        </Text>

        <TouchableOpacity
          ref={filterButtonRef}
          onPress={handleFilterButtonPress}
          onLayout={() => {
            // 当布局变化时重新测量（例如列表滚动时）
            if (filterButtonRef.current && isFilterOpen) {
              filterButtonRef.current.measure(
                (
                  x: number,
                  y: number,
                  width: number,
                  height: number,
                  pageX: number,
                  pageY: number,
                ) => {
                  setFilterButtonLayout({
                    x: pageX,
                    y: pageY,
                    width,
                    height,
                  });
                },
              );
            }
          }}
          style={[
            styles.filterButton,
            isFilterOpen && styles.filterButtonActive,
            { backgroundColor: colors.background.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`筛选按钮，当前显示${getFilterLabel()}`}
          accessibilityHint="点击打开筛选菜单，可以选择查看全部记录、未处理、已和解或灰烬回忆"
          accessibilityState={{ expanded: isFilterOpen }}
        >
          <Filter
            size={18}
            color={isFilterOpen ? colors.submit : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.page }]}
      edges={["top", "left", "right"]}
    >
      {/* Header - 固定在顶部 */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            情绪气象站
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {formatDateChinese(Date.now())} · {getWeatherAdvice()}
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

      {/* List - 包含天气站作为头部 */}
      <FlashList
        contentContainerStyle={styles.flashListContent}
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <PenLine size={48} color="#D1D5DB" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {getEmptyStateContent.title}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {getEmptyStateContent.desc}
            </Text>
            {getEmptyStateContent.showButton && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.submit }]}
                onPress={() => router.push("/record")}
                accessibilityRole="button"
                accessibilityLabel="去记录情绪"
                accessibilityHint="点击跳转到记录页面，开始记录你的第一份情绪"
              >
                <Text
                  style={[
                    styles.emptyButtonText,
                    { color: colors.text.inverse },
                  ]}
                >
                  去记录
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
          const dropdownWidth = 130;
          const dropdownHeight = 200; // 估算高度：4个选项 * 约50px每个
          const screenHeight = Dimensions.get("window").height;
          const rightPosition =
            windowWidth - filterButtonLayout.x - filterButtonLayout.width;
          const topPosition =
            filterButtonLayout.y + filterButtonLayout.height + 8;

          // 边界检测：确保菜单不超出屏幕
          const adjustedRight = Math.max(
            16,
            Math.min(rightPosition, windowWidth - dropdownWidth - 16),
          );
          const adjustedTop =
            topPosition + dropdownHeight > screenHeight
              ? filterButtonLayout.y - dropdownHeight - 8 // 如果下方空间不足，显示在上方
              : topPosition;

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
                    top: adjustedTop,
                    right: adjustedRight,
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleFilterChange("active")}
                  style={[
                    styles.filterOption,
                    filter === "active" && {
                      backgroundColor: colors.background.page,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="筛选：未处理"
                  accessibilityHint="点击只显示未处理的情绪记录"
                  accessibilityState={{ selected: filter === "active" }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "active" && {
                        color: colors.submit,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    未处理
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFilterChange("resolved")}
                  style={[
                    styles.filterOption,
                    filter === "resolved" && {
                      backgroundColor: colors.background.page,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="筛选：已和解"
                  accessibilityHint="点击只显示已和解的情绪记录"
                  accessibilityState={{ selected: filter === "resolved" }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "resolved" && {
                        color: colors.submit,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    已和解
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFilterChange("burned")}
                  style={[
                    styles.filterOption,
                    filter === "burned" && {
                      backgroundColor: colors.background.page,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="筛选：灰烬回忆"
                  accessibilityHint="点击只显示已焚烧的情绪记录"
                  accessibilityState={{ selected: filter === "burned" }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "burned" && {
                        color: colors.submit,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    灰烬
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFilterChange("all")}
                  style={[
                    styles.filterOption,
                    filter === "all" && {
                      backgroundColor: colors.background.page,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="筛选：全部记录"
                  accessibilityHint="点击显示所有情绪记录"
                  accessibilityState={{ selected: filter === "all" }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "all" && {
                        color: colors.submit,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    全部
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          );
        })()}
    </SafeAreaView>
  );
};

export default Dashboard;
