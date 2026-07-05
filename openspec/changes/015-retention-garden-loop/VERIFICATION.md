# VERIFICATION：015 回访花园闭环

## Phase 目标

Phase 5（v1.4）落地 RET-01–RET-05：花园隐喻回访副句、周回顾分享卡桥接、通知/Profile 温暖 copy、双语门禁、Maestro 015 E2E。

- **OpenSpec**：[`SPEC.md`](./SPEC.md)
- **分支**：`260703-feat-retention-garden-loop`

## 需求 → 验证映射

| ID | 验证方式 |
|----|----------|
| RET-01 | 单元 `resolveRevisitSubtitleKey.test.ts`；Maestro `revisit-banner-root`；人工 Dashboard 副句 |
| RET-02 | `retentionCopy.test.ts` weekly body；Maestro `weekly-review-action` → `share-card-canvas` |
| RET-03 | `retentionCopy.test.ts` notification + Profile subtext keys |
| RET-04 | `bilingualSmokeCopy.test.ts` + `namespaceKeys.test.ts` |
| RET-05 | Maestro 015 全流程 + 下方人工 UAT（zh + en 各一轮） |

## 自动化命令

```bash
yarn typecheck
yarn lint
yarn test
yarn test __tests__/unit/shared/retention/ --bail
yarn test __tests__/unit/i18n/retentionCopy.test.ts --bail
yarn test __tests__/unit/i18n/bilingualSmokeCopy.test.ts --bail
yarn test:maestro:preflight
yarn test:maestro:015   # 需 dev build + 模拟器
```

> Maestro weekly 路径使用 dev seed 固定周六（`2025-03-15`）；生产用户仅在周五–周日看到周回顾横幅。

## 人工 UAT（zh-Hans 与 en-US 各执行一次）

设备/模拟器系统语言分别设为中文与英文，或使用 App 内语言切换。

1. **记一笔** — Record tab 新建条目
2. **Dashboard** — 确认气象站/花园相关界面；若满足回访条件，确认横幅标题 + 花园隐喻副句
3. **Insights** — 周末（或 dev seed weekly）：确认周回顾桥接 copy；点 CTA → 进入 `review-export`
4. **Export** — 生成竖版分享卡，尝试保存/下载
5. **回访** — 回溯条目日期或等待 ≥2 天；确认回访横幅含副句

### 可选子检查

- Profile 提醒默认关；开启每日提醒后 Profile 副文案为温暖隐喻句（无日记正文）
- 通知 body 仅固定 i18n 句（不在 CI 测 OS 通知）

## Sign-off

| ID | zh-Hans | en-US | 自动化 |
|----|---------|-------|--------|
| RET-01 | ☑ PASS (Maestro) | ☑ PASS (Maestro) | ☑ |
| RET-02 | ☑ PASS (Maestro) | ☑ PASS (Maestro) | ☑ |
| RET-03 | ☑ PASS (Maestro) | ☑ PASS (Maestro) | ☑ |
| RET-04 | — | — | ☑ |
| RET-05 | ☑ PASS (Maestro) | ☑ PASS (Maestro) | ☑ |

截图归档：`.maestro/acceptance/015-retention-garden-loop/`（18 张，2026-07-03 `yarn test:maestro:015` 全绿）
