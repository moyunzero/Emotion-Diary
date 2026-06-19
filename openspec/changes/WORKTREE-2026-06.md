# 当前工作区变更索引（2026-06）

> **用途**：v1.2.0 合入索引；合并后可删或归档。

## 发布版本

**1.2.0**（2026-06-13 提审）— 回收站、同步 UX、音频重试、性能、留存、Profile/回收站 UI 统一。

## SSD 任务包（003–010）

| 编号 | 目录 | 主题 | 关键代码入口 |
| --- | --- | --- | --- |
| 003 | `003-regression-guardrails` | 回归地基 | `shared/sync/cloudMerge.ts`、回归清单 |
| 004 | `004-sync-ux-clarity` | 同步 UX | `constants/syncDataOps.ts`、`shared/sync/syncLock.ts` |
| 005 | `005-recycle-bin-ui` | 回收站 | `app/recycle-bin.tsx`、`restoreEntry` |
| 006 | `006-audio-reliability` | 音频可靠 | `shared/audio/uploadRetry.ts`、`retryAudioUpload` |
| 007 | `007-entry-snapshots-purge` | 永久删除 | `purgeEntryForever`、`services/entryTombstones.ts` |
| 008 | `008-performance-large-data` | 性能 | `shared/entries/dashboardFilter.ts`、`InsightsDeferredSections` |
| 009 | `009-retention-touchpoints` | 留存 | `services/emotionReminders.ts`、`RevisitBanner` |
| 010 | `010-profile-recycle-layout-unify` | UI 统一 | `GroupedSettingsCard`、`RecycleBinEntryCard` |

## E2E 与 testID

| 层 | 路径 | 命令 |
| --- | --- | --- |
| Jest 单测 | `__tests__/unit/**` | `yarn test`（169，排除 `e2e/`） |
| Playwright Web | `e2e/` | `yarn test:e2e`（3） |
| Maestro 原生 | `.maestro/flows/` | `yarn test:maestro`（2）；前置 `yarn test:maestro:preflight` |

**Maestro 导航**：深链 `emotiondiary://…`，勿依赖 Tab `testID` 点击。

**E2E testID**（Wave 2–3，QA-01 locale-agnostic 选择器）：

| testID | 组件 / 用途 |
| --- | --- |
| `dashboard-header` | 气象站页头；Maestro 首页 wait |
| `mood-content-input` | 记一笔正文输入 |
| `mood-submit-button` | 提交情绪记录 |
| `mood-entry-card` | 气象站条目卡片 |
| `entry-delete-button` | 条目软删入口 |
| `profile-recycle-bin-item` | Profile → 回收站导航（Playwright） |
| `recycle-bin-entry-card` | 回收站列表卡片 |
| `recycle-restore-button` | 回收站恢复 |
| `recycle-purge-button` | 回收站永久删除 |
| `recycle-bin-empty-state` | 回收站空状态 |

**Known gap — RN Alert 确认**：`Alert.alert` 按钮无 `testID`；Maestro 用 `tapOn index: 1`（cancel=0、destructive confirm=1），Playwright Web 用 `page.on('dialog', accept)`。勿依赖「恢复」「永久删除」等 locale 文案 tap。

## 工程文档已同步

- `openspec/engineering-system.md` — 路由、目录树、E2E 入口
- `openspec/engineering-quality.md` — 测试/CI、Profile/回收站壳层
- `openspec/state-management.md` — `restoreEntry` / `purgeEntryForever`
- `openspec/consistency-report.md` — 003–010 对齐声明
- `openspec/iteration-roadmap-2026.md` — 010、OQ-4、handoff
- 各任务 `VERIFICATION.md` — 169 tests + E2E 结果（2026-06 复验）
- 根 `README.md` — CI/E2E 说明；**[1.2.0]** 版本历史（Keep a Changelog）

## 验证命令（合入前）

```bash
yarn typecheck && yarn lint && yarn test
yarn test:e2e                    # Web
yarn test:maestro:preflight      # iOS 环境
yarn test:maestro                # 需 yarn start + dev build
```

## 不入库（`.gitignore`）

`test-results/`、`playwright-report/`、`.codegraph/`、`.understand-anything/`、本地 `ios/`（`expo prebuild` 产物，按需本地生成）。
