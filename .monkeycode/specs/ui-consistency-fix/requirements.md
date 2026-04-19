# UI 一致性修复需求文档

## 引言

本次需求旨在修复项目中响应式布局和图标统一性问题，提升应用在 2026 年 UI 设计标准下的视觉一致性和用户体验。

## 词汇表

- **AppIcon**: 统一的图标封装组件，基于 lucide-react-native，提供一致的接口和 fallback 处理
- **Design Tokens**: 设计变量系统，统一管理间距、圆角、字体大小、阴影等
- **响应式设计**: 根据屏幕尺寸动态调整布局的设计方法
- **lucide-react-native**: 项目使用的图标库

## 需求

### 需求 1: 统一图标使用规范

**用户故事:** 作为用户，我希望应用中的图标风格保持一致，以便获得更专业的视觉体验。

#### Acceptance Criteria

1. WHEN 用户在应用任意页面看到图标，THEN 所有图标通过 AppIcon 组件渲染
2. WHEN 图标尺寸被指定，THEN 使用规范中的标准尺寸（16/20/24/32px）
3. WHEN 图标颜色被指定，THEN 使用语义化颜色或 AppIcon 默认色

### 需求 2: 统一图标尺寸规范

**用户故事:** 作为用户，我希望图标的视觉大小保持一致，不会出现大小不一导致的混乱感。

#### Acceptance Criteria

1. WHEN 应用渲染操作按钮图标，THEN 所有操作按钮图标使用 20px 尺寸
2. WHEN 应用渲染头部标题图标，THEN 使用 24px 尺寸
3. WHEN 应用渲染卡片头部图标，THEN 使用 20px 尺寸
4. WHEN 应用渲染标签图标（如 Mic tag），THEN 使用 16px 尺寸（不再使用 12px）

### 需求 3: 修复 WeatherStation 响应式问题

**用户故事:** 作为用户，我希望在手机和平电脑上都能获得良好的使用体验。

#### Acceptance Criteria

1. WHEN WeatherStation 在不同屏幕尺寸下渲染，THEN 使用 createResponsiveMetrics 计算内边距
2. WHEN WeatherStation 渲染主图标，THEN 根据屏幕尺寸使用 40-56px 的响应式尺寸
3. WHEN WeatherStation 渲染卡片容器，THEN 使用响应式圆角和间距

### 需求 4: 统一 Insights 组件响应式

**用户故事:** 作为用户，我希望 Insights 页面在不同设备上看起来都很好。

#### Acceptance Criteria

1. WHEN RelationshipGarden 渲染花盆图标，THEN 使用响应式尺寸而非硬编码 56px
2. WHEN WeeklyMoodWeather 渲染星期卡片，THEN 使用响应式内边距而非硬编码 2px
3. WHEN HealingProgress 渲染环形进度条，THEN 根据屏幕尺寸调整尺寸

### 需求 5: 统一圆角和间距规范

**用户故事:** 作为用户，我希望应用的整体视觉风格统一协调。

#### Acceptance Criteria

1. WHEN 任意组件渲染卡片容器，THEN 使用 DESIGN_TOKENS.borderRadius 而非硬编码值
2. WHEN 任意组件渲染内边距，THEN 使用 DESIGN_TOKENS.spacing 而非硬编码值
3. WHEN Dashboard 渲染筛选按钮，THEN 使用与 Profile 卡片一致的圆角规范

### 需求 6: 统一 strokeWidth 规范

**用户故事:** 作为用户，我希望图标线条粗细一致，不会出现有些图标线条粗有些细的情况。

#### Acceptance Criteria

1. WHEN AppIcon 渲染图标且未指定 strokeWidth，THEN 使用默认值 2
2. WHEN AppIcon 渲染图标且指定了 strokeWidth，THEN 使用指定值
3. WHEN 迁移现有图标到 AppIcon，THEN 保持原有的 strokeWidth 行为
