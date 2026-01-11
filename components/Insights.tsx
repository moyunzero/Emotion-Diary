import {
  Cloud,
  CloudLightning,
  CloudRain,
  Droplet,
  Droplets,
  Flower2,
  Heart,
  Leaf,
  Sparkles,
  Sprout,
  Sun,
  TreeDeciduous,
  Zap
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { MOOD_CONFIG } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { MoodEntry, MoodLevel, Status } from '../types';
import { generateEmotionPrescription } from '../utils/aiService';
import EmotionPodcast from './ai/EmotionPodcast';

const { width: screenWidth } = Dimensions.get('window');

// ============================================
// 配色方案
// ============================================
const COLORS = {
  primary: '#FDA4AF',      // 粉色 - 花朵
  secondary: '#86EFAC',    // 浅绿 - 叶子/成长
  accent: '#FB7185',       // 深粉
  bgStart: '#FFF5F5',      // 背景渐变起始
  bgEnd: '#F0FDF4',        // 背景渐变结束
  text: '#1F2937',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  // 花盆状态颜色
  bloomingColor: '#86EFAC',   // 繁花盛开
  growingColor: '#FCD34D',    // 正常生长
  needWaterColor: '#FCA5A5',  // 需要浇水
};

// ============================================
// 工具函数
// ============================================

// 获取本周的日期范围
const getWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// 获取星期几的中文名
const getWeekdayName = (date: Date) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};

// 判断是否是今天
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// 获取情绪等级对应的天气图标
const getMoodWeatherIcon = (level: number | null, size: number = 24) => {
  if (level === null) return <Sprout size={size} color="#D1D5DB" />;
  
  switch (level) {
    case 1:
      return <Droplet size={size} color="#F59E0B" />;
    case 2:
      return <Cloud size={size} color="#F97316" />;
    case 3:
      return <CloudRain size={size} color="#EF4444" />;
    case 4:
      return <CloudLightning size={size} color="#DC2626" />;
    case 5:
      return <Zap size={size} color="#991B1B" />;
    default:
      return <Sun size={size} color="#F59E0B" />;
  }
};

// 获取情绪等级对应的花朵状态文案
const getMoodFlowerStatus = (level: number | null) => {
  if (level === null) return '种子';
  switch (level) {
    case 1: return '含苞待放';
    case 2: return '花苞微开';
    case 3: return '需要照料';
    case 4: return '有点蔫';
    case 5: return '需紧急浇水';
    default: return '种子';
  }
};

// 获取花盆状态
const getFlowerPotStatus = (resolveRate: number) => {
  if (resolveRate >= 0.7) {
    return { status: 'blooming', label: '繁花盛开', color: COLORS.bloomingColor };
  } else if (resolveRate >= 0.3) {
    return { status: 'growing', label: '正常生长', color: COLORS.growingColor };
  } else {
    return { status: 'needWater', label: '需要浇水', color: COLORS.needWaterColor };
  }
};

// 获取成长阶段
const getGrowthStage = (rate: number) => {
  if (rate >= 0.8) return { stage: 'bloom', label: '开花', icon: Flower2 };
  if (rate >= 0.6) return { stage: 'bud', label: '花苞', icon: TreeDeciduous };
  if (rate >= 0.4) return { stage: 'seedling', label: '幼苗', icon: Leaf };
  if (rate >= 0.2) return { stage: 'sprout', label: '发芽', icon: Sprout };
  return { stage: 'seed', label: '种子', icon: Sprout };
};

// 触发器建议配置
const TRIGGER_ADVICE: Record<string, string> = {
  '工作': '给自己的花园放个假吧，休息也是成长的一部分',
  '学习': '学习的压力是暂时的，你的努力终会开花结果',
  '家庭': '家人之间的摩擦是修剪枝叶，让关系更健康',
  '朋友': '友谊的花朵需要双向浇灌，试着主动表达关心',
  '沟通': '试试用"我感到..."开头表达感受，而非指责',
  '信任': '信任是需要时间慢慢浇灌的，给彼此一些耐心',
  '隐私': '每朵花都需要自己的空间，尊重边界很重要',
  '其他': '每一次情绪都是了解自己的机会',
};

// ============================================
// 子组件：花园主题头部
// ============================================
interface GardenHeaderProps {
  totalEntries: number;
  resolvedCount: number;
}

const GardenHeader: React.FC<GardenHeaderProps> = ({ totalEntries, resolvedCount }) => {
  const getGardenStatus = () => {
    if (totalEntries === 0) return '开始种下你的第一颗种子吧';
    const rate = resolvedCount / totalEntries;
    if (rate >= 0.7) return '你的花园正在茁壮成长';
    if (rate >= 0.4) return '花园需要你的悉心照料';
    return '记得给花园浇浇水哦';
  };

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.titleRow}>
        <Flower2 size={28} color={COLORS.accent} />
        <Text style={headerStyles.title}>我的心灵花园</Text>
      </View>
      <Text style={headerStyles.subtitle}>{getGardenStatus()}</Text>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 38,
  },
});

// ============================================
// 子组件：本周情绪天气
// ============================================
interface WeeklyMoodWeatherProps {
  entries: MoodEntry[];
}

const WeeklyMoodWeather: React.FC<WeeklyMoodWeatherProps> = ({ entries }) => {
  const weekDates = getWeekDates();

  // 计算每天的最高情绪等级
  const dailyMoods = useMemo(() => {
    return weekDates.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate >= dayStart && entryDate <= dayEnd;
      });

      if (dayEntries.length === 0) return null;

      // 返回当天最高情绪等级
      return Math.max(...dayEntries.map(e => {
        const config = MOOD_CONFIG[e.moodLevel];
        return config?.level || e.moodLevel;
      }));
    });
  }, [entries, weekDates]);

  return (
    <View style={weeklyStyles.container}>
      <View style={weeklyStyles.header}>
        <Sun size={20} color={COLORS.accent} />
        <Text style={weeklyStyles.title}>本周情绪天气</Text>
      </View>
      <View style={weeklyStyles.weekContainer}>
        {weekDates.map((date, index) => {
          const moodLevel = dailyMoods[index];
          const today = isToday(date);
          return (
            <View
              key={index}
              style={[
                weeklyStyles.dayCard,
                today && weeklyStyles.todayCard,
              ]}
            >
              <Text style={[weeklyStyles.weekday, today && weeklyStyles.todayText]}>
                {getWeekdayName(date)}
              </Text>
              <View style={weeklyStyles.iconContainer}>
                {getMoodWeatherIcon(moodLevel, 28)}
              </View>
              <Text style={[weeklyStyles.status, today && weeklyStyles.todayText]}>
                {getMoodFlowerStatus(moodLevel)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const weeklyStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
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
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
  },
  todayCard: {
    backgroundColor: '#FFF1F2',
  },
  weekday: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
    height: 16,
  },
  todayText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  iconContainer: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    height: 28,
    lineHeight: 14,
  },
});

// ============================================
// 子组件：治愈进度
// ============================================
interface HealingProgressProps {
  totalCount: number;
  resolvedCount: number;
}

const HealingProgress: React.FC<HealingProgressProps> = ({ totalCount, resolvedCount }) => {
  const rate = totalCount > 0 ? resolvedCount / totalCount : 0;
  const pendingCount = totalCount - resolvedCount;
  const growthStage = getGrowthStage(rate);
  const GrowthIcon = growthStage.icon;

  // 环形进度条参数
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - rate);

  return (
    <View style={healingStyles.container}>
      <View style={healingStyles.header}>
        <Heart size={20} color={COLORS.accent} />
        <Text style={healingStyles.title}>治愈进度</Text>
      </View>
      
      <View style={healingStyles.content}>
        {/* 环形进度条 */}
        <View style={healingStyles.progressContainer}>
          <Svg width={size} height={size}>
            {/* 背景圆环 */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* 进度圆环 */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.secondary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          {/* 中心图标 */}
          <View style={healingStyles.centerIcon}>
            <GrowthIcon size={36} color={COLORS.secondary} />
            <Text style={healingStyles.stageLabel}>{growthStage.label}</Text>
          </View>
        </View>

        {/* 统计信息 */}
        <View style={healingStyles.stats}>
          <View style={healingStyles.statItem}>
            <Flower2 size={18} color={COLORS.secondary} />
            <Text style={healingStyles.statNumber}>{resolvedCount}</Text>
            <Text style={healingStyles.statLabel}>朵情绪小花绽放</Text>
          </View>
          <View style={healingStyles.statItem}>
            <Sprout size={18} color={COLORS.textSecondary} />
            <Text style={healingStyles.statNumber}>{pendingCount}</Text>
            <Text style={healingStyles.statLabel}>颗种子等待发芽</Text>
          </View>
        </View>
      </View>

      {/* 鼓励文案 */}
      <View style={healingStyles.encouragement}>
        <Sparkles size={14} color={COLORS.accent} />
        <Text style={healingStyles.encouragementText}>
          每一次面对情绪，都是在浇灌自己的心灵
        </Text>
      </View>
    </View>
  );
};

const healingStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
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
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  stats: {
    flex: 1,
    marginLeft: 20,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  encouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  encouragementText: {
    fontSize: 13,
    color: COLORS.accent,
    fontStyle: 'italic',
  },
});

// ============================================
// 子组件：关系花盆
// ============================================
interface RelationshipGardenProps {
  entries: MoodEntry[];
}

const RelationshipGarden: React.FC<RelationshipGardenProps> = ({ entries }) => {
  // 计算每个人的关系健康度
  const relationshipData = useMemo(() => {
    const peopleStats: Record<string, { total: number; resolved: number }> = {};
    
    entries.forEach(e => {
      e.people.forEach(p => {
        if (!peopleStats[p]) {
          peopleStats[p] = { total: 0, resolved: 0 };
        }
        peopleStats[p].total++;
        if (e.status === Status.RESOLVED) {
          peopleStats[p].resolved++;
        }
      });
    });

    return Object.entries(peopleStats)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        resolved: stats.resolved,
        resolveRate: stats.total > 0 ? stats.resolved / stats.total : 0,
      }))
      .sort((a, b) => a.resolveRate - b.resolveRate) // 需要关注的排前面
      .slice(0, 5);
  }, [entries]);

  if (relationshipData.length === 0) {
    return (
      <View style={relationStyles.container}>
        <View style={relationStyles.header}>
          <Droplets size={20} color={COLORS.accent} />
          <Text style={relationStyles.title}>关系花园</Text>
        </View>
        <View style={relationStyles.emptyContainer}>
          <Sprout size={40} color="#D1D5DB" />
          <Text style={relationStyles.emptyText}>还没有种下关系的种子</Text>
          <Text style={relationStyles.emptySubtext}>记录情绪时添加相关的人吧</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={relationStyles.container}>
      <View style={relationStyles.header}>
        <Droplets size={20} color={COLORS.accent} />
        <Text style={relationStyles.title}>关系花园</Text>
      </View>
      <Text style={relationStyles.subtitle}>这些关系需要你的关注</Text>
      
      <View style={relationStyles.potsContainer}>
        {relationshipData.map((person, index) => {
          const potStatus = getFlowerPotStatus(person.resolveRate);
          return (
            <View key={person.name} style={relationStyles.potItem}>
              {/* 花盆图标 */}
              <View style={[relationStyles.pot, { backgroundColor: potStatus.color + '30' }]}>
                {potStatus.status === 'blooming' ? (
                  <Flower2 size={24} color={potStatus.color} />
                ) : potStatus.status === 'growing' ? (
                  <Leaf size={24} color={potStatus.color} />
                ) : (
                  <Droplets size={24} color={potStatus.color} />
                )}
              </View>
              {/* 人名 */}
              <Text style={relationStyles.personName} numberOfLines={1}>
                {person.name}
              </Text>
              {/* 状态标签 */}
              <View style={[relationStyles.statusBadge, { backgroundColor: potStatus.color + '20' }]}>
                <Text style={[relationStyles.statusText, { color: potStatus.color }]}>
                  {potStatus.label}
                </Text>
              </View>
              {/* 统计 */}
              <Text style={relationStyles.statsText}>
                {person.resolved}/{person.total} 已治愈
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const relationStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
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
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginLeft: 28,
  },
  potsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  potItem: {
    alignItems: 'center',
    width: (screenWidth - 100) / 3,
    minWidth: 80,
  },
  pot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  personName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

// ============================================
// 子组件：情绪触发洞察
// ============================================
interface TriggerInsightProps {
  entries: MoodEntry[];
}

// AI处方卡片组件
interface PrescriptionCardProps {
  trigger: string;
  moodLevel: MoodLevel;
  entries: MoodEntry[];
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ trigger, moodLevel, entries }) => {
  const [prescription, setPrescription] = useState<{ urgent: string; shortTerm: string; longTerm: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStep('正在分析你的情绪模式...');
    
    try {
      // 模拟步骤提示
      setTimeout(() => {
        setGeneratingStep('正在生成个性化建议...');
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
    }
  };

  if (!prescription && !isGenerating) {
    return (
      <TouchableOpacity
        style={prescriptionStyles.generateButton}
        onPress={handleGenerate}
      >
        <Sparkles size={14} color={COLORS.accent} />
        <Text style={prescriptionStyles.generateButtonText}>获取AI建议</Text>
      </TouchableOpacity>
    );
  }

  if (isGenerating) {
    return (
      <View style={prescriptionStyles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={prescriptionStyles.loadingText}>
          {generatingStep || 'AI正在生成建议...'}
        </Text>
      </View>
    );
  }

  if (generateError) {
    return (
      <View style={prescriptionStyles.errorContainer}>
        <Text style={prescriptionStyles.errorText}>生成失败：{generateError}</Text>
        <TouchableOpacity
          style={prescriptionStyles.retryButton}
          onPress={handleGenerate}
        >
          <Sparkles size={14} color={COLORS.accent} />
          <Text style={prescriptionStyles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prescription) return null;

  return (
    <View style={prescriptionStyles.container}>
      <TouchableOpacity
        style={prescriptionStyles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={prescriptionStyles.headerLeft}>
          <Sparkles size={16} color={COLORS.accent} />
          <Text style={prescriptionStyles.headerText}>AI个性化建议</Text>
        </View>
        <Text style={prescriptionStyles.expandText}>
          {isExpanded ? '收起' : '展开'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={prescriptionStyles.content}>
          <View style={prescriptionStyles.prescriptionItem}>
            <View style={[prescriptionStyles.prescriptionBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[prescriptionStyles.prescriptionBadgeText, { color: '#991B1B' }]}>
                紧急
              </Text>
            </View>
            <Text style={prescriptionStyles.prescriptionText}>{prescription.urgent}</Text>
          </View>

          <View style={prescriptionStyles.prescriptionItem}>
            <View style={[prescriptionStyles.prescriptionBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[prescriptionStyles.prescriptionBadgeText, { color: '#92400E' }]}>
                短期
              </Text>
            </View>
            <Text style={prescriptionStyles.prescriptionText}>{prescription.shortTerm}</Text>
          </View>

          <View style={prescriptionStyles.prescriptionItem}>
            <View style={[prescriptionStyles.prescriptionBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[prescriptionStyles.prescriptionBadgeText, { color: '#065F46' }]}>
                长期
              </Text>
            </View>
            <Text style={prescriptionStyles.prescriptionText}>{prescription.longTerm}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const prescriptionStyles = StyleSheet.create({
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.accent,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary + '20',
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.accent,
  },
  container: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    color: COLORS.text,
  },
});

const TriggerInsight: React.FC<TriggerInsightProps> = ({ entries }) => {
  // 统计触发器频率和平均情绪等级
  const triggerData = useMemo(() => {
    const counts: Record<string, { count: number; totalLevel: number }> = {};
    entries.forEach(e => {
      e.triggers?.forEach(t => {
        if (!counts[t]) {
          counts[t] = { count: 0, totalLevel: 0 };
        }
        counts[t].count++;
        counts[t].totalLevel += e.moodLevel;
      });
    });
    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgMoodLevel: Math.round((data.totalLevel / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [entries]);

  if (triggerData.length === 0) {
    const minEntries = 3;
    const currentCount = entries.length;
    const remaining = Math.max(0, minEntries - currentCount);
    
    return (
      <View style={triggerStyles.container}>
        <View style={triggerStyles.header}>
          <Leaf size={20} color={COLORS.accent} />
          <Text style={triggerStyles.title}>情绪触发洞察</Text>
        </View>
        <View style={triggerStyles.emptyContainer}>
          <Sprout size={40} color="#D1D5DB" />
          <Text style={triggerStyles.emptyText}>
            {remaining > 0 
              ? `再记录 ${remaining} 条情绪即可查看洞察` 
              : '还没有足够的数据'}
          </Text>
          <Text style={triggerStyles.emptySubtext}>记录更多情绪来获取洞察吧</Text>
          {remaining > 0 && (
            <View style={triggerStyles.progressContainer}>
              <View style={triggerStyles.progressBar}>
                <View 
                  style={[
                    triggerStyles.progressFill, 
                    { width: `${(currentCount / minEntries) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={triggerStyles.progressText}>
                {currentCount}/{minEntries}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={triggerStyles.container}>
      <View style={triggerStyles.header}>
        <Leaf size={20} color={COLORS.accent} />
        <Text style={triggerStyles.title}>情绪触发洞察</Text>
      </View>
      <Text style={triggerStyles.subtitle}>了解什么容易影响你的情绪</Text>

      <View style={triggerStyles.cardsContainer}>
        {triggerData.map((trigger, index) => (
          <View key={trigger.name} style={triggerStyles.card}>
            <View style={triggerStyles.cardHeader}>
              <View style={triggerStyles.rankBadge}>
                <Text style={triggerStyles.rankText}>#{index + 1}</Text>
              </View>
              <Text style={triggerStyles.triggerName}>{trigger.name}</Text>
              <Text style={triggerStyles.triggerCount}>{trigger.count}次</Text>
            </View>
            <View style={triggerStyles.adviceContainer}>
              <Sparkles size={14} color={COLORS.secondary} />
              <Text style={triggerStyles.adviceText}>
                {TRIGGER_ADVICE[trigger.name] || TRIGGER_ADVICE['其他']}
              </Text>
            </View>
            {/* AI处方卡片 */}
            <PrescriptionCard
              trigger={trigger.name}
              moodLevel={Math.min(5, Math.max(1, Math.round(trigger.avgMoodLevel))) as MoodLevel}
              entries={entries}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const triggerStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
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
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginLeft: 28,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  triggerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  triggerCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyHint: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

// ============================================
// 子组件：底部鼓励语
// ============================================
interface GardenFooterProps {
  thisMonthCount: number;
  lastMonthCount: number;
  resolvedCount: number;
}

const GardenFooter: React.FC<GardenFooterProps> = ({ 
  thisMonthCount, 
  lastMonthCount, 
  resolvedCount 
}) => {
  const getMessage = () => {
    if (thisMonthCount === 0) {
      return '开始记录，让你的心灵花园生根发芽吧';
    }
    
    const diff = thisMonthCount - lastMonthCount;
    if (diff > 0) {
      return `本月你认真照料了花园 ${thisMonthCount} 次，比上月多了 ${diff} 次`;
    } else if (diff < 0) {
      return `本月你照料了花园 ${thisMonthCount} 次，记得常来看看哦`;
    } else {
      return `你的花园正在变得越来越美丽`;
    }
  };

  const getSubMessage = () => {
    if (resolvedCount > 0) {
      return `每一朵盛开的花，都是你勇敢面对情绪的证明`;
    }
    return '每一次记录，都是照料心灵的开始';
  };

  return (
    <View style={footerStyles.container}>
      <View style={footerStyles.iconRow}>
        <Flower2 size={18} color={COLORS.primary} />
        <Leaf size={16} color={COLORS.secondary} />
        <Flower2 size={18} color={COLORS.primary} />
      </View>
      <Text style={footerStyles.mainText}>{getMessage()}</Text>
      <Text style={footerStyles.subText}>{getSubMessage()}</Text>
    </View>
  );
};

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mainText: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  subText: {
    fontSize: 12,
    color: '#BE123C',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

// ============================================
// 主组件：Insights
// ============================================
const Insights: React.FC = () => {
  const entries = useAppStore((state) => state.entries);

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1).getTime();
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).getTime();

    const thisMonthEntries = entries.filter(e => e.timestamp >= startOfThisMonth);
    const lastMonthEntries = entries.filter(
      e => e.timestamp >= startOfLastMonth && e.timestamp < startOfThisMonth
    );

    const resolvedEntries = entries.filter(e => e.status === Status.RESOLVED);

    return {
      total: entries.length,
      resolved: resolvedEntries.length,
      thisMonthCount: thisMonthEntries.length,
      lastMonthCount: lastMonthEntries.length,
    };
  }, [entries]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 花园主题头部 */}
        <GardenHeader 
          totalEntries={stats.total} 
          resolvedCount={stats.resolved} 
        />

        <View style={styles.content}>
          {/* 本周情绪天气 */}
          <WeeklyMoodWeather entries={entries} />

          {/* 治愈进度 */}
          <HealingProgress 
            totalCount={stats.total} 
            resolvedCount={stats.resolved} 
          />

          {/* 情绪播客 */}
          <EmotionPodcast />

          {/* 关系花盆 */}
          <RelationshipGarden entries={entries} />

          {/* 情绪触发洞察 */}
          <TriggerInsight entries={entries} />

          {/* 底部鼓励语 */}
          <GardenFooter 
            thisMonthCount={stats.thisMonthCount}
            lastMonthCount={stats.lastMonthCount}
            resolvedCount={stats.resolved}
          />
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
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
});

export default Insights;
