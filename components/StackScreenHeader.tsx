/**
 * 栈式顶栏：返回或关闭 + 居中标题或自定义中间区 + 右侧槽（与 Phase 15 令牌一致）
 */

import { ChevronLeft, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { useThemeStyles } from '../hooks/useThemeStyles';

export type StackScreenHeaderProps = {
  readonly onBack?: () => void;
  /** 左侧图标：默认返回箭头；Modal 等场景用 close */
  readonly leading?: 'back' | 'close';
  readonly title?: string;
  /** 自定义中间区域（与 title 二选一优先展示此项，如「图标 + 标题」） */
  readonly headerCenter?: React.ReactNode;
  /** 右侧自定义节点（左侧返回时用于平衡布局） */
  readonly headerRight?: React.ReactNode;
  readonly backAccessibilityLabel?: string;
  readonly backAccessibilityHint?: string;
  readonly titleAccessibilityLabel?: string;
  /** 覆盖默认标题色（如洞察/回顾图主题） */
  readonly titleColor?: string;
  readonly titleFontSize?: number;
  readonly titleFontFamily?: string;
  /** 右侧槽最小宽度，默认取 screenHeader.sideSlotWidth */
  readonly sideSlotWidth?: number;
  readonly style?: StyleProp<ViewStyle>;
};

export function StackScreenHeader({
  onBack,
  leading = 'back',
  title = '',
  headerCenter,
  headerRight,
  backAccessibilityLabel,
  backAccessibilityHint,
  titleAccessibilityLabel,
  titleColor,
  titleFontSize,
  titleFontFamily,
  sideSlotWidth,
  style,
}: StackScreenHeaderProps) {
  const { t } = useTranslation('common');
  const { tokens, screenHeader } = useThemeStyles();
  const slotW = sideSlotWidth ?? screenHeader.sideSlotWidth;
  const resolvedTitleColor = titleColor ?? screenHeader.titleColor;
  const resolvedTitleSize = titleFontSize ?? screenHeader.titleFontSize;
  const showLeading = Boolean(onBack);
  const showTitle = title.length > 0;
  const showCustomCenter = headerCenter != null && headerCenter !== false;
  const defaultBackLabel =
    leading === 'close' ? t('shell.close') : t('shell.back');
  const resolvedBackLabel = backAccessibilityLabel ?? defaultBackLabel;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View
        style={{
          width: slotW,
          minHeight: screenHeader.minTouchTarget,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {showLeading ? (
          <Pressable
            onPress={onBack}
            hitSlop={screenHeader.backHitSlop}
            accessibilityRole="button"
            accessibilityLabel={resolvedBackLabel}
            accessibilityHint={backAccessibilityHint}
            style={{
              padding: tokens.spacing.sm,
              marginLeft: -tokens.spacing.sm,
              minWidth: screenHeader.minTouchTarget,
              minHeight: screenHeader.minTouchTarget,
              justifyContent: 'center',
            }}
          >
            {leading === 'close' ? (
              <X
                size={screenHeader.backIconSize}
                color={screenHeader.backIconColor}
              />
            ) : (
              <ChevronLeft
                size={screenHeader.backIconSize}
                color={screenHeader.backIconColor}
              />
            )}
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: tokens.spacing.sm,
        }}
      >
        {showCustomCenter ? (
          <View
            accessibilityRole="header"
            accessibilityLabel={
              titleAccessibilityLabel ??
              (showTitle ? title : undefined)
            }
          >
            {headerCenter}
          </View>
        ) : showTitle ? (
          <Text
            accessibilityRole="header"
            accessibilityLabel={titleAccessibilityLabel ?? title}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontSize: resolvedTitleSize,
              fontWeight: 'bold',
              color: resolvedTitleColor,
              ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
            }}
          >
            {title}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: slotW,
          minHeight: screenHeader.minTouchTarget,
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        {headerRight ??
          (!showLeading && !showTitle && !showCustomCenter ? null : (
            <View style={{ width: slotW }} />
          ))}
      </View>
    </View>
  );
}
