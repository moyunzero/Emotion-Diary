# AGENTS.md - 心晴MO开发指南

## 开发环境

```bash
yarn install          # 安装依赖
yarn start           # 启动开发服务器
yarn ios             # iOS模拟器
yarn android         # Android模拟器
yarn web             # Web预览
```

## 代码质量检查

```bash
yarn lint            # ESLint
yarn typecheck       # TypeScript
yarn test:ci         # Jest（覆盖率门槛80%）
yarn verify:governance  # 治理规则校验
```

**CI流程（PR和push到master）**：
```
typecheck -> lint -> test:ci
```
**额外（仅push到master）**：
```
verify:governance -> verify-governance-smoke.js
```

## 项目架构

```
app/              # Expo Router页面（文件即路由）
components/       # 通用组件（含子目录：EditEntryModal/ReviewExport/Insights/entries/ai等）
features/         # 功能模块（如profile/）
store/            # Zustand状态管理
store/modules/    # 模块化slice（entries/user/weather/ai/storage）
hooks/            # 自定义Hooks
utils/            # 工具函数
services/         # 业务服务
shared/           # 跨层共享
constants/        # 常量
types.ts          # 领域模型
```

## 关键类型

```typescript
// 情绪条目（MoodEntry）定义在 types.ts
interface MoodEntry {
  id: string;
  timestamp: number;
  moodLevel: MoodLevel;
  content: string;
  deadline: string;
  people: string[];
  triggers: string[];
  status: Status;
  // ...
}
```

## Store模式

使用Zustand模块化设计，`store/modules/*.ts`定义各模块接口和实现，`store/useAppStore.ts`组合。

## 音频功能

使用`expo-av`处理录音和播放。已配置`expo-media-library`。

## Git规范

- **默认分支**: master
- **新分支命名**: `YYMMDD-(feat|fix|chore|refactor)-描述`
- **不要在master分支直接操作**
- `.monkeycode/specs/`用于存放功能规范文档（可提交）
- `docs/`和`openspec/`在gitignore中

## 重要约束

- TypeScript严格模式
- 覆盖率门槛80%
- 离线优先+云端同步
- 使用Groq API做AI功能
- 使用Supabase做云端存储
