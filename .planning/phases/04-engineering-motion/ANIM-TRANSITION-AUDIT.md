# 动画与转场审计（Phase 04-02）

本文件记录 **Emotion-Diary** 中与动效、列表滚动、路由相关的可改进点，按优先级排序。**本阶段不引入** Reanimated 新架构，仅做可验证的小优化。

## 审计项

| ID | 区域 | 现象 / 风险 | 建议 | 优先级 |
|----|------|-------------|------|--------|
| **ANIM-01** | 回顾导出 `ReviewExportScreen` | 外层 `ScrollView` 未统一处理「键盘与轻触」时，未来若加入输入框可能抢焦点 | 已设置 `keyboardShouldPersistTaps="handled"`，与 `ScreenContainer` 行为对齐 | P1（已落地） |
| **ANIM-02** | `ScreenContainer` + 洞察页 `Insights` | 长列表子树在部分机型上过度绘制，但全局默认开启会带来裁剪风险 | `ScreenContainer` 改为受控 `removeClippedSubviews`；仅 `Insights` 传 `true` | P1（已落地） |
| **ANIM-03** | Tab / Stack 路由 | 未统一 `animation` 时长，深浅栈切换体感可能不一致 | 在 `app/_layout` 系列中按需显式 `animationDuration` 或与主题联动（后续里程碑） | P2 |
| **ANIM-04** | 洞察 `Insights` 长页 | 多块卡片连续布局，`LayoutAnimation` 使用点分散时易不同步 | 抽「区块入场」约定或统一用 `ScrollView` 子项 `key` 策略（后续） | P2 |

## 本阶段已选方案说明

- **月份标签**：回顾图趋势区在柱图下方使用 **等分 `Text` 行** 展示 `M月`，避免与 RN-SVG `Text` 字体栈不一致；窄屏下以 `flex:1` + `minWidth:0` + 小号字体防溢出。
- **键盘**：回顾页独立 `ScrollView` 与 `ScreenContainer` 内层 `ScrollView` 均使用 `keyboardShouldPersistTaps="handled"`，避免重复手势冲突。
- **滚动裁剪**：`removeClippedSubviews` 改为容器可控参数，首批仅在 `Insights` 长页启用，降低全局副作用。
