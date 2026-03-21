import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '../../hooks/useResponsiveStyles';
import { useAppStore } from '../../store/useAppStore';
import { Status } from '../../types';
import { ScreenContainer } from '../ScreenContainer';
import EmotionPodcast from '../ai/EmotionPodcast';
import { EmptyGarden } from './EmptyGarden';
import { EmotionReleaseArchive } from './EmotionReleaseArchive';
import { GardenFooter } from './GardenFooter';
import { GardenHeader } from './GardenHeader';
import { HealingProgress } from './HealingProgress';
import { RelationshipGarden } from './RelationshipGarden';
import { TriggerInsight } from './TriggerInsight';
import { WeeklyMoodWeather } from './WeeklyMoodWeather';
import { INSIGHTS_COLORS } from './constants';

const Insights: React.FC = () => {
  const router = useRouter();
  const entries = useAppStore((state) => state.entries);
  const responsive = useResponsiveStyles();

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
  const maxWidth = responsive.layout.maxContentWidth;
  const horizontalPadding = responsive.padding.horizontal;

  // 如果没有任何条目，显示整体空状态
  if (entries.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyGarden />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scrollable
      removeClippedSubviews
    >
      {/* 内容包装器 - 在大屏设备上居中显示 */}
      <View style={[styles.contentWrapper, { maxWidth }]}>
        {/* 花园主题头部 */}
        <GardenHeader 
          totalEntries={stats.total} 
          resolvedCount={stats.resolved} 
        />

        {/* Phase 2：回顾导出入口（空花园分支无记录，不展示） */}
        <View style={[styles.reviewCtaWrap, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            style={({ pressed }) => [
              styles.reviewCta,
              pressed && styles.reviewCtaPressed,
            ]}
            onPress={() => router.push('/review-export')}
          >
            <Text style={styles.reviewCtaText}>生成情绪回顾图</Text>
          </Pressable>
        </View>

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

          {/* 情绪释放档案（焚语特色闭环） */}
          <EmotionReleaseArchive entries={entries} />

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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%', // 在小屏设备上全宽
  },
  reviewCtaWrap: {
    width: '100%',
    marginBottom: 12,
  },
  reviewCta: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: INSIGHTS_COLORS.primary + '22',
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.accent + '55',
  },
  reviewCtaPressed: {
    opacity: 0.88,
  },
  reviewCtaText: {
    textAlign: 'center',
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: INSIGHTS_COLORS.accent,
  },
  content: {
    // paddingHorizontal 在运行时动态设置
  },
});

export default Insights;
