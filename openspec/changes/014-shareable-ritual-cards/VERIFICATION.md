# VERIFICATION：014 可分享仪式卡片（shareable-ritual-cards）

## 验证目标

- SHR-01–SHR-05 行为符合 `SPEC.md` 与 CONTEXT D-01–D-18
- Phase 4 CI gate：`yarn typecheck && yarn lint && yarn test`
- Maestro 014 仪式/周回顾 testID 契约（或 signed manual UAT）
- Playwright Web PNG 下载 smoke

**分支：** `260702-feat-shareable-ritual-cards`（执行 wave 3 时合入 `260702-feat-metaphor-narrative` worktree）

## 需求矩阵

| ID | 能力 | 自动化命令 | 手工 UAT |
| --- | --- | --- | --- |
| SHR-01 | 周回顾 9:16 竖版 PNG | `yarn test __tests__/unit/shared/share/ --bail`；Maestro 014 `review-export` 段 | 真机保存相册；检查 1080×1920 |
| SHR-02 | 和解/焚烧后用户发起 CTA；不自动弹预览 | Maestro 014 resolve/burn 段；`assertNotVisible share-card-preview-root` 负向 | ceremony 结束仅见 CTA；未 tap 无 preview |
| SHR-03 | 011 视觉；默认无日记正文；opt-in 默认 off | `buildShareCardModel.test.ts`；Maestro `share-card-snippet-input` 默认不可见 | 卡片视觉 PII 扫描；snippet 勾选后才出现输入 |
| SHR-04 | iOS/Android 相册；Web PNG 下载 | `captureViewToPng.test.ts`；`yarn test:e2e e2e/share-card-web-download.spec.ts` | 相册权限拒绝/允许；Web 下载文件夹 |
| SHR-05 | footer 水印低调 | `yarn test __tests__/unit/i18n/shareCopy.test.ts --bail` | 目视 footer 品牌行 secondary 色 |

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | ✅ pass（04-04 execute） |
| ESLint | `yarn lint` | ⏳ 04-04 execute |
| 分享模块单元 | `yarn test __tests__/unit/shared/share/ __tests__/unit/i18n/shareCopy.test.ts --bail` | ✅ 17/17 pass（04-04 execute） |
| 全量测试 | `yarn test` | ⏳ 04-04 execute |
| Maestro preflight | `yarn test:maestro:preflight` | ⏳ 需 dev build |
| Maestro E2E 014 | `yarn test:maestro:014` | ⏳ 需 `yarn ios` 安装 dev build |
| Playwright Web 下载 | `yarn test:e2e e2e/share-card-web-download.spec.ts` | ✅ smoke pass + download test skipped（headless captureRef 限制） |
| 治理规则 | `yarn verify:governance` | 未执行 |

## 行为验证

- [x] SHR-01：`ShareCardWeekContent` + `ReviewExportScreen` 9:16 预览（Wave 2，04-02）
- [x] SHR-02：`EntryCard` 内嵌 CTA + `share-card-preview` modal；Maestro 负向 gate（04-04）
- [x] SHR-03：`buildShareCardModel` 无 PII 字段；opt-in 默认 off（04-01/03）
- [x] SHR-04：`captureViewToPng` + `saveShareCardImage` Web anchor download（04-01/02）
- [x] SHR-05：`share.watermark.brand` i18n parity（04-04 shareCopy test）
- [ ] Maestro 014 全路径：resolve CTA → preview → burn CTA → review-export canvas
- [ ] 手工 UAT — 相册保存成功 + 1080×1920 尺寸抽检
- [ ] 手工 UAT — 卡片 PII 目视（无人名/触发器/日记全文）

## E2E 映射

| 需求 | 自动化 | 说明 |
| --- | --- | --- |
| SHR-01 | Maestro 014 `emotiondiary://review-export` | `share-card-canvas` + optional `share-card-save-button` |
| SHR-02 | Maestro 014 resolve/burn | `share-card-cta-resolve` / `share-card-cta-burn` → `share-card-preview-root` |
| SHR-03 | `buildShareCardModel.test.ts` + Maestro snippet gate | 默认 `share-card-snippet-input` not visible |
| SHR-04 | `captureViewToPng.test.ts` + Playwright download spec | filename `xinqingmo-share-*.png` |
| SHR-05 | `shareCopy.test.ts` | `watermark.brand` zh/en distinct |

### Maestro 014 路径（`.maestro/flows/014-shareable-ritual-cards.yaml`）

1. `seed-active-entry` subflow（含 onboarding skip）
2. 和解：`entry-resolve-button` → `resolve-confirm-*` → ceremony skip → **负向** `share-card-preview-root` 不可见
3. `share-card-cta-resolve` → `share-card-preview-root` + `share-card-canvas` + snippet 默认 off
4. 焚烧：新条目 → `entry-burn-button` → `burn-complete-message` → `share-card-cta-burn` → preview
5. `emotiondiary://review-export` → `share-card-canvas` + optional save

Flow 约束：仅 `id:` 选择器，无 locale `text:` 断言。

## 命令速查

```bash
yarn typecheck && yarn lint && yarn test
yarn test __tests__/unit/shared/share/ __tests__/unit/i18n/shareCopy.test.ts --bail
yarn test:maestro:preflight && yarn start & yarn test:maestro:014
yarn test:e2e e2e/share-card-web-download.spec.ts
node -e "const p=require('./package.json'); if(!p.scripts['test:maestro:014']) process.exit(1)"
```

**Maestro 前置：** 模拟器需已安装 dev build（`yarn ios`）；preflight 检查 `com.moyunzero.emotiondiary`。相册权限步可能需手工 — flow 中 save 为 `optional: true`。

## 手工 UAT 清单

| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| 周回顾存相册 | Insights → review-export → 保存 | PNG 1080×1920；仅气象/花园/结语 |
| 和解分享 | ceremony 结束 → 生成分享卡 | 不自动弹 preview；tap 后进 modal |
| 焚烧分享 | burn toast 内 CTA | 2.5s 窗口内可 tap；preview 可见 |
| opt-in snippet | 预览页打开「加一句」 | 默认 off；勾选后出现输入；保存前无 PII |
| Web 下载 | review-export → 下载图片 | 浏览器下载 `xinqingmo-share-*.png` |
| PII 扫描 | 三种 variant 保存后目视 | 无人名、触发器、日记全文 |

## testID 清单（014 验收）

| testID | 组件 | 用途 |
| --- | --- | --- |
| `share-card-cta-resolve` | EntryCard | 和解 ceremony 后 CTA |
| `share-card-cta-burn` | EntryCard | 焚烧 toast 内 CTA |
| `share-card-preview-root` | ShareCardPreviewScreen | 仪式预览根 |
| `share-card-canvas` | ShareCardShell | 9:16 画布 |
| `share-card-save-button` | Preview / ReviewExport | 保存/下载 |
| `share-card-snippet-toggle` | Preview / ReviewExport | opt-in 开关 |
| `share-card-snippet-input` | Preview / ReviewExport | 用户一句（默认隐藏） |

## 签 off 表

| 需求 | 自动化 | 手工 UAT | 签 off |
| --- | --- | --- | --- |
| SHR-01 | ☐ | ☐ | ☐ PASS / ☐ FAIL |
| SHR-02 | ☐ | ☐ | ☐ PASS / ☐ FAIL |
| SHR-03 | ☐ | ☐ | ☐ PASS / ☐ FAIL |
| SHR-04 | ☐ | ☐ | ☐ PASS / ☐ FAIL |
| SHR-05 | ☐ | ☐ | ☐ PASS / ☐ FAIL |

## 未验证项

- Maestro 014 全路径（dev build / 模拟器权限）
- Android Maestro
- 真机 1080×1920 像素抽检
- `yarn verify:governance`

## 剩余风险

- Maestro save 步依赖系统相册权限 — flow 以 preview 导航为最低 gate（T-04-11 mitigate）
- Playwright headless Web `captureRef` 行为可能与真机浏览器略有差异

## 文档更新记录

- [x] `openspec/changes/014-shareable-ritual-cards/SPEC.md` — plan-phase 创建
- [x] `openspec/changes/014-shareable-ritual-cards/VERIFICATION.md` — 04-04 execute 填充命令表与 E2E 映射
