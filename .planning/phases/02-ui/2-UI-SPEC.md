# Phase 2 UI 设计契约（回顾导出）

**Status:** Locked for `/gsd-execute-phase 2`  
**来源:** `.planning/phases/02-ui/2-CONTEXT.md`、`PROJECT.md` 导出版式契约

## 1. 屏幕与导航

| 项 | 约定 |
|----|------|
| 路由 | `app/review-export.tsx`，路径 **`/review-export`**（`router.push('/review-export')`） |
| 容器 | 全屏；顶部 **返回**（`router.back()`）；**不出现** Tab 栏 |
| 主按钮 | 文案 **`保存到相册`**（唯一对外动作；无「分享」） |

## 2. 时间预设

| 预设 | 默认选中 |
|------|----------|
| 本周 / 本月 / 上周 / 上月 | **本月** |

切换预设时重算统计与预览；不做自定义日期（backlog）。

## 3. 画布区块（自上而下，与成片一致）

1. **页眉**：中文日期范围（如 `2025年3月1日～3月31日`）+ **陪伴焚语第 N 天**（`calculateDaysAsOf(user.firstEntryDate, endMs)`）。
2. **解决率区**：大数字 **本期解决率 %** + **环比**（↑/↓ + 百分点 vs 上一同期，文案格式由 UI 定，须可读）+ 小字 **本期共记录 X 笔，已和解 Y 笔**。
3. **趋势区（EXPORT-04）**：优先用 `getMonthlyResolutionRateSeries` + `react-native-svg` 简易图；若砍 scope 则 **灰底占位 +「趋势图即将完善」**，数据仍传入组件便于后续换皮。
4. **Top3 天气**：图标 + 档位中文名 + 天数（与 `reviewStatsWeather` / 洞察映射一致）。
5. **Top3 触发器**：名称 + 次数 + `getTopTriggersWithAdvice` 的园艺短句。
6. **一句总结**：Phase 2 **非 AI 占位**（温柔 1～2 句），带可区分前缀或小字「预览文案」；**不调用 Groq**。

## 4. 视觉

- 字体：**Lato**（`Lato_400Regular` / `Lato_700Bold`），与洞察一致。
- 色板：复用 **`components/Insights/constants.ts`** 中 **`INSIGHTS_COLORS`**（粉绿治愈系）。
- 预览根视图：`collapsable={false}`（Android）；截图目标与预览为 **同一子树**。

## 5. 交互与状态

- 保存前：**首次**点「保存到相册」前 **Alert 或 Modal**（图含情绪信息、保存后相册可见）；可选「不再提示」→ `AsyncStorage` 键 **`review_export_privacy_ack_v1`**。
- 截图/写入过程：**ActivityIndicator**，可用 `InteractionManager.runAfterInteractions` 包裹 capture。

## 6. 显式不包含

- 系统 **`Share` API**、`expo-sharing`、第三方 App 跳转。
- 真实 AI 一句（Phase 3）。

---

*Phase: 02-ui*
