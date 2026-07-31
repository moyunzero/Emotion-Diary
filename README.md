# 心晴MO

<div align="center">

<img src="./assets/images/app-icon.png" width="150" alt="心晴MO Logo" />

**一款治愈系情绪记录与管理应用**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.30-000)](https://expo.dev/)

[中文文档](./README.md) | [English](./README.en.md)

</div>

## 📲 欢迎从 App Store 下载

欢迎你在 **苹果 App Store（应用商店）** [**下载心晴MO**](https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686)，亦可在商店内搜索 **「心晴MO」**，在 iPhone 与 iPad 上随时记录情绪、照料你的心灵花园。若你希望参与开发或体验调试构建，可继续阅读下文「开发者快速上手」与「快速开始」。

## 📱 应用简介

心晴MO 是一款专注于情绪管理的治愈系应用。通过独特的「情绪气象站」和「心灵花园」概念，帮助用户记录、理解和管理自己的情绪，让每一次情绪的记录和解决都成为照料心灵花园的过程。

## 👩‍💻 开发者快速上手

### 克隆与安装

```bash
git clone <repository-url>
cd Emotion-Diary
```

（克隆后的文件夹名以远程仓库名为准；本仓库本地目录名为 `Emotion-Diary`。）

请使用 **Yarn** 与仓库根目录的 `yarn.lock`。本地开发执行 `yarn install`；对齐 CI 或提交 PR 前建议在干净环境中使用 `yarn install --frozen-lockfile`，与持续集成一致。

**默认分支：** `master`。

### 环境变量

复制 `.env.example` 为 `.env` 并按需填写（勿提交含真实密钥的 `.env`）。

### 最小校验集

```bash
yarn typecheck
yarn lint
yarn test              # Jest 单测（不含 e2e/）
```

### CI 行为摘要

- **Pull Request / push 到 `master`**：`yarn typecheck` → `yarn lint` → `yarn test`（Node 22，无模拟器）。
- **仅 push 到 `master`**：另跑 `yarn verify:governance` 与 `node scripts/verify-governance-smoke.js`。

**E2E（本地，未进 CI）**：

| 平台 | 命令 | 前置 |
| --- | --- | --- |
| Expo Web | `yarn test:e2e` | Playwright 会自动起 `expo start --web` |
| iOS/Android 原生 | `yarn test:maestro` | [Maestro CLI](https://maestro.mobile.dev)、`yarn start`、模拟器已 Boot、已 `yarn ios` 安装 dev build |

Maestro 诊断：`yarn test:maestro:preflight`。独立 flow：`yarn test:maestro:011` / `:012` / `:014` / `:015` / `:016` / `:017`。Flow 见 `e2e/`、`.maestro/`。详情见 [.planning/codebase/TESTING.md](./.planning/codebase/TESTING.md) §4。

### 文档与社区

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [.planning/README.md](./.planning/README.md)
- [.planning/codebase/ARCHITECTURE.md](./.planning/codebase/ARCHITECTURE.md)

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
- **周/月回顾与导出**：9:16 竖版分享卡（关系天气 + 心灵花园 + AI 结语），可保存到系统相册（路由：`review-export`）
- **周末周回顾触达**：花园页横幅一键生成上周回顾卡（默认周末提示）

### 🔥 气话焚烧与情绪释放档案

- 治愈系情绪释放功能，配合 **情绪释放档案** 回看释放记录与触发上下文
- 炫酷的 Skia 燃烧动画效果
- 让负面情绪随火焰消散

### 🤖 AI 智能助手

- **情绪预测**：基于历史数据预测未来7天情绪走势
- **情绪播客**：AI 生成个性化情绪疗愈播客内容
- **情绪处方**：针对触发器提供个性化建议和应对策略
- **智能分析**：深度分析情绪周期和触发因素
- **回顾图一句总结**：导出回顾图时可选 Groq 生成底部温柔一句；无 API Key 或网络/服务失败时使用本地兜底文案（调用 Groq 时需联网）

### ☁️ 数据同步

- **离线优先**：本地存储保护用户隐私
- **云端备份**：可选 Supabase 云端同步；删除默认为**软删除**（回收站可恢复），永久删除会从云端清除
- **智能数据迁移**：支持访客数据与登录用户数据无缝切换
- **隐私加固（v1.5）**：账号删除会清理云端语音文件；已同步音频以私密签名链接播放；会话安全存储失败时提示重新登录
- **同步体验（v1.5）**：日记修订识别更准确；待上传语音有限并发；个人中心同步状态与真实进度一致

### 🔔 回访与提醒（v1.4）

- **花园阶段回访语**：久未记录时，首页横幅按治愈进度（种子→开花）显示不同鼓励副句
- **本地提醒默认关**：每日记录与周末周回顾提醒可在个人中心配置；通知不含日记正文

### 🌍 双语界面（v1.3+）

- **简体中文 / English** 完整界面与文案
- **跟随系统**或**手动选择**语言（个人中心 → Language）
- 日期、相对时间、AI 输出、系统权限弹窗与回顾导出等按当前语言展示
- 切换语言后 AI 缓存与预测/播客内容自动按新语言刷新

## 🎨 设计亮点

- **粉色疗愈视觉（v1.4）**：全站统一 token 与组件样式，温暖一致
- **首次理解路径（v1.4）**：≤3 屏 intro 教用户读懂气象站 → 记一笔 → 花园隐喻链
- **治愈系配色**：粉绿渐变主题，温暖舒适
- **天气主题图标**：统一使用 Lucide 图标库，避免 emoji 兼容性问题
- **心灵花园隐喻**：将情绪管理转化为照料花园的过程
- **正向激励**：强调成长和治愈，而非问题和冲突
- **流畅动画**：React Native Reanimated 驱动的微交互
- **响应式设计**：适配各种屏幕尺寸

## 🚀 快速开始

克隆、`yarn install`、环境变量与提交前检查命令见上文 **[开发者快速上手](#-开发者快速上手)**。

### ⚡ 一分钟体验

```bash
# 启动开发服务器（需先完成上文安装步骤）
yarn start
```

### 📱 四种体验方式

1. **🍎 App Store（推荐用户）** - [**在 App Store 打开心晴MO**](https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686)（iPhone / iPad）；也可在 App Store 内搜索 **「心晴MO」**
2. **📲 Expo Go 预览** - 手机安装 [Expo Go](https://expo.dev/go)，扫描开发服务器二维码
3. **📲 APK 下载** - 从 Releases 页面下载预编译 APK（需要先配置 EAS Build）
4. **🌐 Web 版本** - 运行 `yarn web` 在浏览器中体验

### 🔒 安全性

本项目遵循严格的安全最佳实践：

- ✅ 所有敏感信息使用 EAS Secrets 管理
- ✅ `.gitignore` 配置完善，防止敏感文件泄露
- ✅ 环境变量模板化（`.env.example`）
- ✅ 定期安全审计和依赖更新

详细信息请查看 [SECURITY.md](./SECURITY.md)

### 配置与安全校验（脚本在 `package.json` 中注册）

```bash
yarn verify:env          # 环境变量与密钥泄露风险（见 scripts/verify-env-security.js）
yarn verify:all          # 聚合多项配置检查（图标、权限、EAS、隐私清单等）
yarn verify:governance   # 治理规则（与 CI push 到 master 一致）
```

具体检查项见各 `scripts/verify-*.js` 与 [SECURITY.md](./SECURITY.md)。

## 📦 发布与上架

#### 📚 提审资料（当前可直接使用）
- **中文描述**：[app-description-zh.md](./app-store-submission/metadata/app-description-zh.md)
- **英文描述**：[app-description-en.md](./app-store-submission/metadata/app-description-en.md)
- **截图指南**：[screenshot-guide.md](./app-store-submission/metadata/screenshot-guide.md)
- **Supabase 登录排查**：[supabase-login-checklist.md](./app-store-submission/supabase-login-checklist.md)
- **提交前检查清单**：[preflight-checklist.md](./app-store-submission/preflight-checklist.md)
- **隐私政策**：[PRIVACY.md](./PRIVACY.md)

#### 🛠️ 构建建议
```bash
# 构建前建议先跑校验（与上文「配置与安全校验」一致）
yarn verify:all

# iOS 生产构建
eas build --platform ios --profile production
```

## 🛠️ 技术栈

| 类别           | 技术选型                         | 版本              |
| -------------- | -------------------------------- | ----------------- |
| **框架**       | React Native + Expo              | 0.81.5 + ~54.0.30 |
| **UI 运行时**  | React                            | 19.1.0            |
| **路由**       | Expo Router                      | ~6.0.21           |
| **状态管理**   | Zustand                          | ^5.0.9            |
| **数据持久化** | AsyncStorage + Supabase          | -                 |
| **AI服务**     | Groq API（fetch）                | -                 |
| **UI组件**     | 自定义组件 + Lucide React Native | ^0.554.0          |
| **图形渲染**   | React Native Skia                | 2.2.12            |
| **动画**       | React Native Reanimated          | ~4.1.1            |
| **SVG支持**    | React Native SVG                 | 15.12.1           |
| **类型支持**   | TypeScript                       | ~5.9.2            |
| **国际化**     | i18next + react-i18next + expo-localization | ^26 / ^17 |
| **构建工具**   | EAS Build                        | -                 |

## 📁 项目结构

```
Emotion-Diary/
├── app/                         # Expo Router：文件即路由（页面仅此目录）
│   ├── _layout.tsx              # 根布局（字体、Store 初始化、Stack）
│   ├── profile.tsx              # 个人中心
│   ├── review-export.tsx        # 情绪回顾导出页
│   └── (tabs)/
│       ├── _layout.tsx          # 底部标签导航
│       ├── index.tsx            # 主页（Dashboard）
│       ├── record.tsx           # 记录页
│       └── insights.tsx         # 洞察页（心灵花园）
├── android/ ios/                # 原生工程（prebuild / EAS 生成，勿手改业务逻辑）
├── components/                  # 跨页面可复用 UI（含子目录）
│   ├── Dashboard.tsx Record.tsx Insights.tsx …
│   ├── EditEntryModal/ ReviewExport/ Insights/ entries/ ai/ …
│   └── …
├── features/                    # 按功能垂直拆分（例：profile/ 屏幕与逻辑）
├── store/
│   ├── useAppStore.ts           # Zustand 根组合
│   └── modules/                 # 分模块 slice（entries、user、ai …）
├── hooks/                       # 可复用 Hooks
├── lib/                         # 第三方客户端封装（如 Supabase）
├── services/                    # 领域服务（如陪伴天数计算）
├── utils/ shared/               # 工具函数与跨层共享（如格式化）
├── styles/                      # StyleSheet 工厂、主题相关样式
├── types/                       # 补充类型（components、colors …）
├── types.ts constants.ts        # 领域模型与根级常量（与 constants/ 并存）
├── constants/                   # 拆分的常量（如 colors）
├── i18n/ locales/               # 运行时 i18n 与 zh-Hans / en-US 文案包
├── assets/                      # 图片与静态资源
├── scripts/                     # 校验与治理脚本（verify-*）
├── .planning/                   # 唯一规划与工程文档根（GSD；见 .planning/README.md）
├── app-store-submission/        # 商店提审文案与清单
├── src/                         # 预留/实验性子域目录（多数为空；少量如 core-state）
├── app.json eas.json metro.config.js babel.config.js eslint.config.js
└── package.json tsconfig.json README.md
```

### 目录与 React Native / Expo 约定（摘要）

| 目录 | 说明 |
|------|------|
| `app/` | 符合 **Expo Router** 要求：仅此处定义路由页面。 |
| `android/` `ios/` | 标准 **预构建原生目录**；业务逻辑应放在 TS/TSX 共享层。 |
| `components/` `features/` | 常见 RN 分层：**展示组件**与**功能切片**分离。 |
| `store/` `hooks/` `services/` | 状态、副作用与领域服务分离，便于测试与边界（见 ESLint `boundaries`）。 |

更完整的 **SDK、Native 模块与 CI 命令锚点** 见 [.planning/codebase/ARCHITECTURE.md](./.planning/codebase/ARCHITECTURE.md) §6。

**说明：** `src/` 下部分子文件夹为占位结构，与主业务并置；新功能优先落在 `app/`、`components/`、`features/` 以免重复入口。

## 📚 GSD / `.planning` 规范驱动开发

本项目以 **GSD skills** + **`.planning/`** 作为唯一规划与工程文档根（Agent 流程见根目录 [`AGENTS.md`](./AGENTS.md)）。

### 文档入口

- **[`.planning/README.md`](./.planning/README.md)** — 文档索引
- **[工程 · 系统与集成](./.planning/codebase/ARCHITECTURE.md)** — 架构、目录树、技术栈、外部集成、同步要点
- **[工程 · 质量与体验](./.planning/codebase/TESTING.md)** — 代码约定、技术债与风险、UI 壳层、测试与 CI
- **[项目概览](./.planning/domain/project-overview.md)** / **[数据模型](./.planning/domain/data-models.md)** / **[状态管理](./.planning/domain/state-management.md)** / **[UI](./.planning/domain/ui-components.md)** / **[服务](./.planning/domain/services.md)** / **[工具](./.planning/domain/utils.md)**
- **历史 SSD 归档**：`.planning/archive/SSD-INDEX.md#`（001–015）
- **里程碑状态**：`.planning/PROJECT.md` · `STATE.md` · `ROADMAP.md` · `MILESTONES.md`

### 开发工作流程（摘要）

1. **进度** — `/gsd-progress`
2. **讨论 / 规划** — `/gsd-discuss-phase` → `/gsd-plan-phase`
3. **执行 / 验收** — `/gsd-execute-phase` → `/gsd-verify-work`
4. **合入** — `/gsd-ship`（或约定 PR 流程）

小改动用 `/gsd-quick` 或 `/gsd-fast`；新里程碑用 `/gsd-new-milestone`。

详细说明见 [`.planning/README.md`](./.planning/README.md) 与 [`AGENTS.md`](./AGENTS.md)。

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

- 编辑 `locales/zh-Hans/insights.json` 与 `locales/en-US/insights.json` 中的 `triggers.advice` / `triggers.adviceShort`
- 运行时通过 `i18n/resolvePresetLabel.ts` 的 `resolveTriggerAdvice` 解析

## 📋 版本历史

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。当前 App 版本见 `app.json` / `package.json`。

### [1.5.0] - 2026-07-31 · App Store 更新

> v1.5「CONCERNS 可清债务清零」（Phase 6–12）；面向用户的重点是账号隐私、云同步与稳定性。

#### 新增 / 加固

- **账号删除更彻底**：删除账号前清理云端 `audios/{userId}/` 语音对象，减少 Storage 残留
- **语音播放更安全**：已同步音频改为播放时签发的私密签名链接（非长期公开 URL）
- **会话失败可感知**：SecureStore 写入失败时提示重新登录，避免静默失效
- **修订同步**：日记显式 `updatedAt`，云端推送可跳过未变更行；待上传语音有限并发（上限 3）
- **个人中心同步状态**：与 store 真实 `syncStatus` / 进度单源一致

#### 修复

- 重命名语音后，首页日记卡片名称会正确刷新

#### 开发与质量

- 脆弱区单测：`recordingCoordinator` clipHandler、store sync 集成、Profile sync chrome；Jest 覆盖率下限
- 可维护性拆分：`store/sync/*`、`utils/ai/*`、ProfileSettings 分区、EntryCard playback/actions
- Maestro：`016`（签名音频播放）、`017`（编辑后回「记一笔」录音 rebind）；`yarn test:maestro:016` / `:017`
- CONCERNS 可清工程债归零；Accepted Product Risks 固化为永久政策（无 Sentry、E2E 不进 CI、cloud-wins、无根 `openspec/`）

### [1.4.0] - 2026-07-05 · App Store 更新

> v1.4「隐喻体验优先」五阶段（OpenSpec `011`–`015`）全部合入并上架。

#### 新增

- **粉色疗愈视觉（011）**：全站 token 与组件样式统一，Maestro 011 验收
- **首次理解路径（012）**：≤3 屏 intro（气象站 → 记一笔 → 花园）；首记 inline hint；Skip / 完成只展示一次
- **隐喻叙事（013）**：关系天气叙事引擎、花园成长里程碑、和解/焚烧仪式抛光
- **竖版周回顾卡（014）**：9:16 分享卡（关系天气 + 心灵花园 + AI 结语），iOS/Android 存相册、Web 下载
- **回访花园闭环（015）**：回访横幅按花园阶段副句；周末周回顾横幅桥接竖版卡；通知与 Profile 副文案焕新（中英）

#### 改进

- 记一笔「更多选项」等留存相关文案更简洁
- 双语切换后 onboarding / retention 文案即时更新

#### 开发与质量

- Maestro：`011` / `012` / `014` / `015` 验收 flow；`yarn test:maestro:015` 等独立命令
- 单测：`resolveRevisitSubtitleKey`、`retentionCopy`、双语 smoke 扩展

### [1.3.0] - 2026-06-19 · App Store 更新

#### 新增

- **完整双语**：简体中文与 English 界面；个人中心可「跟随系统」或手动切换
- **本地化体验**：记录、气象站、心灵花园、回顾导出、同步提示、回收站、留存提醒、登录注册等全流程文案 i18n
- **iOS 原生权限弹窗**：麦克风、相册等系统对话框支持中英（`locales/native/` + `expo.locales`）
- **语言感知 AI**：预测、播客、处方与回顾图结语按当前语言生成；切换语言后清空相关缓存

#### 改进

- 日期与「X 分钟前」等相对时间按语言格式化
- 陪伴天数里程碑、触发器标签与建议等不再混入硬编码中文
- 英文复数语法（voice notes / days ago 等）与无障碍文案优化

#### 开发与质量

- i18n 文案门控与双语 smoke 单测（`__tests__/unit/i18n/`）
- E2E 回收站流程改用 testID，减少对固定中文文案的依赖

### [1.2.0] - 2026-06-13 · App Store 提审

#### 新增

- 回收站：删除改为移至回收站，可恢复或永久删除
- 情绪提醒与回访触达（默认关闭，可在个人中心配置）

#### 改进

- 云端同步：「备份到云端」与「从云端合并」分流，确认文案更清晰
- 音频：上传失败指数退避重试，条目内可手动重试
- 性能：大列表筛选分桶、Insights 重模块延迟挂载
- 界面：个人中心与回收站统一分组卡片样式

#### 开发与质量

- 同步 / 合并 / 软删回归单测（OpenSpec `003`–`010`）
- Expo Web Playwright、iOS Maestro 回收站 E2E（本地，未进 CI）

### [1.1.0] - 2026-04-20

- ✅ 天气主题图标系统（替代 emoji）
- ✅ 心灵花园洞察页面（全新设计）
- ✅ 优化的记录页面文案
- ✅ 治愈进度环形图
- ✅ 关系花盆可视化
- ✅ 情绪触发洞察与园艺建议
- ✅ 语音录制功能（支持录制、播放语音日记）

### [1.0.0]

- ✅ 基础情绪记录功能
- ✅ 情绪气象站可视化
- ✅ 数据洞察分析
- ✅ 气话焚烧功能
- ✅ Android/iOS 应用打包

### 产品开发路线

权威路线图：[`.planning/archive/iteration-roadmap-2026.md`](./.planning/archive/iteration-roadmap-2026.md)

#### 已交付里程碑

| 版本 | 主题 | 文档 | 状态 |
| --- | --- | --- | --- |
| **1.2.0** | 工程健康 + 数据信任 + 留存触达 | `archive/SSD-INDEX.md#003`–`010` | ✅ App Store |
| **1.3.0** | 完整双语 i18n | `.planning/phases/01-i18n` … `07-*` | ✅ App Store |
| **1.4.0** | 隐喻体验优先 | Phase 1–5（011–015） | ✅ App Store |
| **1.5.0** | 隐私 / 同步 / 可清债清零 | Phase 6–12；`milestones/v1.5.0-*` | ✅ App Store / Tag `v1.5.0` |

#### v1.5 Phase 明细（均已合入 `master`）

| Phase | 目录 | 交付 |
| --- | --- | --- |
| 6 | `phases/06-dead-code-naming` | 死代码 / ProfileSyncChrome / logger / Accepted 政策 |
| 7 | `phases/07-security-account` | delete-account Storage wipe、signed URL、SecureStore UX |
| 8 | `phases/08-sync-performance` | updatedAt、push skip、音频并发、Profile chrome 单源 |
| 9 | `phases/09-fragility-tests` | clipHandler / store sync / coverage floor |
| 10 | `phases/10-maintainability-splits` | store/sync、aiService、ProfileSettings、EntryCard 拆分 |
| 11 | `phases/11-documentation-closeout` | CONCERNS 可清债归零 |
| 12 | `phases/12-milestone-closeout-hygiene` | UAT、Nyquist、Maestro 017、staging Storage |

#### v1.4 Phase 明细（均已合入 `master`）

| Phase | 目录 / 归档 | 交付 |
| --- | --- | --- |
| 1 | `archive/SSD-INDEX.md#011-metaphor-activation` | 粉色疗愈 token 全站迁移 |
| 2 | `phases/02-onboarding-metaphor` | ≤3 屏隐喻 intro + 首记 hint |
| 3 | `phases/03-metaphor-narrative` | 天气叙事、花园里程碑、仪式抛光 |
| 4 | `phases/04-shareable-ritual-cards` | 竖版周回顾分享卡 + 存相册 |
| 5 | `phases/05-retention-garden-loop` | 回访/周回顾与花园隐喻联动 |

#### v2 候选（未排期 · Defer）

- 关系时间线、On This Day、Year-in-pixels 关系天气图、桌面 Widget

#### 明确不做

- 对话式 AI 教练、情侣/双人共写、健康数据关联、主题皮肤定制、第三方崩溃监控（Sentry）

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

**🌱 感谢使用心晴MO，愿你的心灵花园繁花似锦！**

Made with ❤️ by Your Team

[🔝 回到顶部](#心晴mo)

</div>
