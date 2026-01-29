import { COLORS as GlobalColors } from '../../constants/colors';

// Insights 专用配色（扩展全局颜色）
export const INSIGHTS_COLORS = {
  primary: GlobalColors.primary,
  secondary: GlobalColors.accent,
  accent: GlobalColors.primaryDark,
  bgStart: '#FFF5F5',
  bgEnd: '#F0FDF4',
  text: GlobalColors.text.primary,
  textSecondary: GlobalColors.text.secondary,
  cardBg: GlobalColors.background.primary,
  bloomingColor: GlobalColors.accent,
  growingColor: GlobalColors.warning,
  needWaterColor: '#FCA5A5',
} as const;

// 触发器建议配置
export const TRIGGER_ADVICE: Record<string, string> = {
  '工作': '给自己的花园放个假吧，休息也是成长的一部分',
  '学习': '学习的压力是暂时的，你的努力终会开花结果',
  '家庭': '家人之间的摩擦是修剪枝叶，让关系更健康',
  '朋友': '友谊的花朵需要双向浇灌，试着主动表达关心',
  '沟通': '试试用"我感到..."开头表达感受，而非指责',
  '信任': '信任是需要时间慢慢浇灌的，给彼此一些耐心',
  '隐私': '每朵花都需要自己的空间，尊重边界很重要',
  '其他': '每一次情绪都是了解自己的机会',
} as const;
