# UI 一致性修复实施计划

- [ ] 1. 修复 WeatherStation 响应式问题
  - [ ] 1.1 将 WeatherStation 组件接入 useResponsiveStyles hook
    - 修改 `components/WeatherStation.tsx`
    - 添加 `useResponsiveStyles` 导入和使用
    - 将 `marginHorizontal: 16` 改为 `marginHorizontal: spacing.cardGap`
    - 将 `padding: 20` 改为 `padding: padding.card`
    - 将 `borderRadius: 16` 改为 `borderRadius: borderRadius.card`
    - 引用 requirements.md 需求 3

  - [ ] 1.2 响应式化 WeatherStation 主图标尺寸
    - 将硬编码 `size={48}` 改为响应式计算 `size={iconSize}`
    - 使用 `layout.maxContentWidth` 计算图标尺寸
    - 引用 requirements.md 需求 3

  - [ ] 1.3 响应式化 WeatherStation 预测卡片
    - 将 `borderRadius: 16` 改为 `borderRadius: borderRadius.large`
    - 将内边距改为使用 spacing 变量
    - 引用 requirements.md 需求 5

- [ ] 2. 统一 EntryCard 图标使用 AppIcon
  - [ ] 2.1 修改 EntryCard.tsx 导入方式
    - 移除直接导入的 lucide-react-native 图标
    - 添加 `import AppIcon from "./icons/AppIcon"`
    - 保留必要的 lucide icon 导入用于操作按钮
    - 引用 requirements.md 需求 1

  - [ ] 2.2 统一 EntryCard 操作按钮图标尺寸
    - 将所有操作按钮图标（Edit, Trash2, CheckCircle）尺寸统一为 20
    - 将 Flame 焚烧图标尺寸统一为 20（当前 22）
    - 引用 requirements.md 需求 2

  - [ ] 2.3 统一 EntryCard 语音标签图标
    - 将 Mic 图标尺寸从 12 改为 16
    - 引用 requirements.md 需求 2

- [ ] 3. 统一 Dashboard 图标使用 AppIcon
  - [ ] 3.1 修改 Dashboard.tsx 导入方式
    - 移除 `import { Filter, PenLine } from "lucide-react-native"`
    - 使用 AppIcon 替代 Filter 和 PenLine
    - 引用 requirements.md 需求 1

  - [ ] 3.2 统一 Dashboard 筛选按钮图标尺寸
    - Filter 图标使用 18px（与现有 filterButton padding 匹配）
    - 引用 requirements.md 需求 2

- [ ] 4. 修复 Insights 组件响应式问题
  - [ ] 4.1 修复 RelationshipGarden 花盆尺寸硬编码
    - 将 `width: 56, height: 56` 改为响应式计算
    - 使用 `layout.gridItemWidth * 0.4` 动态计算
    - 将 `borderRadius: 28` 改为响应式值
    - 引用 requirements.md 需求 4

  - [ ] 4.2 修复 WeeklyMoodWeather 卡片内边距
    - 将 `paddingHorizontal: 2` 改为 `paddingHorizontal: spacing.xs`
    - 将 `borderRadius: 12` 改为 `borderRadius: borderRadius.card`
    - 引用 requirements.md 需求 4, 5

  - [ ] 4.3 修复 HealingProgress 环形进度条尺寸
    - 将硬编码 `size = 120` 改为响应式计算
    - 使用 `layout.maxContentWidth` 动态调整大小
    - 引用 requirements.md 需求 4

- [ ] 5. 统一 Profile 相关组件图标
  - [ ] 5.1 修改 ProfileSettingsSection.tsx 导入
    - 将 CloudUpload, CloudDownload, LogOut, UserIcon, UserX, X 改为 AppIcon
    - 统一图标尺寸为 20px
    - 引用 requirements.md 需求 1, 2

  - [ ] 5.2 修改 ProfileMenuItem.tsx 图标尺寸
    - 确保菜单图标统一使用 20px
    - 引用 requirements.md 需求 2

  - [ ] 5.3 修改 ProfileUserCard.tsx 导入
    - 将 Camera 改为 AppIcon
    - 引用 requirements.md 需求 1

- [ ] 6. 统一其他组件图标
  - [ ] 6.1 修改 Record.tsx 导入
    - 将 Sparkles 改为 AppIcon
    - 引用 requirements.md 需求 1

  - [ ] 6.2 修改 WeatherStation.tsx 图标导入
    - 将所有 lucide 图标改为 AppIcon
    - Sun, Cloud, CloudRain, CloudSnow, TrendingUp, AlertTriangle, ChevronDown, ChevronUp
    - 统一图标尺寸 24-48px
    - 引用 requirements.md 需求 1, 2

  - [ ] 6.3 修改 Insights/*.tsx 所有组件
    - RelationshipGarden: Droplets, Flower2, Leaf, Sprout
    - WeeklyMoodWeather: Sun
    - HealingProgress: Heart, Flower2, Sparkles, Sprout
    - TriggerInsight: Leaf, Sparkles, Sprout
    - EmotionReleaseArchive: Flame, NotebookPen, Wind
    - GardenHeader: Flower2
    - EmptyGarden: Flower2, Heart, Leaf, Sparkles, Sprout
    - 所有标题图标统一 20px
    - 引用 requirements.md 需求 1, 2

- [ ] 7. 修复 Record.styles.ts 响应式问题
  - [ ] 7.1 audioSection 样式响应式化
    - 将硬编码间距值改为使用 DESIGN_TOKENS.spacing
    - 引用 requirements.md 需求 5

- [ ] 8. 检查点 - 代码质量验证
  - [ ] 8.1 运行 TypeScript 类型检查
    - 执行 `yarn typecheck`
    - 确保无新增类型错误
    - 引用所有需求

  - [ ] 8.2 运行 ESLint 检查
    - 执行 `yarn lint`
    - 确保无新增 lint 错误
    - 引用所有需求

- [ ] 9. 可选：AppIcon 组件增强
  - [ ] 9.1 导出图标尺寸预设常量
    - 在 AppIcon.tsx 中导出 ICON_SIZES 常量
    - 包含 operation(20), header(24), tag(16) 等预设
    - 提供给其他组件使用
    - 引用 requirements.md 需求 2
