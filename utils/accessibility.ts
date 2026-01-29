/**
 * 可访问性工具函数
 * 用于生成无障碍属性，提升应用的可访问性
 */

export interface AccessibilityProps {
  accessibilityRole?: 'button' | 'text' | 'header' | 'link' | 'image' | 'none' | 'tab' | 'tablist';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    text?: string;
    min?: number;
    max?: number;
    now?: number;
  };
}

/**
 * 创建无障碍属性
 * @param role - 元素角色
 * @param label - 标签（必需）
 * @param hint - 提示（可选）
 * @param state - 状态（可选）
 * @param value - 值（可选）
 */
export const createAccessibilityProps = (
  role: AccessibilityProps['accessibilityRole'],
  label: string,
  hint?: string,
  state?: AccessibilityProps['accessibilityState'],
  value?: AccessibilityProps['accessibilityValue']
): AccessibilityProps => ({
  accessibilityRole: role,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: state,
  accessibilityValue: value,
});

/**
 * 按钮无障碍属性
 */
export const buttonAccessibility = (label: string, hint?: string, disabled?: boolean) =>
  createAccessibilityProps('button', label, hint, { disabled });

/**
 * 文本无障碍属性
 */
export const textAccessibility = (label: string) =>
  createAccessibilityProps('text', label);

/**
 * 标题无障碍属性
 */
export const headerAccessibility = (label: string) =>
  createAccessibilityProps('header', label);

/**
 * 图片无障碍属性
 */
export const imageAccessibility = (label: string, hint?: string) =>
  createAccessibilityProps('image', label, hint);

/**
 * 链接无障碍属性
 */
export const linkAccessibility = (label: string, hint?: string) =>
  createAccessibilityProps('link', label, hint);
