# 心晴MO - 项目文档索引

**情绪气象站** - 一个帮助用户记录、理解和改善情绪的移动应用

## 文档结构

```
.monkeycode/docs/
├── INDEX.md                    # 本文档 - 项目概览
├── ARCHITECTURE.md             # 系统架构文档
├── INTERFACES.md               # 接口与类型定义
├── DEVELOPER_GUIDE.md          # 开发者指南
├── 架构设计/
│   └── [待填充]
├── 接口文档/
│   └── [待填充]
├── 核心概念/
│   ├── 情绪条目管理.md
│   ├── 音频系统.md
│   ├── 状态管理.md
│   ├── 云端同步.md
│   └── AI功能.md
└── 模块/
    ├── store.md
    ├── components.md
    └── services.md
```

## 项目概述

### 基本信息

| 项目 | 内容 |
|------|------|
| **名称** | 心晴MO (Emotion Diary) |
| **类型** | React Native (Expo) 移动应用 |
| **版本** | 1.0.0 |
| **主入口** | expo-router |
| **状态管理** | Zustand |
| **后端服务** | Supabase (Auth + Database + Storage) |

### 核心功能

1. **情绪日记记录** - 记录情绪、触发因素、相关人物
2. **音频附件** - 支持语音录制作为日记附件
3. **天气状态** - 基于情绪数据计算"情绪天气"
4. **AI 情绪分析** - 情绪预测和智能播客生成
5. **数据同步** - 本地优先 + 云端同步
6. **情绪回顾导出** - 生成美观的情绪回顾卡片

### 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Expo SDK 54 + React Native 0.81 |
| **路由** | expo-router |
| **状态管理** | Zustand (模块化设计) |
| **后端** | Supabase |
| **存储** | expo-media-library, expo-file-system |
| **音频** | expo-audio |
| **AI** | Groq API |
| **测试** | Jest + fast-check |
| **代码质量** | ESLint, TypeScript, knip |

## 目录结构

```
workspace/
├── app/                    # Expo Router 页面 (文件即路由)
│   ├── _layout.tsx         # 根布局
│   ├── (tabs)/             # Tab 导航组
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # 首页 (Dashboard)
│   │   ├── record.tsx      # 记录页
│   │   └── insights.tsx    # 洞察页
│   ├── profile.tsx         # 个人页
│   └── review-export.tsx   # 回顾导出页
│
├── components/             # 通用组件
│   ├── AudioRecorder/      # 录音组件
│   ├── EditEntryModal/     # 编辑条目弹窗
│   ├── EntryCard.tsx       # 条目卡片
│   ├── Dashboard.tsx       # 首页仪表盘
│   ├── Insights/           # 洞察组件
│   ├── Profile/            # 个人中心组件
│   ├── ReviewExport/       # 回顾导出组件
│   ├── WeatherStation.tsx  # 天气站组件
│   └── ai/                 # AI 相关组件
│
├── features/               # 功能模块
│   └── profile/            # 个人中心功能
│
├── store/                  # Zustand 状态管理
│   ├── useAppStore.ts      # 根 store
│   └── modules/            # 模块化 slice
│       ├── ai.ts
│       ├── audio.ts
│       ├── entries.ts
│       ├── storage.ts
│       ├── types.ts
│       ├── user.ts
│       └── weather.ts
│
├── services/               # 业务服务
│   ├── audioSync.ts         # 音频云端同步
│   └── companionDaysService.ts
│
├── hooks/                  # 自定义 Hooks
├── utils/                  # 工具函数
├── shared/                 # 跨层共享代码
├── types.ts               # 领域模型定义
├── constants.ts           # 应用常量
└── lib/supabase.ts        # Supabase 客户端
```

## 快速链接

- [架构设计](./ARCHITECTURE.md)
- [接口文档](./INTERFACES.md)
- [开发者指南](./DEVELOPER_GUIDE.md)
- [核心概念](./核心概念/)
- [模块文档](./模块/)

---

*最后更新: 2026-04-20*
