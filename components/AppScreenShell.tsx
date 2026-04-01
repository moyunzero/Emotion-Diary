/**
 * 页面壳：ScreenContainer + 可选栈顶栏 + 主内容 + 可选底栏（Phase 15）
 */

import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import { ScreenContainer } from './ScreenContainer';
import {
  StackScreenHeader,
  type StackScreenHeaderProps,
} from './StackScreenHeader';

export type AppScreenShellProps = {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  keyboardAware?: boolean;
  removeClippedSubviews?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
  /** 为 false 时不渲染 StackScreenHeader（如全屏加载） */
  showHeader?: boolean;
} & Pick<
  StackScreenHeaderProps,
  | 'onBack'
  | 'leading'
  | 'title'
  | 'headerCenter'
  | 'headerRight'
  | 'backAccessibilityLabel'
  | 'backAccessibilityHint'
  | 'titleAccessibilityLabel'
  | 'titleColor'
  | 'titleFontSize'
  | 'titleFontFamily'
  | 'sideSlotWidth'
> & {
  headerStyle?: StyleProp<ViewStyle>;
};

export function AppScreenShell({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
  scrollable = false,
  keyboardAware = false,
  removeClippedSubviews = false,
  style,
  contentContainerStyle,
  footer,
  showHeader = true,
  headerStyle,
  onBack,
  leading,
  title,
  headerCenter,
  headerRight,
  backAccessibilityLabel,
  backAccessibilityHint,
  titleAccessibilityLabel,
  titleColor,
  titleFontSize,
  titleFontFamily,
  sideSlotWidth,
}: AppScreenShellProps) {
  const hasCustomCenter =
    headerCenter != null && headerCenter !== false;
  const hasHeader =
    showHeader &&
    Boolean(
      onBack ||
        (title && title.length > 0) ||
        headerRight != null ||
        hasCustomCenter,
    );

  return (
    <ScreenContainer
      edges={edges}
      scrollable={scrollable}
      keyboardAware={keyboardAware}
      removeClippedSubviews={removeClippedSubviews}
      style={style}
      contentContainerStyle={contentContainerStyle}
    >
      <View style={{ flex: 1 }}>
        {hasHeader ? (
          <StackScreenHeader
            onBack={onBack}
            leading={leading}
            title={title ?? ''}
            headerCenter={headerCenter}
            headerRight={headerRight}
            backAccessibilityLabel={backAccessibilityLabel}
            backAccessibilityHint={backAccessibilityHint}
            titleAccessibilityLabel={titleAccessibilityLabel}
            titleColor={titleColor}
            titleFontSize={titleFontSize}
            titleFontFamily={titleFontFamily}
            sideSlotWidth={sideSlotWidth}
            style={headerStyle}
          />
        ) : null}
        <View style={{ flex: 1 }}>{children}</View>
        {footer}
      </View>
    </ScreenContainer>
  );
}
