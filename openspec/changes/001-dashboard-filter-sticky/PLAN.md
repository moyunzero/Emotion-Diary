# PLAN：Dashboard 筛选条 sticky 化

## 前置阅读

- [x] `AGENTS.md`
- [x] `openspec/README.md`
- [x] `openspec/engineering-quality.md` §1
- [x] `openspec/engineering-quality.md` §2
- [x] 相关源码：`components/Dashboard.tsx`、`components/WeatherStation.tsx`、`styles/components/Dashboard.styles.ts`、`components/AppScreenShell.tsx`、`components/ScreenContainer.tsx`
- [x] 相关测试：无（Dashboard 没有现存单元/快照测试，CONCERNS H4 已记录组件本体待补）

## 假设

- 项目顶部固定 header（`styles.header`，包含「情绪气象站」标题与图标）位于 `AppScreenShell` 的 `ScreenContainer` 之内、`FlashList` 之外，其高度与样式不变。
- 「未处理 (N) + 筛选按钮」节点（当前 `renderListHeader` 中 `listHeader` 容器）从 list 内抽出到 `FlashList` 之外、`header` 之后，**不会**破坏 `FlashList` 现有 `ListHeaderComponent`（剩余只有 `WeatherStation`）的滚动语义。
- 抽出后筛选按钮屏幕坐标在没有屏幕旋转/键盘弹起的情况下基本固定；保留 `onLayout` 仍能在尺寸变更（如旋转）时刷新 `filterButtonLayout`。
- 顶部固定 header 高度（`styles.header.paddingTop + paddingBottom + 内容`）可用「`insets.top` + 一个 ≈ 64dp 的常量」近似，作为下拉菜单 `top` 的下限护栏；具体常量取自 `styles.header` 的实际竖向占位，无需 `onLayout` 测量整个 header。

## 实施步骤

1. **`components/Dashboard.tsx` 抽出筛选条**
   - 将 `renderListHeader` 内「`listHeader` 容器 + 未处理标题 + 筛选按钮」整段移出，作为 JSX 直接渲染在 `<FlashList>` 之前、顶部 `header` JSX 之后。
   - `renderListHeader` 剩余只保留 `WeatherStation`（保持 `useCallback`/`ListHeaderComponent` 现状，以免触发列表重渲染策略变化）。
   - 不改变 `filterButtonRef`、`isFilterOpen`、`isUnprocessedStatus` 等现有变量与回调；它们随 `Dashboard` 顶层渲染。
   - **验证：** 视觉上筛选条不再随列表滚动；`FlashList` 仍正常显示空态、加载更多、刷新。

2. **`components/Dashboard.tsx` 简化按钮 measure 时机**
   - 现有 `handleFilterButtonPress` 中的 `measure()` 保留作为关闭/旋转后的兜底，但因为按钮已稳定，下拉位置主要依赖一次 `onLayout` 后缓存的 `filterButtonLayout`，行为不变；不改造该回调结构以缩小 diff。
   - **验证：** `measure` 路径仍能在异常情况下刷新坐标；点击按钮的 60Hz 帧内行为不变。

3. **`components/Dashboard.tsx` 加 header 避让护栏**
   - 在 `calculateDropdownPosition` 内新增一个常量 `HEADER_GUARD_TOP = insets.top + <stickyHeaderTotalHeight>`，将 `top` 与该护栏取 `Math.max`，保证下拉不进入固定 header。
   - 常量来源：`styles.header` 的 `paddingTop + paddingBottom + 标题行高`，本次直接以一个保守值（如 56dp）作为常量在 Dashboard 内定义，并配中文注释解释来源（避免把样式细节硬绑到样式文件外）。
   - **验证：** 在「滑到列表顶部」「滑到中部」「滑到底部」三种状态点击按钮，下拉始终不与「情绪气象站」标题重叠。

4. **`styles/components/Dashboard.styles.ts` 适配**
   - 给 `listHeader` 增加 `backgroundColor: COLORS.background.page`（或当前主题的页面背景色，沿用同文件已有 `COLORS` 引用），原因：抽出后它紧贴顶部 header，下方是 `FlashList`，需要不透明背景，避免列表内容滚动时透过 header 区域闪烁。
   - 保留现有 `marginBottom` 不变（或视实际间距微调一档），不动其它样式。
   - **验证：** 列表 fast-scroll 时筛选条下方无内容穿透。

5. **回归走查**
   - 手动验证：
     - 「情绪预报」展开 → 上滑 → 点筛选 → 下拉位置正常；
     - 直接点筛选 → 下拉位置正常；
     - 已展开下拉再**开始拖拽**列表 → 下拉关闭（勿用 `onScroll`，惯性滚动会持续触发导致误关）；
     - 已展开下拉再次点击按钮 → 切换关闭。
   - `yarn typecheck` / `yarn lint` 全绿。
   - **验证：** 上述四条全部通过即结束。

## 风险与回滚

- **风险：**
  1. 抽出后 `listHeader` 与上方 `header` 之间的视觉间距可能轻微变化，需要现场核对（间距来自 `header.paddingBottom` + `listHeader.marginBottom`）。
  2. 顶部 header 高度近似常量若与未来某次 header 改版不一致，会让护栏过紧/过松；通过中文注释指明该常量与 `styles.header` 的耦合关系，方便后续维护。
  3. `filterBackdrop` 当前 `zIndex` 与 `filterDropdown` 不变，全屏遮罩范围在抽出后仍覆盖整个 `Dashboard`，行为一致。
- **回滚方式：** 单一提交、单一逻辑分离，`git revert` 即可恢复。

## 文档同步

- [ ] 是否需要更新 README — **否**，无用户文档变化。
- [ ] 是否需要更新 `AGENTS.md` — **否**，未改约束或栈。
- [ ] 是否需要更新 `openspec/engineering-quality.md` §1 — **否**，未引入新约定。
- [ ] 是否需要更新 `openspec/engineering-quality.md` §2 — **可选**：本次顺带消除「FlashList ListHeader 内放交互锚点导致绝对定位错位」这一隐患，可以在 §2「脆弱区」或表格中以一行短注记录该模式禁忌。完成后视改动颗粒度决定是否补充。
- [ ] 是否需要新增 `NOTES.md` — **否**，关键决策已写入本 PLAN 与 SPEC。
