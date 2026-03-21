# 全仓增量优化审计（Phase 04-03）

**验收总览：** 与 **`4-VERIFICATION.md`** 中「04-03」条目交叉核对。

## 概述

本阶段采用 **棕地增量** 策略：**不** 对全仓库做一次性 Prettier 重排；改动以 **可审计、可回滚** 的小步为主。回顾导出统计口径与洞察页 **独立**，**不** 合并不同业务口径的统计函数。

## 按模块扫描

| 路径 / 模式 | 现象 | 建议 | 优先级 |
|-------------|------|------|--------|
| `components/ReviewExport/` | 画布与 AI 摘要曾重复 `useMemo` 统计链 | 见 **04-01**：`computeReviewExportDerivedState` 单一来源 | P0（已处理） |
| `utils/reviewExportDerived.ts` | 新增派生层，需与 `reviewExportClosingInput`、测试同步 | 保持 `buildReviewExportClosingSummary` 为薄封装 | P1 |
| `components/Insights/` | 长页多卡片，`ScreenContainer` 滚动性能依赖平台默认 | `removeClippedSubviews` 已在容器层开启（见 04-02） | P2 |
| `components/CompanionDaysCard.tsx` | 陪伴天数动画中未使用变量 | 删除死变量，避免误导后续调参 | P2（已处理） |
| `app/_layout.tsx` | RNGH 同包双 import 触发 `import/no-duplicates` | 入口保留官方写法，局部 `eslint-disable` 块说明 | P2（已处理） |
| `app/profile.tsx` | `catch (error)` 未使用 | 使用空 `catch` 或记录日志 | P2（已处理） |
| `hooks/useThemeStyles.ts` | `useMemo` 依赖告警 | 父级 `styleFactory` 稳定化或补依赖（后续） | P2 |
| `components/Dashboard.tsx` | `ScreenContainer` default import 命名告警 | 改为命名导入或统一导出风格（后续） | P2 |
| `package.json` | `expo lint` 默认包含不存在的 `src/`，CI 失败 | `lint` 脚本改为显式 `eslint` 路径（见已执行） | P0（已处理） |

## 已执行 / Done

| # | 文件 / 范围 | 改动简述 |
|---|----------------|----------|
| 1 | `utils/reviewExportDerived.ts` + `ReviewExportCanvas` / `ReviewExportScreen` | 派生状态单源；画布只展示，不再重复统计 |
| 2 | `utils/reviewExportClosingInput.ts` | 薄封装：`computeReviewExportDerivedState(...).closingSummary` |
| 3 | `__tests__/unit/utils/reviewExportDerived.test.ts` | 摘要与周期与 `buildReviewExportClosingSummary` / `getReviewExportPeriods` 一致 |
| 4 | `package.json` → `lint` | 使用 `eslint` 显式目录，避免 `expo lint` 因缺失 `src` 报错 |
| 5 | `app/_layout.tsx` | `import/no-duplicates` 局部禁用并注释 RNGH 双导入原因 |
| 6 | `app/profile.tsx` | 未使用的 `catch (error)` 改为 `catch` |
| 7 | `components/CompanionDaysCard.tsx` | 删除未使用的 `duration` / `frameTime` |
| 8 | `components/ScreenContainer.tsx` + `ReviewExportScreen.tsx` | `removeClippedSubviews`；回顾页 `ScrollView` `keyboardShouldPersistTaps` |

## 04-03 微包执行台账（ENG-02）

| Package | 目标 | 文件边界 | 回滚点 | 验证门禁 | 状态 |
|---|---|---|---|---|---|
| Pkg-A | 收敛 `EntryCard` 冗余比较逻辑，不改用户可见行为 | `components/EntryCard.tsx` | `git revert <pkg-a-commit>` | `npm run lint` + `npx jest __tests__/unit/components/componentPropTypes.test.tsx __tests__/unit/components/iconMemoization.test.tsx` + 手动检查“记录页条目展开/折叠” | 进行中 |
| Pkg-B | 精简 `MoodForm` 重复映射/重复比较逻辑，保持行为稳定 | `components/MoodForm.tsx` | `git revert <pkg-b-commit>` | `npm run lint` + 同上单测 + 手动检查“记录页输入/标签选择” | 进行中 |

> 约束：每个优化包严格 1 个文件，避免格式化扩散；若出现行为风险，按 D-15 立即回滚。

## 优先级说明

- **P0**：阻塞构建、测试或与本阶段契约直接冲突。  
- **P1**：可维护性 / 数据一致性风险。  
- **P2**：体验、性能、风格与告警清理。
