# Phase 8: 大文件拆分与结构重构 - Research

**Researched:** 2026-03-22  
**Domain:** Expo Router 壳层、Zustand 模块化/slices、React Native 大组件拆分  
**Confidence:** HIGH（代码与官方 Zustand v5 文档已交叉核对；部分实施细节为 MEDIUM）

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 执行顺序固定为：先 profile 壳层 → 再 store slice → 最后 500+ 组件（风险递进）。
- **D-02:** 每批粒度：profile 单独 1 批、store 单独 1 批、500+ 组件每 1 个 1 批（约 3–4 小包）。
- **D-03:** 若某批发现阻塞（如循环依赖）：先解决阻塞再继续，不跳过或转做其他目标。
- **D-04:** Phase 8 内 500+ 组件只拆 1 个（EditEntryModal），其余留给 Phase 9/10。
- **D-05:** feature 根目录为 `features/profile/`，与 Phase 9 目录边界一致。
- **D-06:** `app/profile.tsx` 壳层仅保留路由注册 + 一层 layout 容器，其它全部移到 feature 模块。
- **D-07:** profile 子区块按 UI 区块划分：`ProfileHeader`、`ProfileSettings`、`ProfileStats` 等。
- **D-08:** profile 专用 hooks 落位 `features/profile/hooks/` 或 `hooks/profile/`。
- **D-09:** slice 按功能域划分：entries、sync、settings、ui 等。
- **D-10:** 对外 API 保持 `useAppStore.getState()` 和现有 selector 用法不变，内部改为组合各 slice。
- **D-11:** Zustand slice 合并方式由 planner 根据 Zustand 最佳实践决定。
- **D-12:** 首批只做 1 个 slice 跑通（如 entries），再扩展。
- **D-13:** Phase 8 内首个拆分的 500+ 组件为 EditEntryModal（约 595 行）。
- **D-14:** 目录落位：保留 `components/EditEntryModal/` 作为主入口，内部拆成 `EditEntryModal.tsx`（壳）+ `EditEntryForm.tsx`、`EditEntryFields.tsx` 等。
- **D-15:** 拆分粒度：视图 / 逻辑 / 纯函数 分离（表单 UI、校验/提交逻辑、日期/格式工具）。
- **D-16:** 调用方逐步改为 `import { EditEntryModal } from '@/components/entries'` 等新路径，不强制本阶段全部迁移。

### Claude's Discretion

- profile 具体子区块命名与文件划分细节由 planner 按现有代码结构决定。
- store slice 的初始 state 与 action 命名由 planner 按 Zustand 惯例决定。
- EditEntryModal 内部子组件命名（EditEntryForm、EditEntryFields 等）为示例，planner 可按实际逻辑调整。

### Deferred Ideas (OUT OF SCOPE)

- EntryCard、Dashboard 等其它 500+ 组件拆分 — 留给 Phase 9/10。
- import 路径全面迁移到 `@/components/entries` — 本阶段仅逐步引导，不强制。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARC-01 | `app/profile.tsx` 拆分为路由壳层 + feature 模块，降低单文件复杂度且不改变用户可见行为 | 现状 1448 行单文件；已用 `components/Profile` 子组件与 `Profile.styles`；壳层化路径见下文「profile features/ 目录草案」 |
| ARC-02 | `store/useAppStore.ts` 完成 slice 化（至少首批 entries），对外 API 保持兼容 | 已有 `createEntriesModule` + spread，但 `_loadEntries`/`_saveEntries` 仍在主文件；建议首批将 entries 相关持久化并入 entries slice 并采用 Zustand v5 官方 `StateCreator` 切片类型 |
| ARC-03 | 500+ 行核心组件按职责拆分（视图、逻辑、纯函数）并通过回归验证 | `components/EditEntryModal.tsx` 约 595 行，单文件；需目录化 + 壳/表单/纯函数边界见下文 |
</phase_requirements>

## Summary

Phase 8 目标是在**不扩展产品功能**前提下，降低 `app/profile.tsx`（约 1448 行）、`store/useAppStore.ts`（约 1350 行）与 `EditEntryModal`（约 595 行）的单文件复杂度。抽样显示：`profile` 已在用 `ProfileHeader`、`ProfileUserCard`、`ProfileStatCard` 等，但**业务状态、登录/注册/编辑资料 Modal、同步 UI 与 handler 仍全部堆在路由文件**；`useAppStore` 已通过 `createEntriesModule` 等工厂合并，但 **`store/modules/entries.ts` 中 `_loadEntries`/`_saveEntries` 为空实现，真实逻辑仍在 `useAppStore.ts`**，与「entries 域完整闭环」不一致；`EditEntryModal` 仍为**单文件**，仅将 `toggleSelection` 提到模块级，表单、标签、自定义选项与提交混杂在同一组件内。

**Primary recommendation:** 严格按 D-01 顺序交付三个小包；store 首批以 **entries 切片** 为目标：用 Zustand 官方 slices 模式（`StateCreator<AppState, [], [], EntriesModule>` + `create()((...a) => ({ ...createEntriesSlice(...a), ... }))`）收拢 `_loadEntries`/`_saveEntries` 与 entries CRUD 同源；profile 新建 `features/profile/` 并把 Modal 与局部 state 下沉；EditEntryModal 改为目录入口，按视图 / 提交与校验 / 纯函数 拆文件，默认导出路径保持兼容直至 D-16 逐步迁移。

---

## 现状结构摘要

### `app/profile.tsx`

- **规模：** 约 1448 行（含大块 `StyleSheet`）。
- **依赖：** `useAppStore` 多 selector（`user`、`entries`、`weather`、`login`、`logout`、`deleteAccount`、`updateUser`、`syncToCloud`、`register`、`recoverFromCloud`）；`components/Profile` 展示组件；`CompanionDaysCard` / `CompanionDaysModal`；本地大量 `useState`（登录/注册/编辑资料/同步进度/Toast/键盘等）与 handler（`handleAuthSubmit`、`handleSaveProfile`、同步流程等）。
- **主渲染结构（抽样）：** `ScreenContainer` → `ProfileHeader` → `ProfileUserCard` → 统计区（`ProfileStatCard` + `CompanionDaysCard`）→ `ProfileSectionHeader` + 菜单项（同步、恢复、注销等）→ 多个 `Modal`（登录/注册、编辑资料）→ `CompanionDaysModal` → `Toast`。
- **与 ARC-01 差距：** 路由文件仍承担「页面布局 + 认证表单 + 同步交互 + 样式定义」，需下沉到 `features/profile/` 子模块，壳层仅保留 `export default`、最外层 layout 与必要 providers/容器。

### `store/useAppStore.ts` + `store/modules/entries.ts`

- **已有模式：** `create<AppStore>((set, get) => { const entriesModule = createEntriesModule(...); return { ...entriesModule, ...weatherModule, ...aiModule, ... } })`，注释称「模块化架构」。
- **entries 相关缺口：** `createEntriesModule` 内 `addEntry`/`updateEntry`/`deleteEntry` 等已实现，但 **`_loadEntries` / `_saveEntries` 为占位**；**真实加载/防抖保存**在 `useAppStore.ts` 内覆盖同名方法（抽样见 `_loadEntries` 使用 `migrateFromLegacyStorage`、`loadFromStorage`、`set({ entries })`；`_saveEntries` 使用模块级 `saveEntriesTimeoutRef` 防抖写 AsyncStorage）。
- **与 ARC-02 对齐方式：** 「首批 entries slice」的实质工作是：**把主文件中的 entries 持久化与 entries 数组强相关逻辑收拢到单一 `createEntriesSlice`（或扩写现有 module）**，并采用官方推荐的 **交叉 slice 类型**（`StateCreator<AppState, [], [], EntriesModule>`），保证 `get()` 仍能调用 `user`/`_calculateWeather` 等同 store 其它部分（与 Context7 中 Bear/Fish/Shared 示例一致）。

### `components/EditEntryModal.tsx`

- **规模：** 约 595 行；**当前为单文件**（非 `EditEntryModal/` 目录，与 D-14「保留目录为主入口」相比需先建目录并移动入口）。
- **结构抽样：** `EditEntryModalProps`；主组件内 `useAppStore` 的 `updateEntry`、`useHapticFeedback`、大量 `useState`（mood、content、deadline、人/触发器、自定义标签）；`useEffect` 同步 `entry` → 表单；`handleSubmit`（校验 + `updateEntry` + 延迟 `onClose`）；标签切换与 `customTagsManager`；底部约 200+ 行 `StyleSheet`。
- **调用方：** `EntryCard.tsx` 等 `import EditEntryModal from "./EditEntryModal"`（D-16：本阶段可不强制改路径）。

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | **^5.0.9**（项目）；registry **5.0.12**（2026-03-22 `npm view`） | 全局 store + slices 组合 | 官方 v5 文档明确 slices：`create()((...a) => ({ ...sliceA(...a), ... }))` + `StateCreator` 交叉类型（[Zustand advanced-typescript / slices-pattern v5.0.12](https://github.com/pmndrs/zustand/blob/v5.0.12/docs/learn/guides/advanced-typescript.md)） |
| expo-router | ~6.0.21 | `app/profile.tsx` 路由入口 | 壳层应保持单文件入口约定 |
| @react-native-async-storage/async-storage | ^2.2.0 | entries 本地持久化 | 与现有 `store/modules/storage` 一致 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React 19 / RN 0.81 | 见 package.json | Modal、表单 | 拆分组件时保持 hooks 规则与 memo 边界 |

**Version verification:**

```bash
npm view zustand version
# 2026-03-22 → 5.0.12
```

**Installation：** 本 phase 通常无需新增依赖；若引入路径别名 barrel，仅需 tsconfig/babel 已有配置确认。

---

## Zustand slice 合并策略建议（与 D-11 一致）

**结论（HIGH）：** 采用 Zustand v5 **Slices Pattern**：每个域一个 `StateCreator<AppState, [], [], SliceType>`，在 `create<AppStore>()((...args) => ({ ...createEntriesSlice(...args), ... }))` 中 **对象展开合并**；跨 slice 调用通过 `get()` 访问（与官方文档一致）。

**首批仅 entries（D-12）建议动作：**

1. **将 `_loadEntries`、`_saveEntries` 从 `useAppStore.ts` 迁入 `store/modules/entries.ts`（或新建 `store/slices/entriesSlice.ts` 再由 module  re-export）**，并实现为真实逻辑；删除主文件中重复定义，避免 spread 覆盖顺序导致「以为在 module 里、实际跑主文件」的双实现风险。
2. **模块级防抖定时器**（`saveEntriesTimeoutRef`）：若随 `_saveEntries` 迁入 entries 文件，保持**单例模块变量**语义与现有一致，避免多实例 store（当前单例无妨）。
3. **类型：** 将 `createEntriesModule` 重命名为 `createEntriesSlice`（可选），并把返回类型显式标为 `StateCreator<AppState, [], [], EntriesModule>`，与 `AppStore` 交叉引用时减少 `get()` 的 any/缺失字段问题。
4. **暂不强制** middleware（immer、devtools）—— D-10 要求对外 API 不变，避免行为漂移。

**与现状关系：** 当前已是「多模块 object spread」，差距在于 **entries 域分裂在主文件与 module 两处**；首批 slice 化的验收标准是 **entries 数组的读写路径（含持久化）在代码组织上单一职责、类型上符合官方 Slice 范式**。

**Anti-patterns：**

- **不要在多个文件中定义同名 store 键** 再依赖 spread 顺序覆盖 — 难以 code review，易漏改。
- **避免** 为拆 slice 改变 `useAppStore((s) => s.entries)` 等 selector 形状（违反 D-10）。

---

## Architecture Patterns

### 推荐：`features/profile/` 与路由壳层

**What：** `app/profile.tsx` 仅导出默认 Screen，内部一行或少量行组合 `features/profile/ProfileScreen.tsx`（或 `ProfileLayout` + 子区块）。

**When：** ARC-01 第一批完成后，路由文件行数应**显著下降**（样式可迁到 `features/profile/styles` 或复用现有 `styles/components/Profile.styles.ts`）。

### Pattern：Zustand 官方 combine slices（摘录）

```typescript
// Source: https://github.com/pmndrs/zustand/blob/v5.0.12/docs/learn/guides/advanced-typescript.md
import { create, StateCreator } from 'zustand'

const useBoundStore = create<BearSlice & FishSlice & SharedSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
  ...createSharedSlice(...a),
}))
```

本项目对应为：`createEntriesSlice`、`createWeatherSlice` 等逐步引入，**Phase 8 仅要求 entries 首批完整**。

---

## profile `features/` 目录草案（D-05～D-08）

> `features/` 目录当前不存在；以下为与 CONTEXT 一致的草案，具体文件名可按 discretion 微调。

```
features/profile/
├── ProfileScreen.tsx           # 原 ProfileScreen 主体（或拆分后的组装层）
├── components/
│   ├── ProfileStatsSection.tsx # 统计区：ProfileStatCard + CompanionDaysCard
│   ├── ProfileDataSection.tsx  # 「数据与安全」+ 同步状态行 + 菜单项
│   ├── LoginRegisterModal.tsx  # 登录/注册 Modal（可选再拆表单）
│   └── EditProfileModal.tsx    # 编辑资料 Modal
├── hooks/
│   ├── useProfileAuthForms.ts  # 邮箱/密码/校验/error state（可选）
│   └── useProfileSyncUi.ts     # syncStatus / progress / 防抖 ref（可选）
└── index.ts                    # 可选：export { ProfileScreen }
```

**`app/profile.tsx` 壳层保留示例：**

```tsx
import { ProfileScreen } from '@/features/profile/ProfileScreen';
export default function ProfileRoute() {
  return <ProfileScreen />;
}
```

（路径别名以项目 `tsconfig` 为准；若尚无 `@/features`，可用相对路径首批落地再统一别名。）

---

## EditEntryModal 拆分边界（ARC-03 / D-14～D-15）

| 边界 | 归属 | 内容 |
|------|------|------|
| **壳层** | `components/EditEntryModal/EditEntryModal.tsx` | `Modal`、`visible`、`onClose`、safe area、`KeyboardAvoidingView`、`ScrollView` ref；组合子组件 |
| **视图/字段** | `EditEntryFields.tsx`（或拆 `MoodField`、`DeadlineField`、`PeopleTriggersFields`） | MOOD_CONFIG、DEADLINE、标签 chips、`AddTagInput`、展示层 props 由上层注入 |
| **逻辑** | `EditEntryForm.tsx` 或 `useEditEntryForm.ts` | `useState` 同步 `entry`、`handleSubmit`、自定义标签 load/add/remove、调用 `updateEntry` 与 haptic |
| **纯函数** | `editEntryUtils.ts`（或放入现有 `utils/`） | `toggleSelection`；**deadline 归一**（`isCustomDeadline` / `finalDeadline`）等与 React 无关的计算 |
| **样式** | `EditEntryModal.styles.ts` | `StyleSheet.create` 从主文件移出，便于快照与阅读 |

**默认导出：** 目录根 `index.ts` 可 `export { default } from './EditEntryModal'` 以保持 `import EditEntryModal from '.../EditEntryModal'` 的可迁移性；或保留 `EditEntryModal.tsx` 为文件名入口（D-14）。

**与 MoodForm：** `MoodForm.tsx` 注释称抽取公共表单逻辑 — Phase 8 **不强制** 与 MoodForm 合并，避免范围膨胀；可在 PLAN 中记为「重复收敛候选（Phase 9+）」。

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 全局 store 模块化 | 自研事件总线替代 Zustand | 官方 slices + `StateCreator` | 类型与 `get()` 交叉调用已有成熟范式 |
| 表单校验 | 另一套验证框架（本阶段） | 保持现有 `Alert` + trim 校验 | 行为兼容优先 |
| 目录别名 | 硬编码多处相对路径 | 对齐现有 `@/` 或统一相对路径策略 | 与 D-16「逐步迁移 import」一致 |

---

## Runtime State Inventory（结构重构阶段）

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | AsyncStorage 中 entries 按 `getStorageKey(userId)` 存储；逻辑迁移后**键名与序列化格式应不变** | 代码审查 + smoke：加载/保存/迁移路径未改行为 |
| Live service config | Supabase `entries` / `profiles` 表与 RLS **不因文件拆分而变** | 无 |
| OS-registered state | 无与 profile/store 文件路径相关的 OS 注册项 | 无 |
| Secrets/env vars | 无本次重构专有条目 | 无 |
| Build artifacts | Metro/Expo 缓存可能导致旧 bundle；**非代码契约** | 清缓存仅作排障，不作为常规交付步骤 |

---

## Common Pitfalls

### Pitfall 1：spread 顺序静默覆盖

**现象：** 主 `return` 中后写的键覆盖 slice 同名方法，entries 仍走旧实现。  
**避免：** 合并后全局搜索 `_loadEntries` / `_saveEntries` 仅保留一处定义；单测或临时 runtime assert（开发环境）可选。

### Pitfall 2：profile 下沉引发循环依赖

**现象：** `features/profile` ↔ `store` ↔ `components` 相互 import。  
**避免：** 数据流自上而下；hooks 只依赖 store 与 RN API；必要时把纯类型移到 `types/`。

### Pitfall 3：EditEntryModal 拆坏 memo/ref

**现象：** `React.memo` 边界变化导致多余渲染或 ref 丢失。  
**避免：** 壳层保留 `memo` 出口；`entry`/`visible` 仍作 props 比较关键字段。

### Pitfall 4：「slice 化」只做文件移动不改职责

**现象：** `useAppStore.ts` 仍上千行，仅改 import 路径。  
**避免：** ARC-02 验收应包含 **entries 持久化逻辑归属 entries 切片** 的明确 diff。

---

## 风险与回滚

| 风险 | 等级 | 缓解 | 回滚 |
|------|------|------|------|
| 同步/登录与 profile 强耦合，移动代码时遗漏依赖 | MEDIUM | 按 D-01 单批修改；TypeScript 严格报错修完再合 | D-02：单批一个 revert commit |
| `_saveEntries` 防抖行为变化（写入延迟、丢失最后一条） | MEDIUM | 保持定时器与 500ms 常量；对比 refactor 前后关键调用栈 | 同上 |
| EditEntryModal props 或默认导出路径错误 | LOW | 保留原 default export 路径；EntryCard 手测编辑流 | 单文件 revert |

---

## 测试与验证建议

1. **静态：** `yarn lint`（或 `npm run lint`）— 与 Phase 6 治理范围一致。
2. **单元：** 若有 `editEntryUtils` 纯函数，新增 `__tests__/unit/...` 小测试（对齐 SHR-03 精神，非本 phase 强制门槛）。
3. **集成：** `yarn test:ci` / `jest` — 确保现有测试绿；属性测试若引用 `EditEntryModal` 路径则更新 import。
4. **Smoke：** `node scripts/verify-governance-smoke.js`（见 `06-SMOKE-CHECKLIST.md`）；手测 profile 登录、编辑资料、同步、从列表编辑条目（覆盖 EditEntryModal）。
5. **ARC-01 专项：** 对比拆分前后同一账号下统计数字、陪伴天数入口、同步按钮可用性（**无功能增减**）。

---

## Code Examples

### Zustand v5：切片组合（官方）

见上文 **Architecture Patterns** 引用块（Context7：`/pmndrs/zustand/v5.0.12`）。

---

## State of the Art

| Old Approach | Current Approach | When | Impact |
|--------------|------------------|------|--------|
| 单文件巨型 store | 工厂 module + spread | 已部分采用 | Phase 8 补齐 entries 与类型化 `StateCreator` |
| 单组件 500+ 行 | feature 目录 + 壳/逻辑/样式分离 | Phase 8 目标 | 可读性与可测性提升 |

---

## Open Questions

1. **`@/features` 别名是否已配置？**  
   - 已知：需查 `tsconfig.json` / `babel.config.js`。  
   - 建议：首批可用相对路径 `../../features/profile` 降低配置耦合。

2. **`_saveEntries` 是否应在未来与 sync slice 共用防抖策略？**  
   - 本 phase：保持行为不变；后续 slice 再论。

---

## Validation Architecture

> 供 Nyquist `VALIDATION.md` 使用；`workflow.nyquist_validation` 在 `.planning/config.json` 为 `true`。

### 验证维度（本 Phase）

| 维度 | 说明 |
|------|------|
| **行为等价** | 用户可见流程与拆分前一致（无新功能、无文案/流程擅自变更） |
| **Store 契约** | `useAppStore.getState().entries`、`addEntry`、`updateEntry`、`deleteEntry`、`_loadEntries`、`_saveEntries` 语义与持久化结果一致 |
| **模块边界** | `app/profile.tsx` 仅壳层；entries 持久化逻辑不留在「非 entries 切片文件」的重复实现 |
| **组件契约** | `EditEntryModal` 的 props（`entry`、`visible`、`onClose`、`onSuccess`）与默认导出兼容调用方 |
| **治理回归** | Lint 与 governance/smoke 脚本仍可通过 |

### 关键断言（建议写入 VALIDATION.md 的检查项）

1. **ARC-01：** 打开个人页，未登录可见登录入口；已登录可见用户卡片、统计、同步区；编辑资料与登录 Modal 可完成原有关闭/提交路径。  
2. **ARC-02：** 冷启动后 entries 列表与拆分前一致；新增/编辑/删除条目后杀进程重进数据仍在（AsyncStorage 路径不变）。  
3. **ARC-03：** 从列表进入编辑，校验空内容仍提示；合法提交后列表与详情一致，`onSuccess`/`onClose` 时序与原先用户感知一致（含短延迟关闭）。  
4. **命令：** `yarn lint` 退出码 0；`yarn test:ci`（或 `yarn test`）退出码 0；`node scripts/verify-governance-smoke.js` 退出码 0。

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest（`jest.config.js` / `jest.ci.config.js`） |
| Config file | `jest.config.js` |
| Quick run | `yarn test:unit` 或针对单测文件 `yarn jest path/to/test.ts` |
| Full suite | `yarn test:ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | 备注 |
|--------|----------|-----------|-------------------|------|
| ARC-01 | Profile 关键 UI 与导航 | 手测 + smoke | `node scripts/verify-governance-smoke.js` | 清单见 `06-SMOKE-CHECKLIST.md` |
| ARC-02 | entries 加载/保存 | 集成/手测为主 | `yarn test:ci` + 手测冷启动 | 若缺 store 单测，Wave 0 可补最小 `_saveEntries` mock |
| ARC-03 | EditEntryModal 提交与校验 | 手测 + 可选 RTL | `yarn test:ci` | 纯函数可单元测试 |

### Wave 0 Gaps

- [ ] 可选：`__tests__/unit/editEntryUtils.test.ts` — 覆盖 deadline 归一、`toggleSelection`（若抽出）
- [ ] 确认 `verify-governance-smoke.js` 是否覆盖 profile 路由；若不覆盖，VALIDATION.md 中显式列为手测必做

---

## Sources

### Primary (HIGH)

- Context7 `/pmndrs/zustand/v5.0.12` — slices pattern、`StateCreator` 交叉类型、combine 示例
- 仓库抽样：`app/profile.tsx`、`store/useAppStore.ts`、`store/modules/entries.ts`、`components/EditEntryModal.tsx`

### Secondary (MEDIUM)

- `.planning/phases/08-structure-refactor/08-CONTEXT.md` — 决策与范围
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md` — 回归路径

---

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — 与 lockfile + 官方文档一致  
- Architecture: **HIGH** — 与现有代码结构抽样一致  
- Pitfalls: **MEDIUM** — 依赖执行时 diff 审查  

**Research date:** 2026-03-22  
**Valid until:** ~30 天（Zustand 5.x 稳定）；Expo SDK 升级时需复核  

---

## RESEARCH COMPLETE

**Phase:** 8 — 大文件拆分与结构重构  
**Confidence:** HIGH（总体）；Open Questions 为 MEDIUM  

### Key Findings

- `profile` 已部分组件化，但 **认证/同步/Modal/样式仍集中在路由文件**，壳层化收益明确。  
- Store 已有 module spread，**entries 持久化与 module 占位分裂** 是 ARC-02 首批最清晰切口。  
- Zustand v5 **官方 slices + `StateCreator` 交叉类型** 满足 D-11，可与现有 `createEntriesModule` 演进对齐。  
- `EditEntryModal` 仍为单文件；按 **壳 / 表单逻辑 / 纯函数 / 样式** 拆目录符合 D-14/D-15。  
- 验证应 **lint + jest:ci + governance smoke + 手测 profile/编辑流**。

### File Created

`.planning/phases/08-structure-refactor/08-RESEARCH.md`

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
