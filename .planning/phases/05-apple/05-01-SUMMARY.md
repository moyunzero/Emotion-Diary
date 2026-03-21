---
phase: 05-apple
plan: 01
subsystem: docs
tags: [app-store, metadata, ios, localization, review]

requires:
  - phase: 04-engineering-motion
    provides: 导出与洞察主路径已稳定，可用于上架叙事素材
provides:
  - 中英文同构的 App Store 描述（记录情绪 + 回顾导出主叙事）
  - 5 张截图最小可过审包与执行规范
affects: [05-02-plan, app-store-submission, ios-review]

tech-stack:
  added: []
  patterns: [metadata-narrative-alignment, screenshot-to-copy-mapping]

key-files:
  created: [.planning/phases/05-apple/05-01-SUMMARY.md]
  modified:
    - app-store-submission/metadata/app-description-zh.md
    - app-store-submission/metadata/app-description-en.md
    - app-store-submission/metadata/screenshot-guide.md

key-decisions:
  - "中英文描述采用同构信息架构：核心价值 -> 核心场景 -> 隐私与边界。"
  - "截图顺序绑定主链路：记录 -> 回顾导出 -> 相册与隐私 -> 差异化支撑。"

patterns-established:
  - "提审文案首段不以 AI 为主卖点，AI 仅次级出现并要求失败兜底。"
  - "每张截图必须绑定目标信息点、页面来源、真实 UI 元素与禁止项。"

requirements-completed: [IOS-01]
duration: 1 min
completed: 2026-03-21
---

# Phase 5 Plan 01: Apple Metadata Narrative Summary

**App Store 中英文文案已统一为“记录情绪与回顾导出”主叙事，并落地可直接执行的 5 张截图过审方案。**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-21T13:52:42Z
- **Completed:** 2026-03-21T13:53:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- 重写 `app-description-zh.md` 与 `app-description-en.md`，中英文章节顺序一致且语义对齐。
- 明确导出边界为保存到相册，应用内不内置第三方分享；补充隐私提醒与非医疗声明。
- 重排 `screenshot-guide.md` 为 5 张最小可过审包，逐张定义目标信息点、页面来源、UI 要素、短标题与禁止项。

## Task Commits

Each task was committed atomically:

1. **Task 1: 重写中英文描述主叙事** - `1bc9ab8` (feat)
2. **Task 2: 重排截图指南并绑定提审叙事** - `0fdf5ef` (feat)
3. **Task 2 follow-up: 修复 Markdown 格式警告** - `f157f21` (fix)

**Plan metadata:** `9ee3071` (docs)

## Files Created/Modified

- `app-store-submission/metadata/app-description-zh.md` - 中文提审描述重构为审核友好同构结构
- `app-store-submission/metadata/app-description-en.md` - 英文提审描述与中文逐段对齐
- `app-store-submission/metadata/screenshot-guide.md` - 5 张截图执行清单与禁止项规范
- `.planning/phases/05-apple/05-01-SUMMARY.md` - 本计划执行总结

## Decisions Made

- 中英文文案保持同构结构，降低审核理解成本并减少叙事偏差。
- 截图以主价值链路递进，不让次要能力抢占首屏叙事。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 修复 Markdown lint 阻塞项**
- **Found during:** Plan completion checks
- **Issue:** 三个提审元数据文件存在多余空行，触发 `MD012` 警告。
- **Fix:** 删除文件末尾冗余空行，保持文案语义不变。
- **Files modified:** `app-description-zh.md`, `app-description-en.md`, `screenshot-guide.md`
- **Verification:** `ReadLints` 对目标文件返回 `No linter errors found`
- **Committed in:** `f157f21`

---

**Total deviations:** 1 auto-fixed (0 bug, 0 missing critical, 1 blocking)
**Impact on plan:** 偏差仅为格式合规修复，不影响功能范围与验收结论。

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Next Phase Readiness

- 05-01 产物可直接用于 App Store Connect 文案与截图执行。
- 已为 05-02 的预检清单闭环提供可对齐素材基础。

---
*Phase: 05-apple*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-apple/05-01-SUMMARY.md`
- FOUND: `1bc9ab8` task commit
- FOUND: `0fdf5ef` task commit
