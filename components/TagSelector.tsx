import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DESIGN_TOKENS } from "../constants/colors";
import { useThemeStyles } from "../hooks/useThemeStyles";
import AddTagInput from "./AddTagInput";
import { AppChip } from "./ui/AppChip";

interface TagSelectorProps {
  title: string;
  options: string[];
  selected: string[];
  customOptions: string[];
  onToggle: (item: string) => void;
  onAdd: (value: string) => void;
  onDelete: (value: string) => void;
  prefix?: string; // 用于触发器标签的 '#' 前缀
  /** 是否作为表单最后一节，为 true 时去掉底部外边距，由上层操作栏统一控制间距 */
  isLastSection?: boolean;
  getLabel?: (item: string) => string;
}

/**
 * 标签选择器组件
 * 统一处理人物标签和触发器标签的选择、添加、删除逻辑
 */
const TagSelector: React.FC<TagSelectorProps> = ({
  title,
  options,
  selected,
  customOptions,
  onToggle,
  onAdd,
  onDelete,
  prefix = "",
  isLastSection = false,
  getLabel = (item) => item,
}) => {
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: DESIGN_TOKENS.spacing.xxxl,
        },
        sectionLast: {
          marginBottom: 0,
        },
        sectionTitle: {
          fontSize: DESIGN_TOKENS.fontSize.sm,
          fontWeight: "bold",
          color: colors.text.tertiary,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        tagsContainer: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: DESIGN_TOKENS.spacing.sm,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.section, isLastSection && styles.sectionLast]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tagsContainer}>
        {options.map((item) => {
          const isSelected = selected?.includes(item) ?? false;
          const isCustom = customOptions?.includes(item) ?? false;
          const label = `${prefix}${getLabel(item)}`;
          return (
            <AppChip
              key={item}
              label={label}
              selected={isSelected}
              onPress={() => onToggle(item)}
              onDelete={isCustom ? () => onDelete(item) : undefined}
            />
          );
        })}
        <AddTagInput onAdd={onAdd} />
      </View>
    </View>
  );
};

export default React.memo(TagSelector);
