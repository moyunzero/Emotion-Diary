# Phase 13 — Technical Research: RN/Expo 约定与中文注释

**Phase:** 13 — RN/Expo 约定与中文注释  
**Question:** 相对 Expo SDK 54 与当前仓库，RN-01/RN-02/DOC-01 的**可验证事实**与**文档缺口**是什么？

## RESEARCH COMPLETE

### 1. RN-01 — 配置事实（2026-03-22 仓库快照）

| 文件 | 关键事实 | 与 Expo 54 文档关系 |
|------|----------|---------------------|
| `package.json` | `expo ~54.0.30`，`react-native 0.81.5`，`react 19.1.0`，`expo-router ~6.0.21`，`main: expo-router/entry` | 与 `STACK.md` 版本锚点一致 |
| `app.json` | `newArchEnabled: true`；`experiments.typedRoutes: true`、`reactCompiler: true`；`scheme: emotiondiary`；插件含 `expo-router`、splash、secure-store、font、web-browser、media-library | 需在审计表中写明「刻意开启项」与官方默认差异 |
| `babel.config.js` | `babel-preset-expo` + **`react-native-reanimated/plugin`（唯一 plugins 项）** | 符合 Reanimated 要求：**插件须在 plugins 列表最后**（当前仅一项，满足） |
| `metro.config.js` | `getDefaultConfig` + `transformer.minifierConfig.compress.drop_console: true` | **生产**去掉 `console`；与 Phase 12 QA-02「开发期 log」策略需文档互证（避免贡献者误以为本地也删 log） |
| `tsconfig.json` | `extends: expo/tsconfig.base`，`strict: true`，`paths @/*` → 根 | 标准 Expo TS 路径扩展 |
| `.planning/codebase/STACK.md` | 已含 Metro/Babel/实验特性/配置索引表 | RN-01 **不必从零写长文**；缺口是 **结构化「核对结论表」+ 偏差说明 + README/CONTRIBUTING 指针** |

**结论：** Plan 01 应产出 **独立审计落盘文件**（如 `13-RN-CONFIG-AUDIT.md` 或 `.planning/codebase/EXPO-RN-AUDIT.md`），列：配置项、当前值、结论（Aligned / Intentional deviation）、一句话依据（链到 Expo 文档路径或内部理由）。并在 `README.md` 或 `STACK.md` 顶部增加 **一行**指向该审计。

---

### 2. RN-02 — Expo Router 与 `app/` 事实

| 路径 | 角色 |
|------|------|
| `app/_layout.tsx` | 根布局（字体、全局 Provider 等） |
| `app/(tabs)/_layout.tsx` | Tab 导航 |
| `app/(tabs)/index.tsx` | 首页 Tab |
| `app/(tabs)/record.tsx` | 记录 Tab |
| `app/(tabs)/insights.tsx` | 洞察 Tab |
| `app/profile.tsx` | 个人（非 tabs 组内） |
| `app/review-export.tsx` | 情绪回顾导出 |

**结论：** CONTRIBUTING 当前 **未**系统描述「文件式路由、`(tabs)` 分组、与 `features/` / `components/` 分工」。Plan 02 应新增 **短文档**（建议 `.planning/codebase/ROUTING.md` 或 `docs/EXPO-ROUTER.md`）+ `CONTRIBUTING.md` 内 **可 grep 的链接**（含 `app/`、`expo-router` 或「路由」关键词）。

---

### 3. DOC-01 — 中文注释候选范围（量化基线）

| 区域 | 文件（优先） | 说明 |
|------|----------------|------|
| Store 模块 | `store/modules/entries.ts`, `storage.ts`, `user.ts`, `ai.ts`, `weather.ts`, `types.ts` | 各文件 **模块头注释（中文）** + **至少 1 处**非显而易见逻辑（异步、持久化边界、与 Supabase 交叉） |
| Store 聚合 | `store/useAppStore.ts` | **文件头** + `initializeStore` / 认证订阅 / 与 slice 组合处 **分段注释** |
| 主流程 UI（记录/导出/同步相关） | `components/MoodForm.tsx`，`components/ReviewExport/ReviewExportScreen.tsx`（及必要时 `ReviewExportCanvas.tsx`） | 各 **文件头** + 关键用户路径 **至少 2 条中文行注释**（非复述标识符） |

**阈值建议（供 PLAN 锁定）：** 上述列表中 **≥8 个源文件** 出现 **新增或显著补强**的中文注释块；**`store/modules/*.ts` 全部 6 个文件**均有 **模块级**中文说明（`types.ts` 可为「类型契约说明」简短头注释）。

---

### 4. 验证与门禁

- 每波结束：`yarn typecheck && yarn lint && yarn test:ci`（与仓库 CI 一致）。
- 注释-only 变更 **不应**降低覆盖率；若触碰逻辑需跑 `node scripts/verify-governance-smoke.js`。

---

## Validation Architecture

| 维度 | 策略 |
|------|------|
| **每任务/波次** | `yarn typecheck && yarn lint && yarn test:ci` |
| **DOC-01 注释** | 人工 spot-check + `rg` 验证关键文件含中文注释头或约定子串 |
| **RN-01/02 文档** | `test -f` 目标文件 + `rg` 固定小节标题或关键词 |

---

*Phase 13 · Research · 2026-03-22*
