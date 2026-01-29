import { Sparkles } from 'lucide-react-native';
import React, { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoodEntry, MoodLevel } from '../../types';
import { generateEmotionPrescription } from '../../utils/aiService';
import { responsiveFontSize } from '../../utils/responsiveUtils';
import { INSIGHTS_COLORS } from './constants';

interface PrescriptionCardProps {
  trigger: string;
  moodLevel: MoodLevel;
  entries: MoodEntry[];
}

const PrescriptionCardComponent: React.FC<PrescriptionCardProps> = ({ trigger, moodLevel, entries }) => {
  const [prescription, setPrescription] = useState<{ urgent: string; shortTerm: string; longTerm: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState<string>('');

  const generatingStepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    return () => {
      if (generatingStepTimeoutRef.current) {
        clearTimeout(generatingStepTimeoutRef.current);
        generatingStepTimeoutRef.current = null;
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (generatingStepTimeoutRef.current) {
      clearTimeout(generatingStepTimeoutRef.current);
      generatingStepTimeoutRef.current = null;
    }
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStep('正在分析你的情绪模式...');
    
    try {
      generatingStepTimeoutRef.current = setTimeout(() => {
        setGeneratingStep('正在生成个性化建议...');
        generatingStepTimeoutRef.current = null;
      }, 1000);
      
      const result = await generateEmotionPrescription(trigger, moodLevel, entries);
      setPrescription(result);
      setIsExpanded(true);
      setGeneratingStep('');
    } catch (error: any) {
      const errorMessage = error?.message || '生成情绪处方时出现错误';
      setGenerateError(errorMessage);
      console.error('生成处方失败:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
      if (generatingStepTimeoutRef.current) {
        clearTimeout(generatingStepTimeoutRef.current);
        generatingStepTimeoutRef.current = null;
      }
    }
  };

  if (!prescription && !isGenerating) {
    return (
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerate}
      >
        <Sparkles size={14} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.generateButtonText}>获取AI建议</Text>
      </TouchableOpacity>
    );
  }

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={INSIGHTS_COLORS.accent} />
        <Text style={styles.loadingText}>
          {generatingStep || 'AI正在生成建议...'}
        </Text>
      </View>
    );
  }

  if (generateError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>生成失败：{generateError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleGenerate}
        >
          <Sparkles size={14} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prescription) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <Sparkles size={16} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.headerText}>AI个性化建议</Text>
        </View>
        <Text style={styles.expandText}>
          {isExpanded ? '收起' : '展开'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.prescriptionBadgeText, { color: '#991B1B' }]}>
                紧急
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.urgent}</Text>
          </View>

          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.prescriptionBadgeText, { color: '#92400E' }]}>
                短期
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.shortTerm}</Text>
          </View>

          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.prescriptionBadgeText, { color: '#065F46' }]}>
                长期
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.longTerm}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  generateButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: INSIGHTS_COLORS.primary + '20',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: INSIGHTS_COLORS.accent,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    color: INSIGHTS_COLORS.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: INSIGHTS_COLORS.primary + '20',
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: INSIGHTS_COLORS.accent,
  },
  container: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: INSIGHTS_COLORS.primary + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: responsiveFontSize.body(13),
    fontWeight: '600',
    color: INSIGHTS_COLORS.text,
  },
  expandText: {
    fontSize: responsiveFontSize.small(12),
    color: INSIGHTS_COLORS.textSecondary,
  },
  content: {
    marginTop: 12,
    gap: 10,
  },
  prescriptionItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  prescriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  prescriptionBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  prescriptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: INSIGHTS_COLORS.text,
  },
});

export const PrescriptionCard = memo(PrescriptionCardComponent);
