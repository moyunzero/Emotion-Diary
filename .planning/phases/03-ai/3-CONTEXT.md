# Phase 3: AI 温柔一句 - Context

**Gathered:** 2025-03-21  
**Status:** Ready for planning  
**Discuss 说明:** 未逐项实时交互；决策按 `3-RESEARCH.md`、`REQUIREMENTS` EXPORT-07、`2-UI-SPEC` 与 Roadmap **锁定推荐默认**，实施前可微调文案长度与占位句式。

<domain>
## Phase Boundary

本阶段交付：情绪回顾 **导出图底部「一句话」** 由 **Groq** 生成（语气：朋友 / 树洞 / 温柔姐姐）；**无 API Key、网络失败或超时** 时使用 **可读兜底文案**，且 **不阻断**「保存到相册」主路径。  

**替换** Phase 2 画布中 **非 AI 占位总结**（`2-UI-SPEC` §3 第 6 点中的占位句），**不** 重做整页导出布局、**不** 改 PDF、**不** 改 Phase 2 截图/相册链路。

</domain>

<decisions>
## Implementation Decisions

### 数据与隐私

- **D-01**：Prompt **仅** 传入 **结构化统计摘要**（与图上数字同源，由 `reviewStats*` + `getReviewExportPeriods` 已算好的字段拼接），**禁止** 传入原始日记正文、`MoodEntry.content` 全文。  
- **D-02**：允许传入 **Top 天气/触发器名称与次数**（与导出图展示一致），用于减少模型幻觉。

### 服务层与栈

- **D-03**：在 **`utils/aiService.ts`** 新增 **`generateReviewExportClosingLine(...)`**（命名可调），内部 **必须** 复用 **`callGroqAPI`** + **`withRetry`** + **`isApiKeyValid()`**，与 `generateEmotionPodcast` 同一错误哲学。  
- **D-04**：模型 **`llama-3.1-8b-instant`**，环境变量 **`EXPO_PUBLIC_GROQ_API_KEY`**，不新增第二套 Groq 客户端。

### 输出形态

- **D-05**：模型输出 **单段中文**，目标 **约 80～120 字**（实现侧 `trim` + 截断上限 **200 字** 防失控）。  
- **D-06**：System/User prompt 须显式约束：**禁止医疗诊断、禁止客服腔、第二人称「你」、可沿用花园/天气隐喻**（与播客文案一致）。

### UI 合成与体验

- **D-07**：数据拉取放在 **`ReviewExportScreen`**（`useEffect` + `useState`），将 **`closingLine: string`** 与可选 **`aiStatus: 'idle' | 'loading' | 'ready' | 'fallback'`** 传入 **`ReviewExportCanvas`**；**不** 在 Canvas 内直接 `fetch` Groq。  
- **D-08**：**「保存到相册」始终可点**；AI 未返回时画布展示 **兜底句**（或 Phase 2 同款过渡句），**禁止** 因 AI 失败而禁用保存。  
- **D-09**：加载态 **轻量**（一行小字「正在写一句话…」或省略），**无 Key** 时 **不** 展示长时间 Loading，**直接** 兜底。  
- **D-10**：截图内容：**保存时** 捕获当前画布；若用户极快保存，允许截到兜底句（可接受）；**不** 为实现「必含 AI 句」而阻塞保存（与 EXPORT-07 一致）。

### 缓存（可选）

- **D-11**：同一 **`preset + 周期边界（startMs/endMs）+ entries 指纹（如 hash 条数+最新时间戳）`** 可内存缓存 **24h**（与播客同级），避免反复切 Tab 打爆配额；**可** 在首版省略，由实现阶段定。

### Claude's Discretion

- 兜底句具体 1～2 条模板（与现占位语气一致）。  
- 是否显示「加载中」行与 Skeleton。  
- 缓存键精确实现与单元测试覆盖面。

</decisions>

<specifics>
## Specific Ideas

- 与 `PROJECT.md` 示例语气一致：**温柔、具体、可共读**，避免「客服腔」。  
- 失败时兜底可参考：`generateEmotionPodcast` 的 `getDefaultPodcast` 式 **不抛错、可保存**。

</specifics>

<canonical_refs>
## Canonical References

### 规划与需求

- `.planning/ROADMAP.md` — Phase 3 Goal、Success Criteria、EXPORT-07  
- `.planning/REQUIREMENTS.md` — EXPORT-07（一句 AI、失败兜底、不阻断导出）  
- `.planning/PROJECT.md` — 导出版式契约 §「一句话 AI 温柔总结」、失败兜底  

### Phase 2 契约（被本阶段替换的区块）

- `.planning/phases/02-ui/2-UI-SPEC.md` — §3 区块 6「一句总结」；§6 显式 Phase 3 接真实 AI  
- `.planning/phases/02-ui/2-CONTEXT.md` — Phase 2 占位 AI 约定（供对照删除/替换）  

### 研究

- `.planning/phases/03-ai/3-RESEARCH.md` — Stack、Don't Hand-Roll、Common Pitfalls、Prompt 形状  

### 代码（实现前必读）

- `utils/aiService.ts` — `callGroqAPI`、`withRetry`、`isApiKeyValid`、`generateEmotionPodcast` 降级模式  
- `components/ReviewExport/ReviewExportCanvas.tsx` — 占位总结区；**替换为 props 驱动的一句**  
- `components/ReviewExport/ReviewExportScreen.tsx` — 挂载拉取逻辑与状态  

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`callGroqAPI` / `withRetry` / `classifyError`**：与播客、处方共用同一 Groq 路径。  
- **`generateEmotionPodcast`**：统计摘要 → user prompt、无 Key → 默认文案、**缓存** 模式可参考。  

### Established Patterns

- `EXPO_PUBLIC_*` 在 Expo 中打包；无 Key 时 **不发请求**。  
- 导出页：**`captureRef`** 已接在 `ReviewExportScreen`，新状态应 **在同一子树** 内更新文案。  

### Integration Points

- **`ReviewExportCanvas`**：将底部固定占位 `Text` 改为 **`closingLine`**（及可选小字「AI 生成」或「网络异常时已用默认句」——**Claude's Discretion**）。  
- **`ReviewExportScreen`**：`preset`、`entries` 变化时重算摘要并 **async** 拉取一句，**取消竞态**（旧请求忽略或 `preset` 序列号）。  

</code_context>

<deferred>
## Deferred Ideas

- 用户自定义 prompt、多语言一句、切换模型 — backlog / 后续版本。  
- 要求「保存前必须 AI 成功」— **与 EXPORT-07 冲突**，不纳入本阶段。  

</deferred>

---

*Phase: 03-ai*  
*Context gathered: 2025-03-21*
