import { Sparkles } from 'lucide-react-native';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAppStore } from '@/store/useAppStore';
import { MoodEntry, MoodLevel } from '../../types';
import { generateEmotionPrescription } from '../../utils/aiService';
import { COLORS, DESIGN_TOKENS } from '@/constants/colors';
import { getInsightsColors } from './constants';

interface PrescriptionCardProps {
  trigger: string;
  moodLevel: MoodLevel;
  entries: MoodEntry[];
}

const PrescriptionCardComponent: React.FC<PrescriptionCardProps> = ({ trigger, moodLevel, entries }) => {
  const { t } = useTranslation('insights');
  const { t: tAi } = useTranslation('ai');
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);
  const { fontSize } = useResponsiveStyles();
  const { colors } = useThemeStyles();
  const insightsColors = useMemo(
    () => getInsightsColors(colors),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        generateButton: {
          flexDirection: 'row',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          backgroundColor: insightsColors.primary + '20',
          alignSelf: 'flex-start',
          marginTop: 8,
        },
        generateButtonText: {
          fontSize: 12,
          fontWeight: '500',
          color: insightsColors.accent,
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
          color: insightsColors.textSecondary,
          marginTop: 8,
        },
        errorContainer: {
          marginTop: 12,
          padding: 12,
          backgroundColor: COLORS.background.page,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          borderWidth: 1,
          borderColor: COLORS.primaryLight,
        },
        errorText: {
          fontSize: 12,
          color: COLORS.primaryDark,
          marginBottom: 8,
        },
        retryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          backgroundColor: insightsColors.primary + '20',
          alignSelf: 'flex-start',
        },
        retryButtonText: {
          fontSize: 12,
          fontWeight: '500',
          color: insightsColors.accent,
        },
        container: {
          marginTop: 12,
          backgroundColor: COLORS.surface,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
          padding: 12,
          borderWidth: 1,
          borderColor: insightsColors.primary + '30',
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
          fontSize: fontSize.body,
          fontWeight: '600',
          color: insightsColors.text,
        },
        expandText: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
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
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          minWidth: 50,
          alignItems: 'center',
        },
        prescriptionBadgeText: {
          fontSize: DESIGN_TOKENS.fontSize.footnote,
          fontWeight: 'bold',
        },
        prescriptionText: {
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          color: insightsColors.text,
        },
      }),
    [fontSize, insightsColors]
  );

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

  useEffect(() => {
    setPrescription(null);
    setGenerateError(null);
    setIsExpanded(false);
  }, [effectiveLocale, trigger, moodLevel]);

  const handleGenerate = async () => {
    if (generatingStepTimeoutRef.current) {
      clearTimeout(generatingStepTimeoutRef.current);
      generatingStepTimeoutRef.current = null;
    }
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStep(tAi('prescription.generating.analyzing'));

    try {
      generatingStepTimeoutRef.current = setTimeout(() => {
        setGeneratingStep(tAi('prescription.generating.generating'));
        generatingStepTimeoutRef.current = null;
      }, 1000);

      const result = await generateEmotionPrescription(
        trigger,
        moodLevel,
        entries,
        'anonymous',
        effectiveLocale === 'en-US' ? 'friend' : '朋友',
        undefined,
        effectiveLocale,
      );
      setPrescription(result);
      setIsExpanded(true);
      setGeneratingStep('');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "生成情绪处方时出现错误";
      setGenerateError(errorMessage);
      console.error("生成处方失败:", error);
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
        <Sparkles size={14} color={insightsColors.accent} />
        <Text style={styles.generateButtonText}>{t('prescription.generate')}</Text>
      </TouchableOpacity>
    );
  }

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={insightsColors.accent} />
        <Text style={styles.loadingText}>
          {generatingStep || tAi('prescription.generating.default')}
        </Text>
      </View>
    );
  }

  if (generateError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {tAi('prescription.errorPrefix')}
          {generateError}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleGenerate}
        >
          <Sparkles size={14} color={insightsColors.accent} />
          <Text style={styles.retryButtonText}>{t('prescription.retry')}</Text>
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
          <Sparkles size={16} color={insightsColors.accent} />
          <Text style={styles.headerText}>{t('prescription.header')}</Text>
        </View>
        <Text style={styles.expandText}>
          {isExpanded ? t('prescription.collapse') : t('prescription.expand')}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: COLORS.deadline.today.bg }]}>
              <Text style={[styles.prescriptionBadgeText, { color: COLORS.deadline.today.text }]}>
                {t('prescription.badges.urgent')}
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.urgent}</Text>
          </View>

          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: COLORS.background.tertiary }]}>
              <Text style={[styles.prescriptionBadgeText, { color: COLORS.primaryDark }]}>
                {t('prescription.badges.shortTerm')}
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.shortTerm}</Text>
          </View>

          <View style={styles.prescriptionItem}>
            <View style={[styles.prescriptionBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.prescriptionBadgeText, { color: COLORS.primaryDark }]}>
                {t('prescription.badges.longTerm')}
              </Text>
            </View>
            <Text style={styles.prescriptionText}>{prescription.longTerm}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const PrescriptionCard = memo(PrescriptionCardComponent);
