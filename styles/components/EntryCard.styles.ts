import { StyleSheet } from 'react-native';
import { COLORS, DESIGN_TOKENS } from '../../constants/colors';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsiveUtils';

export const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: DESIGN_TOKENS.spacing.lg,
    marginVertical: 6,
  },
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
    padding: DESIGN_TOKENS.spacing.lg,
    ...DESIGN_TOKENS.shadow.md,
  },
  resolvedContainer: {
    opacity: 0.5,
  },
  // 灰烬卡片样式 - 使用浅色背景，符合整体配色
  burnedContainer: {
    backgroundColor: COLORS.background.secondary, // #F9FAFB - 浅灰背景
    borderWidth: 1,
    borderColor: COLORS.border.light, // #E5E7EB - 浅灰边框
    borderStyle: 'dashed', // 虚线边框，暗示"已过去"的状态
    shadowColor: COLORS.primary, // 使用主色调（粉色）作为阴影
    shadowOpacity: 0.08,
    shadowRadius: DESIGN_TOKENS.spacing.sm,
  },
  ashIconBadge: {
    backgroundColor: COLORS.gray[200], // #E5E7EB - 浅灰背景
  },
  burnedTitle: {
    fontSize: DESIGN_TOKENS.fontSize.md,
    fontWeight: '700',
    color: COLORS.text.secondary, // #6B7280 - 次要文本色
    marginBottom: DESIGN_TOKENS.spacing.xs,
    letterSpacing: 0.5,
  },
  burnedDate: {
    fontSize: responsiveFontSize.small(12),
    color: COLORS.text.tertiary, // #9CA3AF - 三级文本色
    fontWeight: '500',
  },
  burnedContentContainer: {
    marginTop: DESIGN_TOKENS.spacing.md,
    paddingTop: DESIGN_TOKENS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light, // #E5E7EB - 浅灰分隔线
  },
  burnedContentLabel: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: COLORS.text.tertiary, // #9CA3AF
    fontWeight: '600',
    marginBottom: 6,
  },
  burnedContent: {
    fontSize: DESIGN_TOKENS.fontSize.base,
    color: COLORS.text.secondary, // #6B7280
    lineHeight: 20,
    fontStyle: 'italic',
    opacity: 0.7, // 降低不透明度，暗示"已过去"
  },
  burnedHint: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: COLORS.text.tertiary, // #9CA3AF
    marginTop: DESIGN_TOKENS.spacing.sm,
    fontStyle: 'italic',
  },
  burnedMetaContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light, // #E5E7EB
  },
  burnedMeta: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: COLORS.text.tertiary, // #9CA3AF
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  // 焚烧按钮样式优化
  burnActionButton: {
    // 焚烧按钮更突出
  },
  burnActionIcon: {
    backgroundColor: '#FEF3F2',
  },
  burnActionText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  deleteActionText: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: COLORS.text.tertiary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  moodIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  peopleText: {
    fontSize: DESIGN_TOKENS.fontSize.base,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: DESIGN_TOKENS.spacing.sm,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: responsiveFontSize.small(11),
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  contentText: {
    fontSize: responsiveFontSize.body(14),
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deadlineTag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 10,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: 10,
  },
  deadlineText: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  triggerTag: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: 10,
  },
  triggerText: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    color: '#F472B6',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: DESIGN_TOKENS.fontSize.xs,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});
