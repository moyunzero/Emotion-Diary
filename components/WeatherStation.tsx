import { AlertTriangle, ChevronDown, ChevronUp, Cloud, CloudRain, CloudSnow, Sun, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';

const WeatherStationComponent: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const weather = useAppStore((state) => state.weather);
  const emotionForecast = useAppStore((state) => state.emotionForecast);
  const entries = useAppStore((state) => state.entries);
  const effectiveLocale = useAppStore((state) => state.effectiveLocale);
  const generateForecast = useAppStore((state) => state.generateForecast);

  const visibleEntries = useMemo(
    () => excludeSoftDeletedEntries(entries),
    [entries],
  );

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

  // 天气配置对象，统一管理图标、背景色和文字颜色（使用 useMemo 缓存）
  const weatherConfig = useMemo(() => ({
    sunny: {
      icon: <Sun size={48} color="#F59E0B" />,
      bgColor: '#FEF3C7',
      textColor: '#92400E',
    },
    cloudy: {
      icon: <Cloud size={48} color="#6B7280" />,
      bgColor: '#F3F4F6',
      textColor: '#374151',
    },
    rainy: {
      icon: <CloudRain size={48} color="#3B82F6" />,
      bgColor: '#DBEAFE',
      textColor: '#1E40AF',
    },
    stormy: {
      icon: <CloudSnow size={48} color="#EF4444" />,
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
    },
  }), []);

  const currentWeather = useMemo(
    () => weatherConfig[weather.condition] || weatherConfig.sunny,
    [weather.condition, weatherConfig]
  );

  /**
   * Generate emotion forecast
   */
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

  /**
   * Risk level color helper
   */
  const getRiskColor = (riskLevel: 'high' | 'medium' | 'low') => {
    switch (riskLevel) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  /**
   * Format date for forecast labels (today/tomorrow via i18n)
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('weatherStation.dates.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('weatherStation.dates.tomorrow');
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const conditionLabel = useMemo(() => {
    const key = `weatherStation.conditions.${weather.condition}` as const;
    const translated = t(key);
    return translated === key
      ? t('weatherStation.conditions.sunny')
      : translated;
  }, [weather.condition, t]);

  const descriptionLabel = useMemo(() => {
    const key = `weatherStation.descriptions.${weather.condition}` as const;
    const translated = t(key);
    return translated === key
      ? t('weatherStation.descriptions.sunny')
      : translated;
  }, [weather.condition, t]);

  return (
    <View>
      <Animated.View style={[styles.container, { backgroundColor: currentWeather.bgColor }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentWeather.textColor }]}>
            {t('weatherStation.title')}
          </Text>
          <Text style={[styles.score, { color: currentWeather.textColor }]}>
            {weather.score}°
          </Text>
        </View>
        
        <View style={styles.iconContainer}>
          {currentWeather.icon}
        </View>
        
        <Text style={[styles.description, { color: currentWeather.textColor }]}>
          {descriptionLabel}
        </Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('weatherStation.emotionIndex')}</Text>
            <Text style={[styles.detailValue, { color: currentWeather.textColor }]}>
              {weather.score}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('weatherStation.conditionLabel')}</Text>
            <Text style={[styles.detailValue, { color: currentWeather.textColor }]}>
              {conditionLabel}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Emotion forecast section */}
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
            <TrendingUp size={20} color="#FDA4AF" />
            <Text style={styles.forecastTitle}>{t('weatherStation.forecast.title')}</Text>
            {emotionForecast && emotionForecast.warnings.length > 0 && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={12} color="#FFFFFF" />
                <Text style={styles.warningBadgeText}>
                  {emotionForecast.warnings.filter(w => w.severity === 'high').length}
                </Text>
              </View>
            )}
          </View>
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FDA4AF" />
          ) : emotionForecast ? (
            isForecastExpanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )
          ) : (
            <Text style={styles.generateForecastText}>{t('weatherStation.forecast.generate')}</Text>
          )}
        </TouchableOpacity>

        {isForecastExpanded && emotionForecast && (
          <View style={styles.forecastContent}>
            {/* AI summary — rendered as cached (D-89 defer) */}
            <Text style={styles.forecastSummary}>{emotionForecast.summary}</Text>

            {/* AI warnings — message body cached (D-89 defer) */}
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

            {/* 7-day predictions */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#92400E',
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  forecastContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
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
    color: '#1F2937',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  warningBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  generateForecastText: {
    fontSize: 14,
    color: '#FDA4AF',
    fontWeight: '500',
  },
  forecastContent: {
    marginTop: 16,
  },
  forecastSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 16,
  },
  warningsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  warningItem: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  warningDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  predictionsContainer: {
    marginTop: 8,
  },
  predictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  predictionIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  predictionLevel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionRisk: {
    fontSize: 10,
    fontWeight: '500',
  },
});

/**
 * Memoized WeatherStation component
 * Since this component uses Zustand selectors internally and has no props,
 * React.memo will prevent re-renders when parent components re-render
 * but the Zustand state hasn't changed (Zustand handles its own optimization)
 */
const WeatherStation = React.memo(WeatherStationComponent);

export default WeatherStation;
