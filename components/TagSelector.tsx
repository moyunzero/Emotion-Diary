import { X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../constants/colors";
import AddTagInput from "./AddTagInput";

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
}) => {
  return (
    <View style={[styles.section, isLastSection && styles.sectionLast]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tagsContainer}>
        {options.map((item) => {
          const isSelected = selected?.includes(item) ?? false;
          const isCustom = customOptions?.includes(item) ?? false;
          return (
            <View
              key={item}
              style={[styles.tag, isSelected && styles.tagSelected]}
            >
              <TouchableOpacity
                onPress={() => onToggle(item)}
                style={styles.tagMain}
              >
                <Text
                  style={[styles.tagText, isSelected && styles.tagTextSelected]}
                >
                  {prefix}
                  {item}
                </Text>
              </TouchableOpacity>
              {isCustom && (
                <TouchableOpacity
                  onPress={() => onDelete(item)}
                  style={styles.tagDelete}
                >
                  <X size={12} color={COLORS.gray[500]} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <AddTagInput onAdd={onAdd} />
      </View>
    </View>
  );
};

/** 「和谁有关？」「因为什么？」等区块的样式在此配置 */
const styles = StyleSheet.create({
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xxxl,
  },
  sectionLast: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: DESIGN_TOKENS.fontSize.sm,
    fontWeight: "bold",
    color: COLORS.text.tertiary,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.background.primary,
    overflow: "hidden",
  },
  tagSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  tagMain: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  tagText: {
    fontSize: DESIGN_TOKENS.fontSize.sm,
    fontWeight: "bold",
    color: COLORS.text.tertiary,
  },
  tagTextSelected: {
    color: COLORS.error,
  },
  tagDelete: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    opacity: 0.6,
  },
});

export default React.memo(TagSelector);
