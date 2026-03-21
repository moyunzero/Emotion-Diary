# Architecture Patterns: v1.1 工程重构与代码治理

**Domain:** Expo React Native 情绪记录应用（增量重构）  
**Researched:** 2026-03-21  
**Milestone Context:** 现有应用已在线路上，目标是治理与可维护性提升，不做 big-bang rewrite。  
**Overall confidence:** HIGH（基于仓内现状与里程碑约束）

## Recommended Architecture

本轮推荐采用 **“外层按 feature 分区 + 内层保留现有稳定实现”** 的双层渐进架构：

1. **路由层保持 `app/` 不动**，仅把重页面逻辑下沉到 feature 模块（避免路由迁移回归）。
2. **状态层保留一个 `useAppStore` 门面**，将大块逻辑拆为 slice（entries/auth/sync/ai/weather），避免一次性替换调用方。
3. **共享能力统一到 `shared`（或 `utils` 的治理子目录）**，优先收敛重复的时间、错误、格式化与校验逻辑。
4. **测试结构与代码结构同构**，按 feature 建测试，保留少量跨模块集成测试，减少“改一个文件炸全仓”。

这套方案核心是：**先建立边界，再迁移实现**。业务行为不变，导入路径与职责逐步收敛。

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `app/*` 路由壳层 | 路由声明、页面挂载、参数注入 | `features/*/screens` |
| `features/profile` | 个人页 UI、登录/注册弹窗、资料编辑交互 | `store/index`、`shared/*` |
| `features/entries` | 心事记录列表、编辑流程、派生统计读模型 | `store/index`、`shared/date` |
| `features/insights` | 洞察卡片、趋势与触发器展示 | `store/index`、`shared/format` |
| `store/index.ts`（门面） | 对外暴露 Zustand store 与 selector | `store/slices/*` |
| `store/slices/*` | 领域状态与 action（auth/entries/sync...） | `lib/supabase`、`shared/*` |
| `shared/*`（原 `utils` 收敛区） | 纯函数、校验、错误映射、时间处理、类型适配 | 被 features/store 双向复用 |
| `lib/*` | 第三方 SDK 封装（Supabase 等） | `store/slices/*` |

## Integration Points（治理变更如何接入现有架构）

### 1) Feature-based split（按功能拆分）

- **接入点（现有）**：`app/profile.tsx`（超大页面，含 UI + 认证 + 同步状态 + 弹窗逻辑）。
- **策略**：先抽“页面内模块”，再抽“feature 目录”，最后壳层回写。
- **建议拆分结果**：
  - 新建 `features/profile/screens/ProfileScreen.tsx`（承接原页面主体）
  - 新建 `features/profile/components/*`（LoginModal/EditProfileModal/SyncStatus）
  - `app/profile.tsx` 缩为 5-20 行路由壳，仅 `export { default } from ".../ProfileScreen"`。

### 2) Zustand slices（状态切片化）

- **接入点（现有）**：`store/useAppStore.ts` 已有 `modules/*`，但账号、同步、firstEntryDate、初始化与监听仍集中。
- **策略**：保留 `useAppStore` 对外 API，不破调用方；内部改为 slice 组合。
- **建议切片**：
  - `authSlice`：`login/register/logout/deleteAccount/updateUser`
  - `entriesSlice`：本地加载/保存、增删改查、firstEntryDate 管理
  - `syncSlice`：`syncToCloud/syncFromCloud/recoverFromCloud` 与并发控制
  - `weatherSlice`：天气派生
  - `aiSlice`：AI 文案能力
- **兼容策略**：第一阶段保留原 action 名称，后续再引导到 selector hooks。

### 3) Shared utilities consolidation（共享工具收敛）

- **接入点（现有）**：`utils/avatarPresets.ts`、`utils/dateUtils.ts`、`utils/errorHandler.ts` 已有雏形，但页面内仍存在重复格式化/校验逻辑（如 profile 中邮箱密码校验、时间展示）。
- **策略**：建立“单一来源”并反向替换页面内重复实现。
- **建议新增/归并**：
  - `shared/validation/auth.ts`：邮箱/密码/确认密码规则
  - `shared/format/time.ts`：`formatLastSyncTime` 等展示格式
  - `shared/errors/messages.ts`：错误码到用户文案映射
  - 保留 `utils/*` 兼容导出一段时间（避免全仓同时改 import）。

### 4) Test structure normalization（测试结构规范化）

- **接入点（现有）**：已有 Jest 与覆盖率门槛，但测试层级可能与代码边界不同步。
- **策略**：测试目录映射 feature/store/shared 三层，删除示例与重复测试，保关键路径。
- **建议结构**：
  - `tests/features/profile/*.test.tsx`：登录/切换模式/同步入口行为
  - `tests/store/slices/*.test.ts`：auth/sync/entries 的状态迁移与错误分支
  - `tests/shared/*.test.ts`：纯函数（日期、校验、错误映射）
  - `tests/integration/*.test.ts`：游客->登录迁移、云端同步冲突合并

## New vs Modified Modules（显式清单）

| Type | Path | Purpose | Notes |
|------|------|---------|-------|
| **New** | `features/profile/screens/ProfileScreen.tsx` | 承接原 `app/profile.tsx` 主体 | 先搬运不改逻辑 |
| **New** | `features/profile/components/LoginModal.tsx` | 账号弹窗独立化 | 便于单测与复用 |
| **New** | `features/profile/components/EditProfileModal.tsx` | 资料编辑弹窗独立化 | 降低页面复杂度 |
| **New** | `store/slices/authSlice.ts` | 账号与会话动作 | 从大 store 剥离 |
| **New** | `store/slices/syncSlice.ts` | 云同步流程与并发控制 | 保留原 action 名 |
| **New** | `store/slices/entriesSlice.ts` | 本地条目与首日逻辑 | 与 storage 交互集中 |
| **New** | `shared/validation/auth.ts` | 登录/注册校验规则统一 | 替换页面内重复逻辑 |
| **New** | `shared/format/time.ts` | 时间展示统一 | 含 lastSyncTime 文案 |
| **Modified** | `app/profile.tsx` | 变为 route shell | 不再承载业务细节 |
| **Modified** | `store/useAppStore.ts` | 由“巨型实现”转为“slice 组合门面” | 对外 API 尽量不变 |
| **Modified** | `store/modules/*` | 逐步迁移或转调用 slice | 避免一次删光 |
| **Modified** | `utils/*` | 兼容导出到 `shared/*` | 设置迁移窗口 |
| **Modified** | `tests/**` | 跟随新边界重排与去冗余 | 先保关键路径 |

## Dependency-safe Build Order（现实可执行顺序）

1. **Step 0: 基线锁定**
   - 补齐关键路径集成测试（登录、同步、游客迁移），确保后续重构有护栏。
2. **Step 1: 抽 shared 纯函数（低风险）**
   - 新增 `shared/validation`、`shared/format`，从 `profile` 页面先替换调用。
3. **Step 2: Profile 页面“组件内拆”**
   - 在同文件夹先拆 `LoginModal/EditProfileModal`，行为不变，减少单文件复杂度。
4. **Step 3: 路由壳化 + feature 落位**
   - 新建 `features/profile`，把页面与组件移动；`app/profile.tsx` 改为壳层转发。
5. **Step 4: Store 内部切片化**
   - 先做 `authSlice`、`syncSlice`，保持外部 action 名兼容；再迁移 `entries`/`firstEntryDate`。
6. **Step 5: 测试重排与清理**
   - 删除示例/重复测试，把 case 归并到 feature/store/shared；保留最少集成回归集。
7. **Step 6: 清理迁移别名**
   - 当 import 全量切换后，再收紧 `utils` 兼容导出，完成治理收口。

该顺序保证每一步都可独立合并与回滚，不依赖“大分支一次落地”。

## Patterns to Follow

### Pattern 1: Route Shell + Feature Screen
**What:** 路由文件只做导出，业务在 feature screen。  
**When:** `app/*.tsx` 超过 200 行或混合多弹窗/多状态。  
**Example:**
```typescript
// app/profile.tsx
export { default } from "../features/profile/screens/ProfileScreen";
```

### Pattern 2: Stable Store API, Internal Slice Refactor
**What:** 外部 selector/action 名称稳定，内部替换为 slice 组合。  
**When:** 现有页面大量直接依赖 `useAppStore`，不适合同时改调用点。  
**Example:**
```typescript
// store/useAppStore.ts
export const useAppStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createEntriesSlice(...a),
  ...createSyncSlice(...a),
}));
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: 先搬目录再改逻辑（双重风险）
**Why bad:** 回归定位困难，问题来源不清。  
**Instead:** 先“逻辑不变抽取”，再“路径迁移”。

### Anti-Pattern 2: 一次性重命名所有 store action
**Why bad:** 页面/组件联动改动面过大，CI 与人工验证成本飙升。  
**Instead:** 保持兼容 action，分阶段引入新 selector。

### Anti-Pattern 3: 只删测试不补护栏
**Why bad:** 短期通过，长期引入隐性回归。  
**Instead:** 先补关键路径，再清理低价值测试。

## Architecture-specific Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `syncToCloud/syncFromCloud` 并发锁迁移不当 | 数据覆盖或状态错乱 | 先保留现有锁语义，再重构实现 |
| `firstEntryDate` 多源合并遗漏 | 陪伴天数回退 | 为游客/登录切换建立集成测试 |
| 弹窗拆分后 Android 关闭行为变化 | 登录弹窗闪退/反复弹出 | 保留 `isSwitchingModeRef` 机制并补端侧回归 |
| shared 收敛后 import 混乱 | 编译失败与循环依赖 | 迁移期保留兼容出口，逐步替换 |

## Roadmap Integration Notes

- 这是 **“治理型里程碑”**，优先输出应是边界清晰与可持续迭代能力，而非新功能。
- 下游实施时可按 PR 波次对应 build order（每步独立验证），满足“integration points explicit / new vs modified explicit / build order realistic”质量门槛。
- 若需要再细化，可在执行阶段给每个步骤补充“受影响文件清单 + 回归用例清单”。
