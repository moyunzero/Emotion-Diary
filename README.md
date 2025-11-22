# 情绪日记 (Emotion Diary)

一个基于React Native的情绪记录和管理应用，帮助你更好地理解和处理人际关系中的情绪波动。

## 功能特性

### 🌤️ 情绪气象站
- 可视化展示关系健康状态
- 基于情绪数据的智能天气预测
- 实时情绪指数监控

### 📝 情绪记录
- 5级情绪强度选择
- 详细的事件描述
- 涉事人员和触发因素标签
- 灵活的处理期限设置

### 📊 数据洞察
- 情绪分布图表
- 惹我生气排行榜
- 关系健康报告

### 🤖 AI工具箱
- 一键生成和解消息
- 换位思考建议
- 智能关系分析

### 🔥 气话焚烧
- 负面情绪宣泄功能
- 治愈系视觉效果

## 技术栈

- **框架**: React Native + Expo
- **路由**: Expo Router
- **状态管理**: React Context + AsyncStorage
- **UI组件**: 自定义组件
- **图标**: Lucide React Native
- **图表**: React Native Chart Kit
- **动画**: React Native Reanimated
- **AI集成**: Google Generative AI (Gemini)

## 开始使用

### 环境要求

- Node.js 18+
- Yarn
- Expo CLI

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn start
```

### 运行在设备上

```bash
# iOS
yarn ios

# Android
yarn android

# Web
yarn web
```

## 项目结构

```
├── app/                    # Expo Router页面
│   └── _layout.tsx         # 根布局
├── components/             # 组件
│   ├── Dashboard.tsx       # 仪表板页面
│   ├── Record.tsx          # 记录页面
│   ├── Insights.tsx        # 洞察页面
│   ├── Tools.tsx           # 工具页面
│   ├── Navigation.tsx       # 底部导航
│   ├── WeatherStation.tsx   # 气象站组件
│   ├── EntryCard.tsx       # 记录卡片
│   └── Fireplace.tsx      # 焚烧效果
├── context/                # 状态管理
│   └── AppContext.tsx
├── services/               # 服务
│   └── geminiService.ts    # AI服务
├── types.ts               # 类型定义
├── constants.ts           # 常量配置
└── assets/               # 资源文件
```

## 配置

### AI功能

要使用AI功能，需要配置Google Gemini API密钥：

1. 在项目根目录创建 `.env` 文件
2. 添加环境变量：`EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here`
3. 重启开发服务器

## 开发指南

### 添加新的情绪触发因素

在 `constants.ts` 中的 `TRIGGER_OPTIONS` 数组添加新选项。

### 自定义情绪配置

修改 `constants.ts` 中的 `MOOD_CONFIG` 对象来自定义情绪等级的显示。

### 样式主题

应用使用了粉红色系的主题色彩，主要颜色：
- 主色：#EF4444 (red-500)
- 背景色：#FFF5F5 (rose-50)
- 文字色：#1F2937 (gray-800)

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License
