# Phase 3 Research: AI 温柔一句（EXPORT-07）

**Phase:** 3 — AI 温柔一句  
**Mode:** ecosystem + implementation  
**Status:** RESEARCH COMPLETE

## 目标（来自 Roadmap / REQUIREMENTS）

- **EXPORT-07**：导出图底部 **一句话 AI 温柔总结**，语气朋友/树洞/温柔姐姐；**无 API Key 或失败** 时有可读兜底，**不阻断**导出主流程。
- 与当期统计 **大致一致**（避免明显事实错误）。

## Standard Stack

| 能力 | 选型 | 置信度 |
|------|------|--------|
| LLM 推理 | **Groq** OpenAI-compatible `POST /v1/chat/completions` | 高 — 与现有 `utils/aiService.ts` 一致 |
| 模型 | **`llama-3.1-8b-instant`**（与全应用一致） | 高 |
| 鉴权 | **`EXPO_PUBLIC_GROQ_API_KEY`** + `Authorization: Bearer` | 高 — 现有模式 |
| 调用封装 | **复用** `callGroqAPI(systemPrompt, userPrompt, maxTokens)` + **`withRetry`** | 高 — 避免第二套 HTTP |
| 缓存 | 可选：与 `generateEmotionPodcast` 类似，按 `preset + periodKey + entriesVersion` 做短 TTL 内存缓存 | 中 |

**不要**为回顾句单独引入新 SDK（无必要）。

## Architecture Patterns

1. **纯函数/服务层生成文案**  
   - 新增 **`generateReviewExportClosingLine(...)`**（命名可调）放在 **`utils/aiService.ts`**（或 `utils/reviewExportAi.ts` 再 re-export），入参为 **已算好的统计摘要**（数字、Top 天气/触发器文案等），**不要**把整份 `MoodEntry[]` 原文塞进 prompt（隐私与 token）。  
   - 返回 `Promise<string>`；失败时由调用方改用 **固定兜底句**（与 Phase 2 占位语气一致）。

2. **UI 合成顺序**（与 2-CONTEXT / 导出契约一致）  
   - **方案 A（推荐）**：`ReviewExportScreen` 在 `preset`/`entries` 变化时 `useEffect` 拉取一句，经 **`useState`** 传入 `ReviewExportCanvas` 的 `aiClosingLine?: string`。画布 **先** 展示占位/加载中，**再** 替换为 AI 句；无 Key 时 **直接** 兜底，不闪长加载。  
   - **方案 B**：在 `ReviewExportCanvas` 内 `useEffect` 调服务（组件略胖，但单文件闭环）。  
   - 导出截图：须在 **文案就绪后** 再允许用户点「保存到相册」，或 capture 时使用当前 state（避免截到「加载中」）。  

3. **与统计层对齐**  
   - Prompt 只使用 **`utils/reviewStats*.ts` + `getReviewExportPeriods`** 算出的 **结构化摘要**（解决率、笔数、Top3 标签字符串），与图上数字同源，减少「幻觉」。

## Don't Hand-Roll

- **不要**自写 Groq HTTP 客户端 — 使用现有 **`callGroqAPI`**。  
- **不要**在组件内拼裸 `fetch` 到 Groq（重复错误处理、重试、分类）。  
- **不要**无超时地阻塞导出 — 调用应有 **上限**（如 `withRetry` 已限次；可再加 `AbortController` 或 `Promise.race` 超时，产品可定 8–15s）。

## Common Pitfalls

| 风险 | 缓解 |
|------|------|
| 无 Key / 无效 Key | `isApiKeyValid()` 为 false → **直接兜底**，不发请求（与 podcast 一致） |
| 速率限制 | `withRetry` + 对 429 退避；回顾页避免进入屏即疯狂重算（`useMemo` 依赖稳定） |
| 离线 | `isNetworkError` → 兜底；不弹阻断式 Alert |
| 输出过长/多段 | `trim()` + `substring(0, N)`（如 120–200 字），并提示模型「只输出一段」 |
| 语气跑偏 | system prompt 固定：**中文、非客服、朋友/树洞、禁止医疗诊断承诺** |
| 截图含「加载中」 | 主按钮 disabled 或骨架仅在开发期；release 用兜底或上次缓存 |

## Code Examples（指现有代码，非新建）

- **Groq 调用**：`utils/aiService.ts` 中 **`callGroqAPI`**、**`withRetry`**。  
- **无 Key 降级**：**`generateEmotionPodcast`**（`!isApiKeyValid()` → `getDefaultPodcast`）。  
- **统计摘要入参**：可仿 podcast 里 `userPrompt` 拼统计，但改为 **回顾周期闭区间** 与 **`ReviewExportPreset`** 一致。

## 建议的 Prompt 形状（实现时照抄结构）

- **System**：温柔陪伴、中文、第二人称「你」、花园/天气隐喻可选、禁止说教与医疗结论。  
- **User**：结构化 bullet：`周期`、`陪伴天数`、`解决率`、`环比`、`记录/和解笔数`、`Top 天气`、`Top 触发器`（仅名称+次数）。  
- **输出**：「严格只输出一段 80–120 字，不要标题、不要列表」。

## 测试建议

- **单元**：mock `callGroqAPI`，断言无 Key 时返回兜底；有 Key 时返回截断后字符串。  
- **集成**：可选，mock 网络。

## 下游

- 下一步：`/gsd-discuss-phase 3`（可选）→ **`/gsd-plan-phase 3`** 读取本文件与 `2-UI-SPEC.md` 底部一句区。

---

## RESEARCH COMPLETE
