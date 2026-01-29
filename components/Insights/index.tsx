import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS as GlobalColors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { Status } from '../../types';
import { getMaxContentWidth, responsivePadding } from '../../utils/responsiveUtils';
import EmotionPodcast from '../ai/EmotionPodcast';
import { EmptyGarden } from './EmptyGarden';
import { GardenFooter } from './GardenFooter';
import { GardenHeader } from './GardenHeader';
import { HealingProgress } from './HealingProgress';
import { RelationshipGarden } from './RelationshipGarden';
import { TriggerInsight } from './TriggerInsight';
import { WeeklyMoodWeather } from './WeeklyMoodWeather';

const Insights: React.FC = () => {
  const entries = useAppStore((state) => state.entries);

  // 计算统计数据（优化：合并多次遍历为单次遍历）
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { total: 0, resolved: 0, thisMonthCount: 0, lastMonthCount: 0 };
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1).getTime();
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).getTime();

    // 单次遍历计算所有统计数据
    let resolvedCount = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    entries.forEach(e => {
      if (e.status === Status.RESOLVED) {
        resolvedCount++;
      }
      if (e.timestamp >= startOfThisMonth) {
        thisMonthCount++;
      } else if (e.timestamp >= startOfLastMonth && e.timestamp < startOfThisMonth) {
        lastMonthCount++;
      }
    });

    return {
      total: entries.length,
      resolved: resolvedCount,
      thisMonthCount,
      lastMonthCount,
    };
  }, [entries]);

  // 获取最大内容宽度和实际padding
  const maxWidth = getMaxContentWidth();
  const horizontalPadding = responsivePadding.horizontal(20);

  // 如果没有任何条目，显示整体空状态
  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <EmptyGarden />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 内容包装器 - 在大屏设备上居中显示 */}
        <View style={[styles.contentWrapper, { maxWidth }]}>
          {/* 花园主题头部 */}
          <GardenHeader 
            totalEntries={stats.total} 
            resolvedCount={stats.resolved} 
          />

          <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
            {/* 本周情绪天气 */}
            <WeeklyMoodWeather entries={entries} />

            {/* 治愈进度 */}
            <HealingProgress 
              totalCount={stats.total} 
              resolvedCount={stats.resolved} 
            />

            {/* 情绪播客 */}
            <EmotionPodcast />

            {/* 关系花盆 */}
            <RelationshipGarden entries={entries} />

            {/* 情绪触发洞察 */}
            <TriggerInsight entries={entries} />

            {/* 底部鼓励语 */}
            <GardenFooter 
              thisMonthCount={stats.thisMonthCount}
              lastMonthCount={stats.lastMonthCount}
              resolvedCount={stats.resolved}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.background.page,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: responsivePadding.vertical(20),
    alignItems: 'center', // 居中内容包装器
  },
  contentWrapper: {
    width: '100%', // 在小屏设备上全宽
  },
  content: {
    // paddingHorizontal 在运行时动态设置
  },
});

export default Insights;
