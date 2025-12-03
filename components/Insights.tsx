import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOOD_CONFIG } from '../constants';
import { useApp } from '../context/AppContext';
import { Status } from '../types';

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

  // Data Prep: Monthly Summary
  const summaryData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1).getTime();
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).getTime();

    const thisMonthEntries = entries.filter(e => e.timestamp >= startOfThisMonth);
    const lastMonthEntries = entries.filter(e => e.timestamp >= startOfLastMonth && e.timestamp < startOfThisMonth);

    const calculateAvgTime = (data: typeof entries) => {
      const resolved = data.filter(e => e.status === Status.RESOLVED && e.resolvedAt);
      if (resolved.length === 0) return 0;
      const totalTime = resolved.reduce((acc, curr) => acc + (curr.resolvedAt! - curr.timestamp), 0);
      return totalTime / resolved.length;
    };

    const thisMonthAvg = calculateAvgTime(thisMonthEntries);
    const lastMonthAvg = calculateAvgTime(lastMonthEntries);

    let comparisonText = "";
    let highlightText = "";
    
    if (thisMonthAvg > 0 && lastMonthAvg > 0) {
      const diff = lastMonthAvg - thisMonthAvg;
      const percent = Math.abs((diff / lastMonthAvg) * 100).toFixed(0);
      if (diff > 0) {
        comparisonText = `虽然有些小摩擦，但你处理情绪的速度比上个月快了 `;
        highlightText = `${percent}%`;
      } else {
        comparisonText = `处理情绪的速度比上个月慢了 `;
        highlightText = `${percent}%`;
      }
    } else if (thisMonthAvg > 0) {
      const hours = (thisMonthAvg / (1000 * 60 * 60)).toFixed(1);
      comparisonText = `本月平均处理情绪耗时 `;
      highlightText = `${hours}小时`;
    } else {
      comparisonText = "本月还没有已解决的情绪记录，";
      highlightText = "继续加油";
    }

    return {
      count: thisMonthEntries.length,
      text: comparisonText,
      highlight: highlightText,
      suffix: thisMonthAvg > 0 && lastMonthAvg > 0 ? "！" : (thisMonthAvg > 0 ? "。" : "！")
    };
  }, [entries]);

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            你本月共记录了 <Text style={styles.summaryHighlight}>{summaryData.count}</Text> 次情绪波动。
            {summaryData.text}<Text style={styles.summaryHighlight}>{summaryData.highlight}</Text>{summaryData.suffix}
            继续保持这种积极沟通的态度哦~ 
          </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 24,
    paddingTop: 8,
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
