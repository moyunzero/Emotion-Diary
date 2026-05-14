# SPEC：Dashboard 筛选条 sticky 化，修复滚动后下拉错位

## 背景

- **当前问题：** 在「情绪气象站」页面，「未处理 (N) + 筛选按钮」当前与 `WeatherStation` 一起放在 `FlashList` 的 `ListHeaderComponent` 内，会随列表内容滚动。当用户先展开 `WeatherStation` 中的「情绪预报」（局部增高），再向上滑动若干像素，再点击筛选按钮时：
  1. `filterButtonLayout`（按钮在屏幕上的 `pageX/pageY/width/height`）虽然在 `onPress` 内重新 `measure`，但因为按钮所在区域可能已经滚出顶部固定 header（标题 + 操作图标）覆盖范围，`measure` 出的 `pageY - insets.top` 仍是按钮当前真实位置，导致 `calculateDropdownPosition` 算出来的 `top` 落在固定 header 下方甚至与之重叠的区域，下拉菜单视觉上像是「贴在屏幕顶部」、右上对齐错位（截图所示）。
  2. 同时 `filterBackdrop` 是全屏，遮罩盖掉了底下的 `WeatherStation`，给用户「情绪预报被强制收起」的错觉，但实际上 `isForecastExpanded` 是 `WeatherStation` 内部状态，与筛选按钮无关。
- **用户或业务影响：** 高频常用入口（筛选）在「先展开情绪预报后滑动」的常规操作序列下视觉错乱，影响信任感与可用性；用户会误以为是「按钮把预报弹回去了」。
- **相关代码：**
  - `components/Dashboard.tsx`：`renderListHeader`、`measureFilterButton`、`handleFilterButtonPress`、`calculateDropdownPosition`、`FlashList` `onScrollBeginDrag`（关闭下拉；勿用 `onScroll`，否则惯性滚动会持续误关）
  - `components/WeatherStation.tsx`：`isForecastExpanded` 局部状态（用于确认与筛选按钮无耦合）
  - `styles/components/Dashboard.styles.ts`：`listHeader`、`filterDropdown`、`filterBackdrop`
- **相关文档：**
  - `openspec/engineering-quality.md` §1（样式分离、useMemo/useCallback 约定）
  - `openspec/engineering-quality.md` §2（Dashboard 重渲染等性能/风险摘要）

## 目标

- **必须达成：**
  - 「未处理 (N) + 筛选按钮」整段从 `FlashList` 的 `ListHeaderComponent` 抽出，作为顶部 header 下方、`FlashList` 上方的一段**不随列表滚动**的固定区域渲染，按钮屏幕坐标在页面生命周期内基本稳定。
  - 筛选下拉位置计算保留按钮实际几何信息，但**追加一道护栏**：`top` 不得小于「页面顶部固定 header 高度 + 安全间距」，防止任何边界情况下下拉菜单与顶部固定 header 重叠。
  - `WeatherStation`、`FlashList` 内容、空状态、`onRefresh` / `onEndReached` 等现有行为不变。
- **不在本次范围：**
  - 不重构 `WeatherStation` 的展开状态管理。
  - 不调整顶部 header 本身的高度或布局。
  - 不动 `FlashList` 的 `estimatedItemSize`、列表数据流、空状态。
  - 不重写 `useMemo` 依赖（CONCERNS #3 性能问题留待独立任务）。

## 用户行为

- **触发入口：** 「情绪气象站」首页（`app/(tabs)/index.tsx` → `components/Dashboard.tsx`）右上角筛选按钮。
- **期望结果：**
  - 任何滚动位置点击筛选按钮，下拉菜单都以按钮**实际可见位置**为锚点出现，**不与顶部固定 header 重叠**。
  - 滑动列表时筛选按钮位置不动（视觉上吸顶在 header 下方）。
  - 用户**再次开始拖拽**列表时若下拉已打开则关闭（惯性滑动中的被动 `onScroll` 不关闭，避免未停滑时点筛选立刻被关掉）。
- **异常或边界场景：**
  - 极小屏（窄宽）下下拉宽度走 `WIDE_BREAKPOINT`/`WINDOW_PADDING` 分支，不受本次改动影响。
  - 首次进入页面未滚动时点击 — 与现状一致。
  - `WeatherStation` 内「情绪预报」展开/收起 — 不再影响筛选按钮位置（按钮已脱离 list header）。

## 技术约束

- **架构边界：** 仅修改 `components/Dashboard.tsx` 与 `styles/components/Dashboard.styles.ts`，不引入跨层依赖。
- **数据兼容：** 无数据/存储/同步改动。
- **多端要求（Web / iOS / Android）：**
  - iOS / Android：依赖 `useSafeAreaInsets()` 已存在，无新增 native 依赖。
  - Web：`position: 'absolute'` 与 `zIndex` 行为一致；筛选按钮固定后不会落到滚动容器内。
- **安全与隐私：** 无影响。

## 验收标准

- [ ] 复现路径不再错位：「展开情绪预报 → 向上滑 100~300px → 点筛选按钮」，下拉菜单顶部不进入固定 header 区域。
- [ ] 不破坏现有「点击按钮再次切换、点 backdrop 关闭、开始拖拽列表时关闭下拉、横竖屏旋转后位置仍合理」等已有行为。
- [ ] `yarn typecheck` 通过。
- [ ] `yarn lint` 通过。
- [ ] 不引入新的 `any` / `@ts-ignore`。
- [ ] CONVENTIONS（样式分离、useMemo/useCallback、双引号风格）保持。

## 依据

- **产品依据：** 用户报告（截图）。
- **技术依据：**
  - 现状代码：`FlashList.ListHeaderComponent` 内的元素会随列表滚动，因此其 `measure().pageY` 与点击时机强相关；下拉菜单依赖按钮屏幕坐标，缺少「固定 header 避让」护栏。
  - React Native `FlashList` 不像原生 `SectionList`/`UITableView` 那样原生支持 sticky header 的「跨 list header」吸顶；最简洁做法是把这一段提到 `FlashList` 外面。
- **历史决策或风险：** CONCERNS.md #3 指出 Dashboard 的 useMemo 全量依赖，本次仅做结构性抽离，不引入新的 useMemo 链路。
