import { Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

const WeatherStation: React.FC = () => {
  const { weather } = useApp();

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny':
        return <Sun size={48} color="#F59E0B" />;
      case 'cloudy':
        return <Cloud size={48} color="#6B7280" />;
      case 'rainy':
        return <CloudRain size={48} color="#3B82F6" />;
      case 'stormy':
        return <CloudSnow size={48} color="#EF4444" />;
      default:
        return <Sun size={48} color="#F59E0B" />;
    }
  };

  const getWeatherBgColor = () => {
    switch (weather.condition) {
      case 'sunny':
        return '#FEF3C7';
      case 'cloudy':
        return '#F3F4F6';
      case 'rainy':
        return '#DBEAFE';
      case 'stormy':
        return '#FEE2E2';
      default:
        return '#FEF3C7';
    }
  };

  const getWeatherTextColor = () => {
    switch (weather.condition) {
      case 'sunny':
        return '#92400E';
      case 'cloudy':
        return '#374151';
      case 'rainy':
        return '#1E40AF';
      case 'stormy':
        return '#991B1B';
      default:
        return '#92400E';
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: getWeatherBgColor() }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: getWeatherTextColor() }]}>
          关系天气
        </Text>
        <Text style={[styles.score, { color: getWeatherTextColor() }]}>
          {weather.score}°
        </Text>
      </View>
      
      <View style={styles.iconContainer}>
        {getWeatherIcon()}
      </View>
      
      <Text style={[styles.description, { color: getWeatherTextColor() }]}>
        {weather.description}
      </Text>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>情绪指数</Text>
          <Text style={[styles.detailValue, { color: getWeatherTextColor() }]}>
            {weather.score}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>天气状况</Text>
          <Text style={[styles.detailValue, { color: getWeatherTextColor() }]}>
            {weather.condition === 'sunny' ? '晴朗' : 
             weather.condition === 'cloudy' ? '多云' : 
             weather.condition === 'rainy' ? '有雨' : '暴风雨'}
          </Text>
        </View>
      </View>
    </Animated.View>
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
});

export default WeatherStation;
