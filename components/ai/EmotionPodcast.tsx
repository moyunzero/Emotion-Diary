import { Loader2, Mic, RefreshCw, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  responsiveBorderRadius,
  responsiveFontSize,
  responsivePadding,
} from '../../utils/responsiveUtils';
import { useAppStore } from '../../store/useAppStore';

/**
 * 情绪播客组件
 * 生成并展示AI生成的情绪回顾文案
 */
const EmotionPodcast: React.FC = () => {
  const { emotionPodcast, generatePodcast } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  /**
   * 生成播客
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePodcast(selectedPeriod);
    } catch (error) {
      Alert.alert('生成失败', '生成情绪播客时出现错误，请稍后重试');
      console.error('生成播客失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 分享播客
   */
  const handleShare = async () => {
    if (!emotionPodcast?.content) return;

    try {
      await Share.share({
        message: `我的情绪回顾\n\n${emotionPodcast.content}\n\n来自情绪日记 ❤️`,
        title: '情绪回顾',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  /**
   * 重新生成
   */
  const handleRegenerate = async () => {
    await handleGenerate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Mic size={24} color="#FDA4AF" />
        <Text style={styles.title}>情绪播客</Text>
      </View>
      <Text style={styles.subtitle}>让AI为你生成温暖的情绪回顾</Text>

      {/* 时间选择 */}
      {!emotionPodcast && (
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              本周
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}
            >
              本月
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 生成按钮或播客内容 */}
      {!emotionPodcast ? (
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.generateButtonText}>生成中...</Text>
            </>
          ) : (
            <>
              <Mic size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>生成{selectedPeriod === 'week' ? '本周' : '本月'}回顾</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.podcastCard}>
          <View style={styles.podcastHeader}>
            <View style={styles.podcastHeaderLeft}>
              <Mic size={20} color="#FDA4AF" />
              <Text style={styles.podcastPeriod}>
                {emotionPodcast.period === 'week' ? '本周' : '本月'}回顾
              </Text>
            </View>
            <View style={styles.podcastActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 size={18} color="#6B7280" />
                ) : (
                  <RefreshCw size={18} color="#6B7280" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.podcastContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.podcastText}>{emotionPodcast.content}</Text>
          </ScrollView>

          <Text style={styles.podcastFooter}>
            {new Date(emotionPodcast.generatedAt).toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveBorderRadius.large(),
    padding: responsivePadding.card(),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: responsiveFontSize.cardTitle(18),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: responsiveFontSize.small(12),
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 34,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FDA4AF',
  },
  periodButtonText: {
    fontSize: responsiveFontSize.body(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: responsivePadding.vertical(14),
    paddingHorizontal: responsivePadding.horizontal(24),
    borderRadius: responsiveBorderRadius.card(),
    backgroundColor: '#FDA4AF',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: responsiveFontSize.cardTitle(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  podcastCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
  },
  podcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  podcastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podcastPeriod: {
    fontSize: responsiveFontSize.body(14),
    fontWeight: '600',
    color: '#1F2937',
  },
  podcastActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  podcastContent: {
    maxHeight: 200,
    marginBottom: 12,
  },
  podcastText: {
    fontSize: responsiveFontSize.body(15),
    lineHeight: 24,
    color: '#374151',
  },
  podcastFooter: {
    fontSize: responsiveFontSize.small(12),
    color: '#9CA3AF',
    textAlign: 'right',
  },
});

export default EmotionPodcast;


