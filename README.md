# 情绪日记 (Emotion Diary)

<div align="center">

![Emotion Diary Logo](./assets/images/icon.png)

**一款治愈系情绪记录与管理应用**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.30-000)](https://expo.dev/)

[中文文档](./README.md) | [English](./README.en.md)

</div>

## 📱 应用简介

情绪日记是一款专注于情绪管理的治愈系应用。通过独特的「情绪气象站」和「心灵花园」概念，帮助用户记录、理解和管理自己的情绪，让每一次情绪的记录和解决都成为照料心灵花园的过程。

## 🌟 核心功能

### 🌤️ 情绪气象站

- 创新的天气隐喻可视化关系健康状态
- 用天气图标（雨滴、云朵、雷电等）表达情绪强度
- 实时显示当前"关系天气"和情绪指数

### ✍️ 智能记录

- **5级情绪强度**：从"有点委屈"到"情绪爆发"
- **天气主题图标**：使用 Droplet、Cloud、CloudRain、CloudLightning、Zap 等图标
- **多维度标签系统**：支持人物标签和情绪触发器标签，可自定义标签
- **灵活的期限设置**：今天谈、本周内、本月内、以后说、自己消化
- **自动草稿保存**：编辑过程自动保存草稿，意外退出也不会丢失
- **编辑历史记录**：完整记录每次修改，可查看情绪变化轨迹
- **温暖的文案引导**：降低记录门槛，让用户更愿意表达

### 🌱 心灵花园（洞察页面）

全新设计的洞察页面，用植物生长隐喻展示情绪管理进度：

- **本周情绪天气**：7天情绪状态一目了然，每天显示天气图标和花朵状态
- **治愈进度**：环形进度条展示情绪解决率，从种子到开花的成长阶段
- **关系花盆**：每个人对应一个花盆，显示关系健康度（繁花盛开/正常生长/需要浇水）
- **情绪触发洞察**：分析 Top 3 情绪触发器，配合温暖的"园艺建议"
- **底部鼓励语**：动态生成的正向反馈，让用户感受到成长

### 🔥 气话焚烧

- 治愈系情绪释放功能
- 炫酷的 Skia 燃烧动画效果
- 让负面情绪随火焰消散

### 🤖 AI 智能助手

- **情绪预测**：基于历史数据预测未来7天情绪走势
- **情绪播客**：AI 生成个性化情绪疗愈播客内容
- **情绪处方**：针对触发器提供个性化建议和应对策略
- **智能分析**：深度分析情绪周期和触发因素
- 使用 Groq API，支持离线使用（无API Key时显示默认内容）

### ☁️ 数据同步

- **离线优先**：本地存储保护用户隐私
- **云端备份**：可选 Supabase 云端同步，数据安全无忧
- **智能数据迁移**：支持访客数据与登录用户数据无缝切换

## 🎨 设计亮点

- **治愈系配色**：粉绿渐变主题，温暖舒适
- **天气主题图标**：统一使用 Lucide 图标库，避免 emoji 兼容性问题
- **心灵花园隐喻**：将情绪管理转化为照料花园的过程
- **正向激励**：强调成长和治愈，而非问题和冲突
- **流畅动画**：React Native Reanimated 驱动的微交互
- **响应式设计**：适配各种屏幕尺寸

## 🚀 快速开始

### ⚡ 一分钟体验

```bash
# 克隆项目
git clone <repository-url>
cd emotion-diary

# 安装依赖
yarn install

# 启动开发服务器
yarn start
```

### 📱 三种体验方式

1. **📲 Expo Go预览** - 手机安装[Expo Go](https://expo.dev/go)，扫描开发服务器二维码
2. **📲 APK下载** - 从 Releases 页面下载预编译APK（需要先配置 EAS Build）
3. **🌐 Web版本** - 运行 `yarn web` 在浏览器中体验

### 📦 发布与上架

- **上架前必读**：[上架检查清单](./docs/release-checklist.md) — EAS Secrets、构建命令、商店后台配置与发布前自检。
- **包体积优化**：[iOS 包体积优化指南](./docs/ios-bundle-size.md) — 减小商店下载体积、静态资源压缩与发布前检查。

## 🛠️ 技术栈

| 类别           | 技术选型                         | 版本              |
| -------------- | -------------------------------- | ----------------- |
| **框架**       | React Native + Expo              | 0.81.5 + ~54.0.30 |
| **路由**       | Expo Router                      | ~6.0.21           |
| **状态管理**   | Zustand                          | ^5.0.9            |
| **数据持久化** | AsyncStorage + Supabase          | -                 |
| **AI服务**     | Groq API（fetch）                | -                 |
| **UI组件**     | 自定义组件 + Lucide React Native | ^0.554.0          |
| **图形渲染**   | React Native Skia                | 2.2.12            |
| **动画**       | React Native Reanimated          | ~4.1.1            |
| **SVG支持**    | React Native SVG                 | 15.12.1           |
| **类型支持**   | TypeScript                       | ~5.9.2            |
| **构建工具**   | EAS Build                        | -                 |

## 📁 项目结构

```
emotion-diary/
├── app/                    # Expo Router页面
│   ├── _layout.tsx         # 根布局配置
│   ├── profile.tsx         # 个人中心页面
│   └── (tabs)/             # 标签页路由组
│       ├── _layout.tsx     # 标签导航布局
│       ├── index.tsx       # 主页面 (Dashboard)
│       ├── record.tsx      # 记录页面
│       └── insights.tsx    # 洞察页面（心灵花园）
├── components/             # 可复用UI组件
│   ├── Dashboard.tsx       # 主页面组件
│   ├── Record.tsx          # 记录页面组件（天气图标选择器）
│   ├── Insights.tsx        # 洞察页面组件（心灵花园主题）
│   ├── WeatherStation.tsx  # 情绪气象站组件
│   ├── EntryCard.tsx       # 情绪记录卡片（含气话焚烧动画）
│   ├── EditEntryModal.tsx  # 编辑记录模态框
│   ├── Toast.tsx           # Toast提示组件
│   └── ai/                 # AI功能组件
│       └── EmotionPodcast.tsx  # AI情绪播客组件
├── store/                  # 状态管理（Zustand）
│   └── useAppStore.ts      # 全局状态Store
├── lib/                    # 工具库
│   └── supabase.ts         # Supabase客户端配置
├── utils/                  # 工具函数
│   ├── dateUtils.ts        # 日期处理工具
│   ├── aiService.ts        # AI服务（Groq API集成）
│   ├── moodIconUtils.tsx   # 情绪图标工具
│   └── draftManager.ts     # 草稿管理工具
├── hooks/                  # 自定义Hooks
│   └── useHapticFeedback.ts # 震动反馈Hook
├── assets/                 # 资源文件
│   └── images/             # 图片资源
├── openspec/               # OpenSpec规范文档
│   ├── README.md           # OpenSpec使用指南
│   ├── project-overview.md # 项目概览规范
│   ├── data-models.md      # 数据模型规范
│   ├── state-management.md # 状态管理规范
│   ├── ui-components.md    # UI组件规范
│   ├── services.md         # 服务层规范
│   ├── utils.md            # 工具函数规范
│   └── development-workflow.md # 开发工作流文档
├── types.ts               # TypeScript类型定义
├── constants.ts           # 应用常量配置（情绪图标映射）
├── app.json               # Expo应用配置
├── eas.json               # EAS构建配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目文档
```

## 📚 OpenSpec 规范驱动开发

本项目使用 **OpenSpec**（规范驱动开发工具）进行开发管理，确保代码质量和一致性。

### 什么是 OpenSpec？

OpenSpec 是一个规范驱动开发（Spec-driven Development，SDD）工具，通过在编写代码之前锁定意图，确保人类和 AI 在项目需求上达成一致，从而实现可预测和可审查的输出。

### 规范文档

所有规范文档位于 `openspec/` 目录下：

- **[README.md](./openspec/README.md)** - OpenSpec 使用指南
- **[项目概览规范](./openspec/project-overview.md)** - 项目目标、技术栈、架构概览
- **[数据模型规范](./openspec/data-models.md)** - 数据结构定义和业务规则
- **[状态管理规范](./openspec/state-management.md)** - Zustand Store 接口和方法
- **[UI组件规范](./openspec/ui-components.md)** - 组件功能和交互逻辑
- **[服务层规范](./openspec/services.md)** - AI 服务和 Supabase 服务
- **[工具函数规范](./openspec/utils.md)** - 工具函数 API 和使用说明
- **[开发工作流文档](./openspec/development-workflow.md)** - 开发流程和最佳实践

### 开发工作流程

1. **提案（Proposal）** - 创建变更提案，描述所需的规范更新
2. **审查（Review）** - 与 AI 助手一起审查和完善提案
3. **实施（Implementation）** - 根据批准的规范实施任务
4. **归档（Archive）** - 将完成的变更归档，并更新规范文档

### 使用规范进行开发

- **查看规范**：在开始新功能开发前，先查看相关的规范文档
- **修改规范**：当需要添加新功能或修改现有功能时，先更新相应的规范文档
- **代码审查**：使用规范文档作为代码审查的标准
- **AI 协作**：与 AI 工具协作时，引用规范文档确保理解和实现的一致性

详细说明请参考 [OpenSpec 使用指南](./openspec/README.md) 和 [开发工作流文档](./openspec/development-workflow.md)。

## 🔧 开发配置

### 开发环境设置

#### 1. 安装依赖

```bash
yarn install
```

#### 2. 配置 Supabase（可选，用于云端同步功能）

如果需要使用云端同步功能，需要配置 Supabase：

1. **创建 Supabase 项目**
   - 访问 [Supabase](https://supabase.com) 创建新项目
   - 获取项目 URL 和匿名密钥（anon key）

2. **配置环境变量**
   - 在项目根目录创建 `.env` 文件（如果不存在）
   - 添加以下配置：

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **初始化数据库**
   - 在 Supabase SQL Editor 中执行以下脚本（按顺序）：
     - `supabase/create_entries_table.sql` - 创建 entries 表
     - `supabase/rls_policies.sql` - 配置行级安全策略
   - 可选：执行 `supabase/diagnose_entries.sql` 进行诊断

> 💡 **提示**：如果不配置 Supabase，应用仍可正常使用，但云端同步功能将不可用。所有数据将仅存储在本地。

#### 3. 启动开发服务器

```bash
# 启动开发服务器
yarn start

# 运行在模拟器/真机
yarn ios        # iOS模拟器
yarn android    # Android模拟器
yarn web        # Web浏览器

# 代码检查
yarn lint

# 重置项目
yarn reset-project
```

## 📱 应用打包指南

### 🤖 Android应用打包

#### 方法一：EAS云端构建（推荐）

**优势：** 无需本地Android开发环境，自动处理签名，支持多种设备配置

**1. 安装EAS CLI**

```bash
npm install -g eas-cli
```

**2. 配置EAS项目**

```bash
eas build:configure
```

**3. 构建APK文件**

```bash
# 构建测试版本（推荐首次使用）
eas build --platform android --profile preview

# 构建生产版本（用于发布）
eas build --platform android --profile production
```

**4. 获取APK文件**

构建完成后（约5-10分钟）：

- 📧 **邮件通知** - 会收到构建完成的邮件，包含下载链接
- 🌐 **EAS控制台** - 访问 [expo.dev](https://expo.dev) 下载APK文件
- 📱 **二维码安装** - 构建结果中包含二维码，可直接扫码安装

### 🍎 iOS应用打包

#### EAS云端构建（推荐）

**优势：** 无需Mac电脑，无需Apple Developer账号（测试版）

```bash
# 构建测试版本
eas build --platform ios --profile preview

# 构建生产版本（需要Apple Developer账号）
eas build --platform ios --profile production
```

## 🐛 常见问题

### 开发相关问题

**Q: 如何自定义主题色彩？**

- 修改 `constants.ts` 中的颜色配置
- 修改 `components/Insights.tsx` 中的 `COLORS` 常量
- 更新各组件中的样式定义

**Q: 如何添加新的情绪类型？**

- 在 `types.ts` 的 `MoodLevel` 枚举中添加新类型
- 在 `constants.ts` 的 `MOOD_CONFIG` 中添加新配置（包括 iconName 和 iconColor）
- 在 `Record.tsx` 和 `EntryCard.tsx` 的 `getMoodIcon` 函数中添加新图标映射

**Q: 如何修改园艺建议文案？**

- 修改 `components/Insights.tsx` 中的 `TRIGGER_ADVICE` 对象
- 可以为新的触发器添加对应的建议文案

## 📋 版本历史

### v1.1.0 (当前版本)

- ✅ 天气主题图标系统（替代 emoji）
- ✅ 心灵花园洞察页面（全新设计）
- ✅ 优化的记录页面文案
- ✅ 治愈进度环形图
- ✅ 关系花盆可视化
- ✅ 情绪触发洞察与园艺建议

### v1.0.0

- ✅ 基础情绪记录功能
- ✅ 情绪气象站可视化
- ✅ 数据洞察分析
- ✅ 气话焚烧功能
- ✅ Android/iOS应用打包

### 未来计划

- 📊 更多数据分析维度
- 🎨 主题定制系统
- 🌍 多语言支持
- 🔔 情绪提醒功能

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork项目** - 点击右上角Fork按钮
2. **创建功能分支** - `git checkout -b feature/amazing-feature`
3. **提交更改** - `git commit -m 'Add amazing feature'`
4. **推送分支** - `git push origin feature/amazing-feature`
5. **创建Pull Request** - 提交PR并详细描述更改

### 开发规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint代码规范
- 添加必要的注释和文档
- 确保所有功能正常工作后再提交
- 保持代码风格一致

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系我们

- 🐛 **问题反馈**：请在项目仓库中创建 Issue
- 💬 **讨论**：欢迎在项目仓库中发起讨论
- ⭐ **支持**：如果这个项目对你有帮助，请给个Star支持我们！

---

<div align="center">

**🌱 感谢使用情绪日记，愿你的心灵花园繁花似锦！**

Made with ❤️ by Your Team

[🔝 回到顶部](#情绪日记-emotion-diary)

</div>
