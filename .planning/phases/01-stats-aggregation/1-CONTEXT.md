# Phase 1: 统计与聚合基础 - Context

**Gathered:** 2025-03-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只交付 **可测试的统计与聚合层**：在明确时间范围内，从 `MoodEntry[]` 与 `User`（含 `firstEntryDate`）算出导出图所需的数字（解决率、环比、Top 天气、Top 触发器、陪伴天数等）。**不包含** UI 布局、截图导出、AI 文案生成（属 Phase 2+）。

讨论澄清的是 **口径与规则**，不扩大需求范围。

</domain>

<decisions>
## Implementation Decisions

### 时间范围（周 / 月）

- **D-01（月）**：采用 **设备本地时区** 的 **自然月**：`[当月1日 00:00:00.000, 当月最后一日 23:59:59.999]`。
- **D-02（周）**：采用与 `components/Insights/utils.tsx` 中 `getWeekDates()` **一致的「周一至周日」自然周**（周一起算）。导出预设「本周」时，范围为 **本周一 00:00:00 至本周日 23:59:59**（本地时区）。
- **D-03（API 形状）**：统计模块对外接受 **`startMs` / `endMs`（闭区间端点）** 或 `Date` 对，由上层（Phase 2）把「周/月」翻译成具体边界，避免统计层写死「当前周」。

### 记录笔数、已和解、解决率（周期内）

- **D-04（集合）**：周期内 **记录笔数** = `timestamp ∈ [startMs, endMs]` 的条目数量；**包含** `ACTIVE` / `RESOLVED` / `PROCESSING` / `BURNED` 等所有未物理删除的条目（与「共记录 X 笔」口语一致）。
- **D-05（已和解）**：周期内 **已和解笔数** = 同上时间窗口内 `status === Status.RESOLVED` 的条目数。
- **D-06（解决率）**：**本期解决率** = `resolvedInPeriod / totalInPeriod`（`totalInPeriod === 0` 时返回 0 或 `null`，由调用方决定展示「暂无数据」）。
- **D-07（与现有洞察页的差异）**：当前 `components/Insights/index.tsx` 中 `HealingProgress` 使用的是 **全库** `total` / `resolved`，**不能**直接复用该对象作为周期统计。周期统计必须在 Phase 1 **新建纯函数或独立 selector**，并在单测中写清与洞察全量卡片的区别。

### 环比（vs 上期）

- **D-08（月）**：与 **上一自然月** 对比（本地时区）。例：2025-03 对比 2025-02。
- **D-09（周）**：与 **紧邻的上一完整自然周**（周一至周日）对比。
- **D-10（指标）**：环比字段为 **解决率差值（百分点或百分比差）**，与产品示例「↑12% vs 上月」一致；具体展示格式由 Phase 2 UI 决定，统计层输出 **本期率、上期率、差值** 即可。

### 「陪伴焚语第 N 天」

- **D-11（数据源）**：与 `services/companionDaysService.ts` 一致，以 `User.firstEntryDate`（或游客同源字段）为起点。
- **D-12（截止日）**：导出图上的 **N** 表示 **截至统计周期末日（endMs 所在日的结束时刻）** 的陪伴天数，而不是「今天打开 App」的实时值（避免用户在同一张三月回顾图上看到与首页差几天的困惑）。需新增或封装 **`calculateDaysAsOf(firstEntryDate, asOfMs)`**（逻辑与 `calculateDays` 相同，但用 `asOfMs` 替代 `Date.now()`）。
- **D-13（无开始日）**：`firstEntryDate` 缺失时，N 为 `0` 或隐藏该段（Phase 2 展示），统计层返回可区分类型。

### Top 3「情绪气象站天气」（按「天」计）

- **D-14（每日代表值）**：与 `WeeklyMoodWeather` 一致：对每个自然日，取当日所有条目中 **`moodLevel` 的最大值** 作为该日代表等级；若当日无记录则该日不参与天气统计。
- **D-15（档位合并为四类）**：将代表 `moodLevel` 映射到四类，与气象站文案对齐，便于展示「晴朗 / 多云 / 有雨 / 暴风雨」：
  - `1` → `sunny`（晴朗）
  - `2` → `cloudy`（多云）
  - `3` → `rainy`（有雨）
  - `4` 或 `5` → `stormy`（暴风雨/雷暴）
- **D-16（计数单位）**：**Top 3** 按 **「出现天数」** 降序；并列时可用 **更高平均强度** 或 **字典序** 作为 tie-break（实现时选一种，写入注释）。
- **D-17（图标）**：与 `constants.MOOD_CONFIG` / `getMoodWeatherIcon` 所用图标体系一致，避免导出图与洞察页两套图标语义。

### Top 3 情绪触发器 + 园艺建议

- **D-18（统计口径）**：与 `TriggerInsight` 一致：在周期内条目上，对每个 `triggers[]` 标签计数，按 **出现次数** 降序取前 3。
- **D-19（园艺建议）**：文案来源优先复用 `components/Insights/constants.ts` 中的 `TRIGGER_ADVICE`（及「其他」兜底），保证与洞察页语气一致；若周期内无触发器，返回空数组。

### Claude's Discretion

- 单元测试文件路径与 `describe` 命名。
- 是否在统计包中同时导出「原始列表 + 聚合结果」的中间结构。
- `totalInPeriod === 0` 时环比是否返回 `null` 或 `(0, 0, 0)` 的约定。

</decisions>

<specifics>
## Specific Ideas

- 用户强调导出图要有 **「可拿走、可分享」** 的价值；统计数字必须与 **回顾图契约**（`.planning/PROJECT.md`）一致，避免图上数字与洞察页全量卡片混淆。
- 环比示例：**「本月解决率 68%（↑12% vs 上月）」** —— 统计层输出本期/上期/差值即可。

</specifics>

<canonical_refs>
## Canonical References

### 规划与需求

- `.planning/PROJECT.md` — 导出版式契约、图片优先、AI 一句属后续阶段  
- `.planning/REQUIREMENTS.md` — `ENG-01`、`EXPORT-*` 数据面前提  
- `.planning/ROADMAP.md` — Phase 1 成功标准  

### 代码与类型（实现前必读）

- `types.ts` — `MoodEntry`、`Status`、`MoodLevel`  
- `constants.ts` — `MOOD_CONFIG`（情绪等级与天气图标）  
- `services/companionDaysService.ts` — `calculateDays`、`formatStartDate`  
- `components/Insights/utils.tsx` — `getWeekDates`、`getMoodWeatherIcon`、每日 `max moodLevel` 模式  
- `components/Insights/index.tsx` — 现有「全量」治愈统计（**勿**误作周期统计）  
- `components/Insights/TriggerInsight.tsx` — Top 触发器计数逻辑  
- `store/modules/weather.ts` — `WeatherState['condition']` 四类命名（与 D-15 映射区分：此处为 **聚合态**，导出为 **按日 max level 映射四类**）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `WeeklyMoodWeather` / `getWeekDates`：**周边界与「每日最高 mood」** 算法可抽取为共享纯函数。  
- `TriggerInsight`：**触发器计数 + 排序 + Top3** 可抽取为 `aggregateTriggers(entries, range)`。  
- `companionDaysService.calculateDays`：扩展为 **`calculateDaysAsOf`** 复用同一套「至少 1 天」规则。  

### Established Patterns

- 洞察页大量使用 `useMemo` + 单次遍历；统计层建议 **纯函数 + 单元测试**，便于与 Zustand 解耦。  
- `Status.RESOLVED` 为「已和解」唯一判定，与 `EntryCard` 文案一致。  

### Integration Points

- Phase 2 从 `useAppStore.getState().entries`（或传入数组）调用统计函数；**不要求** Phase 1 改 store 形状。  
- `firstEntryDate` 读写路径已与游客/登录用户并存（见 `CompanionDaysCard`），统计层只 **读取** `User`。

</code_context>

<deferred>
## Deferred Ideas

- **PDF 导出** — Phase 2 后置 / `REQUIREMENTS` v2。  
- **趋势折线图/柱状图数据** — `EXPORT-04` 可部分在 Phase 4；Phase 1 可输出 **按月解决率序列** 供后续消费。  
- **resolvedAt 与创建日跨月** 的复杂归因 — 当前采用 **创建日落在周期内** 的简单口径（D-04/D-05）；若未来要「和解发生月」单独统计，需新需求与新版位。  

</deferred>

---

*Phase: 01-stats-aggregation*  
*Context gathered: 2025-03-21*
