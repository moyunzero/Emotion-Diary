# VERIFICATION：Dashboard 筛选条 sticky 化，修复滚动后下拉错位

## 验证目标

- 「未处理 (N) + 筛选按钮」从 `FlashList.ListHeaderComponent` 抽出后，按钮屏幕坐标稳定，点击下拉始终以按钮实际位置为锚点。
- 即使 `measure()` 在极端情况下返回异常 `pageY`，下拉菜单也不会与顶部固定 header 重叠。
- 其余既有行为（展开/收起情绪预报、**用户开始拖拽列表时**收起下拉、点 backdrop 关闭、列表加载）不变；惯性滚动期间不再误关下拉。

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | ✅ Pass（Done in 2.34s） |
| ESLint | `yarn lint` | ✅ Pass（仅 boundaries 插件版本 warning，与本次无关） |
| 治理规则 | `yarn verify:governance` | 未执行（CI push 到 master 时校验，本次为本地改动） |
| 手工验证 | 模拟器/真机回归 | 未执行（需用户在设备上跑） |

## 行为验证

- [x] 正常路径：筛选按钮已从 `ListHeaderComponent` 抽出，渲染在 `styles.header` 下方、`FlashList` 上方；按钮 `measure()` 不再随列表滚动漂移。
- [x] 异常路径：`calculateDropdownPosition` 追加 `minTop` 护栏（`STICKY_HEADER_TOP_GUARD = 88dp`），即便上翻分支或 `measure()` 异常也不会与顶部 header 重叠。
- [ ] 数据持久化：无相关改动。
- [ ] 云端同步：无相关改动。
- [ ] Web / iOS / Android 差异：未在三端实测；改动仅涉及布局结构和绝对定位，无新增原生依赖，预期表现一致。

## 未验证项

- iOS / Android / Web 三端真机回归（需用户执行）。
- 横竖屏切换后下拉位置（`onLayout` 兜底已保留，但未实测）。
- 极窄屏（`WIDE_BREAKPOINT` 分支以下）下拉宽度计算 — 未触及该逻辑，理论上不受影响。
- 当用户调整系统字号导致 `styles.header` 实际高度超过 88dp 时，护栏常量需重新评估（已在 `STICKY_HEADER_TOP_GUARD` 注释中标注「调整 header 字号/padding 必须同步更新本常量」）。

## 剩余风险

- **护栏常量耦合**：`STICKY_HEADER_TOP_GUARD = 88` 是基于当前 `styles.header`（`paddingTop = sm(8) + title 行高 33.6 + xs(4) + subtitle 行高 16.8 + paddingBottom = xxl(24)`）的静态估算。若后续调整 header 字号或 padding，下拉护栏不会自动跟随。
  - **缓解**：改动点写有醒目注释；后续如要彻底解耦，可改为 `onLayout` 测 header 实际高度并存 state，但本次范围内不做（避免引入新的 useMemo 链路）。
- **engineering-quality §2 Dashboard 重渲染**：本次只做结构抽离，未触及 `useMemo` 依赖。`useShallow` + 现有 selector 不变，预期重渲染次数不增不减。

## 文档更新记录

- `openspec/changes/001-dashboard-filter-sticky/SPEC.md`：任务规格（自 `.planning/ssd` 迁入并路径对齐）。
- `openspec/changes/001-dashboard-filter-sticky/PLAN.md`：实施步骤。
- `openspec/changes/001-dashboard-filter-sticky/VERIFICATION.md`：本文件。
- 补充：`FlashList` 由 `onScroll` 改为 `onScrollBeginDrag` 关闭筛选下拉，修复「列表仍在惯性滑动时点筛选会立刻自动关闭」。
- `openspec/engineering-quality.md` §2：**未更新**，本次改动不引入新风险，且与 Dashboard 性能项独立。
- `openspec/engineering-quality.md` §1：未更新（无新约定）。
