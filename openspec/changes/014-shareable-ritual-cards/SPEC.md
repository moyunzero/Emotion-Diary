# SPEC：014 可分享仪式卡片（shareable-ritual-cards）

## 背景

- **当前问题：** `ReviewExportScreen` 为横版自适应画布，含触发器 TopN 等统计块；Web 导出仅 `webUnsupported` Alert；和解/焚烧仪式完成后无用户发起的分享路径。
- **用户影响：** 用户无法将周回顾或仪式时刻以温和、脱敏的竖版卡片存入相册传播；与 v1.4「仪式可分享」差异化目标未达成。
- **相关代码：** `components/ReviewExport/ReviewExportScreen.tsx`、`components/ReviewExport/ReviewExportCanvas.tsx`、`components/EntryCard.tsx`、`components/rituals/ResolveCeremonyHost.tsx`、`shared/weather/weatherNarrative.ts`、`utils/reviewExportDerived.ts`。
- **相关文档：** `.planning/REQUIREMENTS.md` SHR-01–SHR-05；`openspec/changes/011-metaphor-activation/VISUAL-IDENTITY.md` §6；`.planning/phases/04-shareable-ritual-cards/04-UI-SPEC.md`。

## 目标

| ID | 能力 | 实现要点 |
|----|------|----------|
| SHR-01 | 周回顾竖版 share card 存相册 | 固定 9:16 `ShareCardShell` + `ShareCardWeekContent`；重构 `ReviewExportScreen` 捕获链路 |
| SHR-02 | 和解/焚烧后可选生成卡片 | EntryCard 内嵌 CTA；`share-card-preview` modal；**绝不**自动弹预览 |
| SHR-03 | 011 视觉；默认无日记正文 | 粉壳 + 仪式 accent 边条；`buildShareCardModel` 脱敏；opt-in snippet 默认 off |
| SHR-04 | iOS/Android 相册；Web 下载 | `shared/share/captureViewToPng` + `saveShareCardImage`；复用 `review_export_privacy_ack_v1` |
| SHR-05 | 适度 app 水印 | Shell footer `share.watermark.brand` + 可选日期；secondary 色低调 |

### 不在本次范围

- 应用内社交 feed、评论、点赞
- 系统 `Share.share` sheet（D-16 deferred）
- 二维码 / App Store 短链水印
- 首次仪式教育 sheet 自动弹出
- 卡片展示人名、触发器、日记全文（永久拒绝）
- 卡片中英双语同显（跟随 locale 单语）
- `ReviewExportCanvas` 触发器 TopN / 解决率大图（D-11 废弃）
- Phase 5 RevisitBanner / WeeklyReview 动态 copy（RET-*）

## 用户行为

### 触发入口

1. **周回顾：** Insights / WeeklyReviewBanner → `review-export` → 选 preset → 预览 9:16 卡 → 保存相册 / Web 下载。
2. **和解：** EntryCard 和解 ceremony 结束（Skip 或自然完成）→ 内嵌「生成分享卡」→ modal 预览 → 保存。
3. **焚烧：** burn-complete toast 与 micro-copy 同屏 → 内嵌 CTA → modal 预览 → 保存。

### 期望结果

- 导出 PNG **1080×1920**（9:16），WYSIWYG 预览与成片一致。
- 默认卡片仅气象 + 花园隐喻 + 结语/仪式句；用户勾选 opt-in 后才出现自定义一句（max 80 字）。
- 首次存相册/Web 下载经隐私确认；后续复用同一 AsyncStorage key。
- 用户自行从相册分享到社交平台；应用内不代为发帖。

### 异常或边界

- AI 周卡结语 loading 时保存钮 disabled。
- 相册权限拒绝 → Alert + 打开设置（复用 review 权限文案）。
- Web `captureRef` 失败 → toast/Alert + 保留预览。
- 和解 CTA：`onComplete` 先展示 CTA，**延迟** `resolveEntry` 至用户跳过或进入预览后。

## 技术约束

- **架构：** `shared/share/` 捕获/保存/隐私/model；`components/share/` 外壳 + 三套内容区；`app/share-card-preview.tsx` modal。
- **Wave 1 基础（04-01）：** `shared/share/shareCardDimensions.ts`、`captureViewToPng.ts`、`saveShareCardImage.ts`、`privacyAck.ts`、`buildShareCardModel.ts`；`components/share/ShareCardShell.tsx`；`locales/*/share.json` + i18n `share` namespace。
- **数据：** view-model 仅含枚举、i18n 已解析句、聚合隐喻；**禁止** `entry.content` / `people` / `triggers` 上卡。
- **i18n：** 新 `share` namespace（zh-Hans / en-US）；卡片文案跟随 `effectiveLocale`（D-04）。
- **多端：** iOS/Android `expo-media-library`；Web `captureRef` `data-uri` + anchor download（D-14）。
- **视觉：** 011 粉壳 + `COLORS.ritual.resolve` / `ritual.burn` accent 边条或 icon（D-18）；非整卡染色。
- **E2E：** Maestro `014-shareable-ritual-cards` testID-first；Playwright Web download smoke。
- **分支：** `260702-feat-shareable-ritual-cards`（从 `master` 切出）。

## 锁定决策（CONTEXT D-01–D-18）

| ID | 决策 |
|----|------|
| D-01 | 固定竖版 9:16，导出 1080×1920 PNG |
| D-02 | 统一粉系外壳 + week/resolve/burn 三套内容变体 |
| D-03 | 视觉重心 = 气象 + 花园隐喻，非数据表格 |
| D-04 | 卡片文案跟随 App 当前 locale |
| D-05 | 绝不自动弹出分享流程 |
| D-06 | 仪式完成 UI 内嵌小按钮「生成分享卡」 |
| D-07 | 和解：ceremony 结束后显示 CTA，再进预览 |
| D-08 | 焚烧：burn-complete toast 内同屏 CTA |
| D-09 | 默认 = 纯隐喻句，无日记原文 |
| D-10 | 预览页 opt-in「加一句自己的话」；默认关闭 |
| D-11 | 周卡 = 天气隐喻 + 花园 + AI 结语；无 Top 触发器/统计块 |
| D-12 | 永不展示人名、触发器、可识别关系标签 |
| D-13 | iOS/Android 主路径存系统相册 |
| D-14 | Web = PNG 下载（非 unsupported Alert） |
| D-15 | 复用 `review_export_privacy_ack_v1` |
| D-16 | 不做系统 Share sheet |
| D-17 | 水印 = 底部一行小字 + 可选日期 |
| D-18 | 仪式 accent 仅图标或边条，非整卡染色 |

## 验收标准

- [ ] review-export 可生成 1080×1920 竖版 PNG 并存相册（SHR-01）
- [ ] 和解/焚烧后仅内嵌 CTA；未 tap 不出现 preview（SHR-02）
- [ ] 卡片 011 粉壳；默认无正文；opt-in 默认 off；无 PII（SHR-03）
- [ ] iOS/Android 相册完整；Web PNG 下载；隐私 ack 复用（SHR-04）
- [ ] footer 水印低调（SHR-05）
- [ ] `buildShareCardModel` unit 断言无 people/triggers/content 字段
- [ ] Maestro `014-shareable-ritual-cards` 绿；`yarn test:maestro:014` script 存在
- [ ] Playwright `e2e/share-card-web-download.spec.ts` 绿
- [ ] `yarn typecheck && yarn lint && yarn test` CI 绿

## 依据

- **产品：** `.planning/ROADMAP.md` Phase 4；`.planning/REQUIREMENTS.md` SHR-*
- **技术：** `.planning/phases/04-shareable-ritual-cards/04-RESEARCH.md`、`04-PATTERNS.md`、`04-UI-SPEC.md`
- **视觉：** `openspec/changes/011-metaphor-activation/UI-SPEC.md`、`VISUAL-IDENTITY.md` §6
