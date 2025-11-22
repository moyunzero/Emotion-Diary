import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { MOOD_CONFIG } from '../constants';
import { useApp } from '../context/AppContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 64; // Subtract padding

const COLORS = ['#FDA4AF', '#FCD34D', '#60A5FA', '#A78BFA', '#34D399'];

const Insights: React.FC = () => {
  const { entries } = useApp();

  // Data Prep: Mood Distribution
  const moodData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach(e => {
      const config = MOOD_CONFIG[e.moodLevel];
      const level = config?.level || e.moodLevel;
      if (level) counts[level]++;
    });
    
    // 获取所有级别的标签，按level排序
    const sortedLevels = Object.values(MOOD_CONFIG)
      .map(config => config.level)
      .sort((a, b) => a - b);
    
    const labels = sortedLevels.map(level => `${level}级`);
    const data = sortedLevels.map(level => counts[level] || 0);
    
    return {
      labels,
      datasets: [{ data }],
    };
  }, [entries]);

  // Data Prep: Top Offenders
  const offenderData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      e.people.forEach(p => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [entries]);

  const pieChartData = offenderData.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: COLORS[index % COLORS.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const barChartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(251, 113, 133, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#FB7185"
    }
  };

  const pieChartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>数据洞察</Text>

      <View style={styles.content}>
        {/* Mood Trend */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>情绪分布</Text>
          <View style={styles.chartWrapper}>
            <BarChart
              data={moodData}
              width={chartWidth}
              height={200}
              chartConfig={barChartConfig}
              showValuesOnTopOfBars
              fromZero
              segments={5}
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
            />
          </View>
        </View>

        {/* Top Offenders */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>惹我生气排行榜</Text>
          <View style={styles.chartWrapper}>
            {offenderData.length > 0 ? (
              <PieChart
                data={pieChartData}
                width={chartWidth}
                height={200}
                chartConfig={pieChartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>暂无数据</Text>
              </View>
            )}
          </View>
          <View style={styles.legendContainer}>
            {offenderData.map((o, i) => (
              <View key={o.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                <Text style={styles.legendText}>{o.name} {o.value}次</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Relationship Health Report */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryEmoji}>📋</Text>
            <Text style={styles.summaryTitle}>本月总结</Text>
          </View>
          <Text style={styles.summaryText}>
            你本月共记录了 <Text style={styles.summaryHighlight}>{entries.length}</Text> 次情绪波动。
            虽然有些小摩擦，但你处理情绪的速度比上个月快了 <Text style={styles.summaryHighlight}>15%</Text>！
            继续保持这种积极沟通的态度哦~ 
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    backgroundColor: '#FFF1F2',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryEmoji: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9F1239',
  },
  summaryText: {
    fontSize: 14,
    color: '#BE123C',
    lineHeight: 20,
  },
  summaryHighlight: {
    fontWeight: 'bold',
    color: '#9F1239',
  },
});

export default Insights;
