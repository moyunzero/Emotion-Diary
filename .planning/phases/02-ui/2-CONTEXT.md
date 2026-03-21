# Phase 2: 回顾图 UI + 图片导出 - Context

**Gathered:** 2025-03-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段交付：**用户可见**与导出版式契约一致的 **完整预览**，并可 **导出为 PNG 图片**、在 **iOS** 上 **分享/保存**；导出前 **明确隐私提示**。**不包含** Phase 3 的 **真实 Groq 一句总结**（本阶段用占位文案）；**不包含** PDF。

讨论澄清的是 **入口、版式实现策略、分享链路、隐私与占位**，不扩大为全应用改版。

</domain>

<decisions>
## Implementation Decisions

### 入口与导航

- **D-01（主入口）**：在 **洞察页**（`app/(tabs)/insights.tsx` 所渲染内容）提供主 CTA：**「生成情绪回顾图」**（文案可微调），与「回顾/带走」心智一致。  
- **D-02（导航形态）**：使用 **全屏 Stack 子路由** `app/review-export.tsx`（或 `app/(stack)/review-export.tsx`，以现有 `app/_layout.tsx` 的 `Stack` 为准），从洞察 **`router.push('/review-export')`** 进入；**避免**在带 Tab 的同一屏直接截图（底部 Tab 会进入截图时需隐藏，复杂度高）。若短期不改 `Stack`，可用 **`Modal` + `presentationStyle="fullScreen"`** 作为等价实现，**二选一**由实现时以最少改动为准。  
- **D-03（次级入口，可选）**：个人页 `app/profile.tsx` 可增加「回顾图」入口；**非 Phase 2 阻塞项**。

### 时间范围（与 Phase 1 统计层对接）

- **D-04（v1 预设）**：仅提供 **预设**：**本周 / 本月 / 上周 / 上月**（用 `utils/reviewStatsTimeRange.ts` + 当前 `Date` 计算 `startMs/endMs`）。**不做**自定义起止日期（防 scope 膨胀；可记入 backlog）。  
- **D-05（默认选中）**：打开屏时默认 **本月**。

### 版式与区块顺序（与 PROJECT 契约一致）

- **D-06（顺序）**：自上而下：**页眉（日期范围 + 陪伴第 N 天）** → **解决率 + 环比 + 笔数小字** → **（可选）趋势区** → **Top3 天气** → **Top3 触发器 + 园艺建议** → **一句总结区**。  
- **D-07（一句总结 — Phase 2）**：使用 **非 AI 占位文案**（1～2 句、温柔语气），**不得**调用 Groq；占位需 **可一眼区分**于未来 AI 行（如前缀「💬」或小字「（预览文案，完整版即将上线）」——具体由 UI 定，**须**在 Phase 3 替换为真实生成）。  
- **D-08（趋势图）**：优先使用 Phase 1 已提供的 **`getMonthlyResolutionRateSeries`** 做 **简易柱状/折线**（`react-native-svg` 已在依赖中）。若工期紧，允许 **灰色占位块 + 文案「趋势图即将完善」**，但须保留数据接线，便于 Phase 4 美化。

### 截图与导出

- **D-09（技术）**：复用项目内 **`react-native-view-shot`** 的 `captureRef` 模式（参考 `components/EntryCard.tsx` 的 `makeImageFromView` / `captureRef`）；预览根容器 **`collapsable={false}`**（Android），`format: "png"`，`quality: 1`；长图可设 **`width`** 与背景色与洞察卡片一致。  
- **D-10（预览=成片）**：用户所见预览区域与 `captureRef` 目标 **同一 `View` 子树**，避免「预览与导出不一致」。

### 分享、保存与权限

- **D-11（iOS 优先）**：使用 **`expo-sharing`** 分享临时文件；保存相册使用 **`expo-media-library`**（或等价 Expo 官方方案），需在 `app.json` / `Info.plist` 增加 **相册写入说明**（若尚未存在）。**依赖尚未在 `package.json` 时**，由实现阶段 `npx expo install expo-sharing expo-media-library`。  
- **D-12（隐私提示时机）**：在 **首次点击「导出/分享」** 前弹出 **`Alert` 或 Modal**（二选一），明确：**图含情绪与记录信息，分享前请确认对象可信**；可提供 **「不再提示」** 存 `AsyncStorage` 键（版本化如 `review_export_privacy_ack_v1`）。

### 性能与反馈

- **D-13**：截图前可用 **`InteractionManager.runAfterInteractions`**；导出过程中显示 **`ActivityIndicator`**，禁止无反馈长按。

### Claude's Discretion

- `review-export` 文件拆分（单文件 vs `components/ReviewExport/` 子目录）。  
- 占位句与占位趋势的具体文案/色值。  
- 是否在导出完成后触发轻 **`Haptics.notificationAsync`**。

</decisions>

<specifics>
## Specific Ideas

- 洞察页已有 `INSIGHTS_COLORS`、`GardenHeader` 等，回顾图应 **视觉同系**（粉绿治愈、Lato）。  
- `EntryCard` 已演示 **view-shot + Skia** 路径；回顾图导出可走 **纯 PNG URI**（`result: "tmpfile"`）再 `Sharing.shareAsync`，不必强制 Skia 后处理。

</specifics>

<canonical_refs>
## Canonical References

### 规划

- `.planning/PROJECT.md` — 导出版式契约、图片优先、AI 属后续  
- `.planning/phases/01-stats-aggregation/1-CONTEXT.md` — 统计口径  
- `.planning/ROADMAP.md` — Phase 2 Success Criteria  

### 代码（实现前必读）

- `utils/reviewStats.ts`、`utils/reviewStatsWeather.ts`、`utils/reviewStatsTriggers.ts`、`utils/reviewStatsTimeRange.ts` — 数据源  
- `services/companionDaysService.ts` — `calculateDaysAsOf`、`formatStartDate`  
- `store/useAppStore.ts` — `entries`、`user`  
- `components/EntryCard.tsx` — `captureRef`、Skia 路径参考  
- `app/_layout.tsx` — Stack 路由注册方式  
- `app/(tabs)/insights.tsx` — 洞察入口挂载点  

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **view-shot**：`EntryCard` 已用 `captureRef`；回顾图可改用 **`result: "tmpfile"`** 便于 `expo-sharing`。  
- **统计 API**：Phase 1 纯函数可直接在 `review-export` 屏内 `useMemo` 调用。  

### Integration Points

- 从 **`useAppStore`** 读 `entries` 与 `user`（`firstEntryDate`）。  
- 陪伴天数展示用 **`calculateDaysAsOf(user.firstEntryDate, endMs)`**（与 CONTEXT 一致）。  

### Gaps to Address in Implementation

- **`expo-sharing` / `expo-media-library`**：若未安装，执行阶段需 `expo install` 并更新权限文案。  

</code_context>

<deferred>
## Deferred Ideas

- **自定义日期范围** — backlog / 后续版本。  
- **PDF 导出** — Phase 后验 / REQUIREMENTS v2。  
- **真实 AI 一句总结** — Phase 3（`EXPORT-07`）。  
- **Android 分享路径细节** — Phase 2 以 iOS 为主验证；Android 可跟测。  

</deferred>

---

*Phase: 02-ui*  
*Context gathered: 2025-03-21*
