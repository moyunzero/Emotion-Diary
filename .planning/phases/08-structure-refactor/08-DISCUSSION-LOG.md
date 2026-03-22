# Phase 8: 大文件拆分与结构重构 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 08-structure-refactor
**Areas discussed:** 拆分优先级与顺序, profile 模块落位与目录约定, useAppStore 首批 slice 范围, ARC-03 首个 500+ 目标组件

---

## 灰区 1：拆分优先级与顺序

| Option | Description | Selected |
|--------|-------------|----------|
| 1a | 先 profile 壳层 → 再 store slice → 最后 500+ 组件 | ✓ |
| 1b | 先 store slice → 再 profile → 最后 500+ 组件 | |
| 1c | 三个目标并行分波 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2a | profile 单独 1 批、store 单独 1 批、500+ 组件每 1 个 1 批 | ✓ |
| 2b | profile + store 合并 1 批 | |
| 2c | 由 planner 拆 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3a | 暂停该批，转做另一目标 | |
| 3b | 先解决阻塞再继续 | ✓ |
| 3c | 记录 deferred，跳过 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 4a | 只拆 1 个（EditEntryModal），其余留给 Phase 9/10 | ✓ |
| 4b | 拆 2–3 个 | |
| 4c | 能拆多少拆多少 | |

---

## 灰区 2：profile 模块落位与目录约定

| Option | Description | Selected |
|--------|-------------|----------|
| 1a | `features/profile/` | ✓ |
| 1b | `screens/profile/` | |
| 1c | `components/profile/` + hooks | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2a | 仅保留路由注册 + 一层 layout 容器 | ✓ |
| 2b | 保留路由 + layout + 少量本地状态 | |
| 2c | 路由 + 少量首屏逻辑 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3a | 按 UI 区块：ProfileHeader、ProfileSettings、ProfileStats | ✓ |
| 3b | 按功能域：AccountSection、CompanionSection 等 | |
| 3c | 由 planner 按代码结构决定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 4a | `features/profile/hooks/` 或 `hooks/profile/`（profile 专用） | ✓ |
| 4b | `hooks/` 顶层 | |
| 4c | 可泛化则放 `shared/` 或 `utils/` | |

---

## 灰区 3：useAppStore 首批 slice 范围

| Option | Description | Selected |
|--------|-------------|----------|
| 1a | 按功能域：entries、sync、settings、ui | ✓ |
| 1b | 按与 profile 共用最多 | |
| 1c | 由 planner 按代码结构决定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2a | 保持 useAppStore.getState() 和 selector 不变，内部组合 slice | ✓ |
| 2b | 逐步引导 useEntriesStore 等，旧 API deprecated | |
| 2c | 只做内部 slice，不改变调用方 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3a | create 内 combine 多个 slice | |
| 3b | 多个 create 独立 store，useAppStore 组合 | |
| 3c | 由 planner 根据 Zustand 最佳实践决定 | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 4a | 2–3 个 slice | |
| 4b | 1 个 slice 先跑通（如 entries），再扩展 | ✓ |
| 4c | 由 planner 决定 | |

---

## 灰区 4：ARC-03 首个 500+ 目标组件

| Option | Description | Selected |
|--------|-------------|----------|
| 1a | EditEntryModal | ✓ |
| 1b | EntryCard | |
| 1c | Dashboard | |

| Option | Description | Selected |
|--------|-------------|----------|
| 2a | 保留 `components/EditEntryModal/` 主入口，内部拆分 | ✓ |
| 2b | 拆到 `components/entries/EditEntryModal/` | |
| 2c | 由 planner 决定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3a | 视图 / 逻辑 / 纯函数 分离 | ✓ |
| 3b | 仅 UI 子组件拆分 | |
| 3c | 由 planner 决定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 4a | 保持原 import 路径，barrel re-export | |
| 4b | 调用方逐步改为 `@/components/entries` 等新路径 | ✓ |
| 4c | 本阶段不改变 import 路径 | |

---

## Claude's Discretion

- profile 具体子区块与文件命名由 planner 细化。
- store slice 合并方式与 state/action 命名由 planner 按 Zustand 惯例决定。
- EditEntryModal 子组件命名可随实际逻辑调整。

## Deferred Ideas

- EntryCard、Dashboard 等其它 500+ 组件 — Phase 9/10。
- import 路径全面迁移 — 本阶段逐步引导。
