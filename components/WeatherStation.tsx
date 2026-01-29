import { AlertTriangle, ChevronDown, ChevronUp, Cloud, CloudRain, CloudSnow, Sun, TrendingUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

const WeatherStationComponent: React.FC = () => {
  const weather = useAppStore((state) => state.weather);
  const emotionForecast = useAppStore((state) => state.emotionForecast);
  const entries = useAppStore((state) => state.entries);
  const generateForecast = useAppStore((state) => state.generateForecast);
  
  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
   * 生成预测
   */
  const handleGenerateForecast = async () => {
    if (entries.length < 3) {
      Alert.alert('提示', '需要至少3条情绪记录才能生成预测');
      return;
    }

    setIsGenerating(true);
    try {
      await generateForecast(7);
      setIsForecastExpanded(true);
    } catch (error) {
      Alert.alert('生成失败', '生成情绪预测时出现错误，请稍后重试');
      console.error('生成预测失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 获取风险等级颜色
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
   * 格式化日期
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  return (
    <View>
      <Animated.View style={[styles.container, { backgroundColor: currentWeather.bgColor }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentWeather.textColor }]}>
            关系天气
          </Text>
          <Text style={[styles.score, { color: currentWeather.textColor }]}>
            {weather.score}°
          </Text>
        </View>
        
        <View style={styles.iconContainer}>
          {currentWeather.icon}
        </View>
        
        <Text style={[styles.description, { color: currentWeather.textColor }]}>
          {weather.description}
        </Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>情绪指数</Text>
            <Text style={[styles.detailValue, { color: currentWeather.textColor }]}>
              {weather.score}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>天气状况</Text>
            <Text style={[styles.detailValue, { color: currentWeather.textColor }]}>
              {weather.condition === 'sunny' ? '晴朗' : 
               weather.condition === 'cloudy' ? '多云' : 
               weather.condition === 'rainy' ? '有雨' : '暴风雨'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* 情绪预报区域 */}
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
            <Text style={styles.forecastTitle}>情绪预报</Text>
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
            <Text style={styles.generateForecastText}>生成预测</Text>
          )}
        </TouchableOpacity>

        {isForecastExpanded && emotionForecast && (
          <View style={styles.forecastContent}>
            {/* 摘要 */}
            <Text style={styles.forecastSummary}>{emotionForecast.summary}</Text>

            {/* 预警信息 */}
            {emotionForecast.warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                {emotionForecast.warnings.slice(0, 3).map((warning, index) => (
                  <View
                    key={index}
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

            {/* 未来7天预测 */}
            <View style={styles.predictionsContainer}>
              <Text style={styles.predictionsTitle}>未来7天趋势</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.predictionsList}>
                  {emotionForecast.predictions.map((prediction, index) => (
                    <View key={index} style={styles.predictionItem}>
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
                        {prediction.riskLevel === 'high'
                          ? '高风险'
                          : prediction.riskLevel === 'medium'
                          ? '中风险'
                          : '低风险'}
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
