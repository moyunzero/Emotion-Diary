import { Loader2, Mic, RefreshCw, Share2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { formatLocaleDate } from '@/shared/formatting';
import { useAppStore } from '../../store/useAppStore';

/**
 * Emotion podcast card — AI-generated mood recap
 * 生成并展示AI生成的情绪回顾文案
 */
const EmotionPodcast: React.FC = () => {
  const { t } = useTranslation('ai');
  const { padding, fontSize, borderRadius } = useResponsiveStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: '#FFFFFF',
          borderRadius: borderRadius.large,
          padding: padding.card,
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
          fontSize: fontSize.cardTitle,
          fontWeight: 'bold',
          color: '#1F2937',
        },
        subtitle: {
          fontSize: fontSize.small,
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
          fontSize: fontSize.body,
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
          paddingVertical: padding.vertical,
          paddingHorizontal: padding.horizontal,
          borderRadius: borderRadius.card,
          backgroundColor: '#FDA4AF',
        },
        generateButtonDisabled: {
          opacity: 0.6,
        },
        generateButtonText: {
          fontSize: fontSize.cardTitle,
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
          fontSize: fontSize.body,
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
          fontSize: fontSize.body,
          lineHeight: 24,
          color: '#374151',
        },
        podcastFooter: {
          fontSize: fontSize.small,
          color: '#9CA3AF',
          textAlign: 'right',
        },
      }),
    [padding, fontSize, borderRadius]
  );

  const { emotionPodcast, generatePodcast, effectiveLocale } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const periodLabel =
    selectedPeriod === 'week'
      ? t('podcast.ui.periodWeek')
      : t('podcast.ui.periodMonth');

  const periodReviewLabel =
    emotionPodcast?.period === 'week'
      ? t('podcast.ui.periodReviewWeek')
      : t('podcast.ui.periodReviewMonth');

  /**
   * 生成播客
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePodcast(selectedPeriod);
    } catch (error) {
      Alert.alert(
        t('alerts.podcastGenerateFailed.title', { ns: 'system' }),
        t('alerts.podcastGenerateFailed.message', { ns: 'system' }),
      );
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
        message: `${t('podcast.ui.shareMessagePrefix')}${emotionPodcast.content}${t('podcast.ui.shareMessageSuffix')}`,
        title: t('podcast.ui.shareTitle'),
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
        <Text style={styles.title}>{t('podcast.ui.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('podcast.ui.subtitle')}</Text>

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
              {t('podcast.ui.periodWeek')}
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
              {t('podcast.ui.periodMonth')}
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
              <Text style={styles.generateButtonText}>{t('podcast.ui.generating')}</Text>
            </>
          ) : (
            <>
              <Mic size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                {t('podcast.ui.generateButton', { period: periodLabel })}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.podcastCard}>
          <View style={styles.podcastHeader}>
            <View style={styles.podcastHeaderLeft}>
              <Mic size={20} color="#FDA4AF" />
              <Text style={styles.podcastPeriod}>{periodReviewLabel}</Text>
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
            {formatLocaleDate(emotionPodcast.generatedAt, effectiveLocale, 'medium')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default EmotionPodcast;
