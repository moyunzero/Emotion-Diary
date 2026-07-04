# SPEC：回访花园闭环（015）

> **扩展** [`009-retention-touchpoints`](../009-retention-touchpoints/SPEC.md) 的 A2/A3，不替换 009 范围。

## 背景

- **依赖**：009（留存触达）、011（隐喻视觉）、012（onboarding）、014（竖版分享卡）。
- **分支**：`260703-feat-retention-garden-loop`
- **目标**：回访与周回顾横幅接入花园成长隐喻；通知与 Profile 副文案统一温暖语气；Maestro 015 自动化验收。

## 需求矩阵

| ID | 能力 | 实现 |
|----|------|------|
| RET-01 | 回访副句 | `RevisitBanner` 保留 `daysSince` 标题 + `resolveRevisitSubtitleKey` → `revisitBanner.subtitle.{stage}` |
| RET-02 | 周回顾桥接 | `WeeklyReviewBanner.body` 静态双语句，指向 014 竖版分享卡 / 相册保存 |
| RET-03 | 通知与 Profile | `dailyNotification` / `weeklyNotification` / `dailyReminder.subtext*` / `weeklyReview.toggleSubtext` 温暖隐喻句 |
| RET-04 | 双语门禁 | `retentionCopy.test.ts` + `bilingualSmokeCopy` 扩展（含 onboarding 键） |
| RET-05 | E2E + UAT | Maestro 015（testID only）+ `VERIFICATION.md` 人工 zh/en 清单 |

## 设计决策（D-01–D-17 摘要）

| 决策 | 选择 |
|------|------|
| D-01 | 回访标题仍用 `daysSince` |
| D-02–D-03 | 副句单轨：**花园成长阶段**（非 weather bucket） |
| D-04 | 行动钮固定「去记一笔 / Log now」 |
| D-05 | `shouldShowRevisitBanner` 规则不变（≥2 天、无条目不展示） |
| D-06–D-08 | 周回顾 body 静态桥接；CTA / `last_week` / 周末规则不变 |
| D-10–D-13 | 通知与 Profile 副文案同隐喻家族；**默认关** |
| D-14 | testID：`revisit-banner-*`、`weekly-review-*`；独立 Maestro 015 |
| D-16–D-17 | 人工 UAT zh/en + 自动化 copy smoke |

## 关键文件

| 符号 | 路径 |
|------|------|
| `resolveRevisitSubtitleKey` | `shared/retention/resolveRevisitSubtitleKey.ts` |
| `getRetentionNow` | `shared/retention/getRetentionNow.ts`（`__DEV__` mock ISO） |
| `runMaestroRetentionSeed` | `services/maestroRetentionSeed.ts` |
| Dev seed 路由 | `app/dev-seed-retention.tsx` |
| Maestro 015 | `.maestro/flows/015-retention-garden-loop.yaml` |

## 边界（不在范围）

- 远程推送
- 通知 payload 含日记正文（**禁止**）
- 修改 `touchpoints.ts` 展示阈值
- weather 双轨副句

## 验收清单

- [ ] RET-01：Dashboard 回访横幅含 garden-stage 副句 + testID
- [ ] RET-02：Insights 周末横幅桥接 copy → `review-export?preset=last_week` → `share-card-canvas`
- [ ] RET-03：通知 / Profile 副文案 zh/en 更新
- [ ] RET-04：`yarn test` retention + bilingual smoke 绿
- [ ] RET-05：`yarn test:maestro:015` + VERIFICATION 人工 sign-off

详见 [`VERIFICATION.md`](./VERIFICATION.md)。
