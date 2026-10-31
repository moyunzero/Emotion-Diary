import { ChevronDown, ChevronUp, Heart, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, DESIGN_TOKENS } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { formatLocaleDate } from '@/shared/formatting/date';

/**
 * Emotion forecast block (D-26) — extracted from home WeatherStation.
 * Mount under garden 「更多回看」 in Plan 08; keep store selectors here.
 */
export function EmotionForecastSection() {
  const { t } = useTranslation('dashboard');
  const emotionForecast = useAppStore((state) => state.emotionForecast);
  const entries = useAppStore((state) => state.entries);
  const effectiveLocale = useAppStore((state) => state.effectiveLocale);
  const generateForecast = useAppStore((state) => state.generateForecast);

  const visibleEntries = useMemo(
    () => excludeSoftDeletedEntries(entries),
    [entries],
  );

  const highCount =
    emotionForecast?.warnings.filter((w) => w.severity === 'high').length ?? 0;

  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const prevLocaleRef = useRef(effectiveLocale);

  useEffect(() => {
    if (prevLocaleRef.current === effectiveLocale) return;
    prevLocaleRef.current = effectiveLocale;
    setIsForecastExpanded(false);
    if (visibleEntries.length >= 3) {
      void (async () => {
        setIsGenerating(true);
        try {
          await generateForecast(7);
          setIsForecastExpanded(true);
        } catch (error) {
          console.error('Forecast regen on locale change failed:', error);
        } finally {
          setIsGenerating(false);
        }
      })();
    }
  }, [effectiveLocale, generateForecast, visibleEntries.length]);

  const handleGenerateForecast = async () => {
    if (visibleEntries.length < 3) {
      Alert.alert(
        t('weatherStation.alerts.minEntries.title'),
        t('weatherStation.alerts.minEntries.message'),
      );
      return;
    }

    setIsGenerating(true);
    try {
      await generateForecast(7);
      setIsForecastExpanded(true);
    } catch (error) {
      Alert.alert(
        t('weatherStation.alerts.generateFailed.title'),
        t('weatherStation.alerts.generateFailed.message'),
      );
      console.error('Forecast generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskColor = (riskLevel: 'high' | 'medium' | 'low') => {
    switch (riskLevel) {
      case 'high':
        return COLORS.primaryDark;
      case 'medium':
        return COLORS.primary;
      case 'low':
        return COLORS.accent;
      default:
        return COLORS.gray[500];
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('weatherStation.dates.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('weatherStation.dates.tomorrow');
    }
    return formatLocaleDate(date, effectiveLocale, 'short');
  };

  return (
    <View style={styles.forecastContainer}>
      <TouchableOpacity
        style={styles.forecastHeader}
        onPress={() => {
          if (!emotionForecast && !isGenerating) {
            handleGenerateForecast();
          } else if (emotionForecast) {
            setIsForecastExpanded(!isForecastExpanded);
          }
        }}
        disabled={isGenerating}
      >
        <View style={styles.forecastHeaderLeft}>
          <TrendingUp size={20} color={COLORS.primary} />
          <Text style={styles.forecastTitle}>{t('weatherStation.forecast.title')}</Text>
          {emotionForecast && highCount > 0 && (
            <View style={styles.warningBadge}>
              <Heart size={12} color={COLORS.text.inverse} />
              <Text style={styles.warningBadgeText}>{highCount}</Text>
            </View>
          )}
        </View>
        {isGenerating ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : emotionForecast ? (
          isForecastExpanded ? (
            <ChevronUp size={20} color={COLORS.gray[500]} />
          ) : (
            <ChevronDown size={20} color={COLORS.gray[500]} />
          )
        ) : (
          <Text style={styles.generateForecastText}>{t('weatherStation.forecast.generate')}</Text>
        )}
      </TouchableOpacity>

      {isForecastExpanded && emotionForecast && (
        <View style={styles.forecastContent}>
          <Text style={styles.forecastSummary}>{emotionForecast.summary}</Text>

          {emotionForecast.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {emotionForecast.warnings.slice(0, 3).map((warning) => (
                <View
                  key={warning.date}
                  style={[
                    styles.warningItem,
                    { borderLeftColor: getRiskColor(warning.severity) },
                  ]}
                >
                  <Text style={styles.warningDate}>{formatDate(warning.date)}</Text>
                  <Text style={styles.warningMessage}>{warning.message}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.predictionsContainer}>
            <Text style={styles.predictionsTitle}>{t('weatherStation.forecast.trendTitle')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.predictionsList}>
                {emotionForecast.predictions.map((prediction) => (
                  <View key={prediction.date} style={styles.predictionItem}>
                    <Text style={styles.predictionDate}>{formatDate(prediction.date)}</Text>
                    <View
                      style={[
                        styles.predictionIndicator,
                        { backgroundColor: getRiskColor(prediction.riskLevel) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.predictionLevel,
                          { color: getRiskColor(prediction.riskLevel) },
                        ]}
                      >
                        {prediction.predictedMoodLevel.toFixed(1)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.predictionRisk,
                        { color: getRiskColor(prediction.riskLevel) },
                      ]}
                    >
                      {t(`weatherStation.risk.${prediction.riskLevel}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  forecastContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
  },
  warningBadgeText: {
    fontSize: DESIGN_TOKENS.fontSize.footnote,
    fontWeight: 'bold',
    color: COLORS.text.inverse,
  },
  generateForecastText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  forecastContent: {
    marginTop: 16,
  },
  forecastSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  warningsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  warningItem: {
    padding: 12,
    backgroundColor: COLORS.background.page,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
    borderLeftWidth: 3,
  },
  warningDate: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  predictionsContainer: {
    marginTop: 8,
  },
  predictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  predictionsList: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  predictionDate: {
    fontSize: DESIGN_TOKENS.fontSize.footnote,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  predictionIndicator: {
    width: 50,
    height: 50,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  predictionLevel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionRisk: {
    fontSize: DESIGN_TOKENS.fontSize.footnote,
    fontWeight: '500',
  },
});
