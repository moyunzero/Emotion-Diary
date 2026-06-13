# AGENTS.md - 心晴MO开发指南

## Agent 执行基线（必循）

- **Karpathy 行为准则**：编写、审查或重构代码时须遵循 [`.cursor/rules/karpathy-guidelines.mdc`](./.cursor/rules/karpathy-guidelines.mdc)——先澄清假设与取舍、最小必要改动、手术式编辑（不顺带「美化」无关代码）、可验证的成功标准（改完跑 `typecheck` / `lint` 等）。该规则在 Cursor 中为 **alwaysApply**，与本文件及 OpenSpec 约定叠加生效，冲突时以更严、更贴近用户明确需求者为准。

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
yarn verify:governance  # 治理规则校验
```

**CI流程（PR和push到master）**：

```text
typecheck -> lint -> test
```

**额外（仅push到master）**：

```text
verify:governance -> verify-governance-smoke.js
```

（`yarn test` 为 Jest/ts-jest 纯 Node 单测，与 `.github/workflows/ci.yml` 中 Node 22 一致。）

**E2E（本地，未进 CI）**：Web 回收站主路径 `yarn test:e2e`（Playwright）；iOS/Android 原生全链路 `yarn test:maestro`（需 [Maestro CLI](https://maestro.mobile.dev) + 模拟器已安装 dev build）。Flow 见 `e2e/`、`.maestro/`。

**日志**：新代码优先 `utils/logger`；信息级勿在生产刷屏（`__DEV__` 或 `logger`）。详见 [`openspec/engineering-quality.md`](./openspec/engineering-quality.md) 摘要与 `utils/logger.ts` 中 `persistLog` 说明。

## 项目架构

```text
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

**条目与同步（简）**：新建 `id` 为 UUID v4（`generateEntryId`）；用户删除为**软删**（`deletedAt`，仍留在 `entries`）；上云列 `deletedat`；`syncFromCloud` / `recoverFromCloud` 合并时**同 id 以云端行为准**。详情见 `openspec/state-management.md`、`openspec/changes/002-entry-backup-soft-delete/SPEC.md`。

## 音频功能

使用 `expo-audio` 处理录音和播放（已从旧版 `expo-av` 迁移）。已配置 `expo-media-library`。播放为**单一实例**：业务侧调用 `shared/audio/coordinator.ts`，经 `store` 的 `pauseAudio` / `stopAudio` 与 UI 状态对齐；勿再向 store 增加「只改 isPlaying、不驱动原生」的半截 API。

## Git规范

- **默认分支**: master
- **新分支命名**: `YYMMDD-(feat|fix|chore|refactor)-描述`
- **不要在master分支直接操作**
- **`openspec/`**：OpenSpec 领域规范 + SSD 任务目录（`changes/`、`templates/`），**应提交到版本库**；详见 `openspec/README.md`
- **`docs/`** 在 gitignore 中（本地补充文档不入库）

## OpenSpec / SSD 规范同步开发

- 开发前先读 **`openspec/README.md`**，再按需打开 **`openspec/engineering-system.md`**（栈、目录、集成）或 **`openspec/engineering-quality.md`**（约定、风险、UI 壳层、测试）
- 新功能、重要修复、跨模块重构先在 **`openspec/changes/<编号>-<名称>/`** 建立 `SPEC.md`（可从 `openspec/templates/` 拷贝）；复杂任务补 `PLAN.md` 和 `VERIFICATION.md`
- **`.planning/`** 为本地规划目录（默认 **gitignore**，不上传 GitHub）；SSD 任务与工程正文以 **`openspec/`**（`changes/`、`engineering-system.md`、`engineering-quality.md`）为准
- 大批次合入前对照：**[`openspec/changes/WORKTREE-2026-06.md`](./openspec/changes/WORKTREE-2026-06.md)**（003–010 代码入口、E2E、验证命令）
- 改代码后同步更新受影响文档；新风险写入 **`openspec/engineering-quality.md`** §2，新约定写入同文件 §1（或 §4 若属测试/CI）
- 最终回复必须说明改动依据、验证结果、未验证项或剩余风险

## 重要约束

- TypeScript严格模式
- 离线优先+云端同步
- 使用Groq API做AI功能
- 使用Supabase做云端存储
- **无用代码及时清理**：替换实现或合并功能后，删除未被引用的 action、类型、导出与分支；提交前全仓库搜索旧符号确认无残留，并跑通 `yarn typecheck`（及受影响路径的 `yarn lint` / 测试）。避免「半套旧 API + 半套新路径」长期并存误导后续开发。

## Agent 协作（变更收尾）

- 每次改代码若产生孤儿（本次改动引入的未使用 import/变量/方法），**在同一批提交内删掉**。
- 跨文件契约变更（如播放从 store 直设改为 coordinator）时，同步删类型与实现，并在 `openspec/engineering-quality.md` 等有约定处按需补一句（重大行为再写 `changes/`）。
