# VERIFICATION：014 可分享周回顾卡片（shareable-ritual-cards）

## 验证目标

- SHR-01、SHR-03–SHR-05 行为符合 `SPEC.md` 与 CONTEXT D-01–D-18（本 Phase 适用子集）
- Phase 4 CI gate：`yarn typecheck && yarn lint && yarn test`
- Maestro 014 周回顾 testID 契约
- Playwright Web PNG 下载 smoke

**分支：** `260702-feat-shareable-ritual-cards`

**范围说明：** SHR-02 和解/焚烧仪式分享卡已取消；Maestro / 实现仅覆盖 `review-export` 周回顾路径。

## 需求矩阵

| ID | 能力 | 自动化命令 | 手工 UAT |
| --- | --- | --- | --- |
| SHR-01 | 周回顾 9:16 竖版 PNG | `yarn test __tests__/unit/shared/share/ --bail`；Maestro 014 | 真机保存相册；检查 1080×1920 |
| SHR-03 | 011 视觉；默认无日记正文；opt-in 默认 off | `buildShareCardModel.test.ts`；Maestro snippet gate | 卡片 PII 目视 |
| SHR-04 | iOS/Android 相册；Web PNG 下载 | `captureViewToPng.test.ts`；Playwright download spec | 相册权限；Web 下载 |
| SHR-05 | footer 水印低调 | `shareCopy.test.ts` | 目视 footer secondary 色 |

## 已执行检查（2026-07-02 合 PR 前）

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | ✅ pass |
| ESLint | `yarn lint` | ✅ pass（0 errors，13 warnings 均为既有/非阻塞） |
| 全量测试 | `yarn test` | ✅ 53 suites / 347 tests |
| 分享模块单元 | `yarn test __tests__/unit/shared/share/ __tests__/unit/i18n/shareCopy.test.ts` | ✅ pass |
| Playwright Web | `yarn test:e2e e2e/share-card-web-download.spec.ts` | ✅ 1 pass / 1 skip（headless captureRef） |
| Maestro preflight | `yarn test:maestro:preflight` | ✅ pass |
| Maestro E2E 014 | `yarn test:maestro:014` | ✅ pass（保存 + 返回首页；5 张截图） |

## 行为验证

- [x] SHR-01：`ShareCardWeekContent` + `ReviewExportScreen` 9:16 预览与保存
- [x] SHR-03：无 PII 字段；opt-in 默认 off；preset 动态标题/天气叙事
- [x] SHR-04：`saveShareCardImage` 静态 import 修复 PushNotificationIOS 崩溃；Web download smoke
- [x] SHR-05：水印 i18n parity
- [x] Maestro 014：review-export → canvas → save → back
- [x] 手工 UAT（模拟器）— 四 tab 标题/日期/天气随 preset 变化；保存成功 Alert；返回无 GO_BACK 报错
- [ ] 手工 UAT — 真机 1080×1920 像素抽检（未做）

## 合 PR 前修复摘要

| 问题 | 修复 |
| --- | --- |
| 保存崩溃 PushNotificationIOS | `saveShareCardImage` 改静态 `Alert` import |
| deep link 返回 GO_BACK | `canGoBack()` else `replace('/')` |
| 布局重叠/空白/字太小 | ShareCardShell footer 分区；移除 auto-shrink |
| 各 tab 均显示「这一周」 | `periodTitle` / `periodEntries` 驱动标题与天气叙事 |
| SHR-02 取消 | 删除仪式 preview 路由与 EntryCard CTA |

## E2E 映射

| 需求 | 自动化 | 说明 |
| --- | --- | --- |
| SHR-01 | Maestro 014 `emotiondiary://review-export` | `share-card-canvas` + save |
| SHR-03 | unit + Maestro snippet gate | 默认 `share-card-snippet-input` hidden |
| SHR-04 | captureViewToPng + Playwright | `xinqingmo-share-*.png` |
| SHR-05 | shareCopy.test.ts | watermark zh/en |

## 签 off 表

| 需求 | 自动化 | 手工 UAT | 签 off |
| --- | --- | --- | --- |
| SHR-01 | ✅ | ☐ 真机尺寸 | PASS（待真机尺寸） |
| SHR-03 | ✅ | ✅ 模拟器 | PASS |
| SHR-04 | ✅ | ✅ 模拟器保存 | PASS |
| SHR-05 | ✅ | ✅ 模拟器 | PASS |

## 未验证项

- Android Maestro
- 真机 1080×1920 像素抽检

## 文档更新记录

- [x] SPEC / UI-SPEC / VERIFICATION — SHR-02 移除、preset 与布局修复、合 PR 签 off
