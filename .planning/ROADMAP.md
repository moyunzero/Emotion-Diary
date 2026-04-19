# Roadmap: 心晴MO — 情绪回顾图 & 工程/上架

## Overview

在棕地代码上先建立 **可测试的统计与聚合层**，再实现 **符合契约的回顾图片**（**保存到系统相册**与隐私提示；v1 不接系统分享/第三方），随后接入 **一句 AI 温柔总结与兜底**，接着做 **动效与架构收敛**，最后完成 **Apple App Store** 提交相关项。主轴始终是 **可维护、可验证**，导出功能是本轮用户价值最高点。

**Milestone v1.2（Phase 11–15）**：在 Phases 1–10 已完成基础上，推进 **GitHub 公开就绪**、**代码与测试集健康**、**RN 约定与中文注释**、**非模版化 UI** 抽检，以及 **页面壳与顶栏令牌**。  

**Milestone v1.3（Phase 16）**：**文档与元数据对齐** — README、相关文档、App 上架元数据与当前代码逻辑及对外应用名 **心晴MO** 一致。  
**Milestone v1.4（Phase 17–20）**：围绕 `SMP-01/02/04/06` 做“极简差异化体验”增量交付：隐私轻面板、3 步极速记录、温和本地提醒、叙事卡片 2.0。

## Phases

- [x] **Phase 1: 统计与聚合基础** — 周/月范围、解决率与环比、记录/和解笔数、Top 天气与 Top 触发器、陪伴天数数据源统一（见 `phases/01-stats-aggregation/1-VERIFICATION.md`）
- [x] **Phase 2: 回顾图 UI + 图片导出** — 版式契约、view-shot（或等价方案）、**保存到相册**、导出前隐私提示（见 `phases/02-ui/2-VERIFICATION.md`）
- [x] **Phase 3: AI 温柔一句** — Groq 集成与语气约束、失败兜底、与导出流水线顺序（见 `phases/03-ai/3-UAT.md`，真机 1 项待测）
- [x] **Phase 4: 工程与动效** — 增量去冗余、趋势区月份标签、动效审计清单与棕地优化（见 `phases/04-engineering-motion/4-VERIFICATION.md`）
- [x] **Phase 5: Apple 上架** — 隐私与元数据、截图与描述、提审清单闭环
- [x] **Phase 6: 治理基线与门禁** — 建立治理脚手架、渐进门禁策略与关键路径一致性护栏 (completed 2026-03-21，见 `phases/06-governance-baseline-gates/06-VERIFICATION.md`)
- [x] **Phase 7: Shared 重复逻辑收敛** — 响应式/时间/格式化逻辑单一来源化并提供兼容层 (completed 2026-03-21，见 `phases/07-shared/07-VERIFICATION.md`)
- [x] **Phase 8: 大文件拆分与结构重构** — `profile` 与 `store` 切分落位且外部行为/API 不回归 (completed 2026-03-22)
- [x] **Phase 9: 目录边界治理与冗余清理** — 依赖边界可执行化、死代码清理并双端验证 (completed 2026-03-22)
- [x] **Phase 10: 测试治理与 CI 收口** — 测试集提纯、目录对齐、分层 CI 稳定落地 (completed 2026-03-22)

## Phase Details

### Phase 1: 统计与聚合基础

**Goal**: 所有导出所需数字可从一个清晰的数据层算出，并具备单元测试。  
**Depends on**: Nothing（棕地已有 `MoodEntry` 等）  
**Requirements**: ENG-01,（为 Phase 2 铺垫 EXPORT-01～03、05～06 的数据面）  

**Success Criteria**:

1. 给定时间范围，可得到：记录笔数、和解笔数、解决率、环比对比所需的上期数据。  
2. 可得到 Top 3 天气档位与天数、Top 3 触发器（与现有枚举/映射一致）。  
3. 「陪伴第 N 天」与现有逻辑一致，无重复计算路径。

**Plans**: 已完成（`/gsd-execute-phase 1`）

Plans:

- [x] 01-01: 定义回顾统计纯函数/API 边界与类型  
- [x] 01-02: 实现周/月聚合与单元测试  
- [x] 01-03: Top 天气 / Top 触发器与陪伴天数对接 store  

---

### Phase 2: 回顾图 UI + 图片导出

**Goal**: 用户可见完整「导出版式契约」预览并 **导出为图片、默认保存到系统相册**（v1 不接入系统分享/第三方）。  
**Depends on**: Phase 1  
**Requirements**: EXPORT-01～03, EXPORT-05～06, EXPORT-08, EXPORT-04（占位或简易图可选）  

**Success Criteria**:

1. 预览与最终图一致包含：页眉（范围+陪伴天数）、解决率大数字+环比、笔数小字、Top3 天气、Top3 触发器+园艺建议。  
2. **iOS/Android** 上可 **保存到相册**；导出前有明确隐私提示。  
3. 长图生成在合理数据量下可接受（无明显长时间卡死）。

**Plans**: 已完成（`/gsd-execute-phase 2`）  

Plans:

- [x] 02-01: 预设范围、路由、`ReviewExport` 画布与洞察 CTA（见 `phases/02-ui/02-01-PLAN.md`）  
- [x] 02-02: `view-shot` 临时 PNG（`tmpfile`）（见 `02-02-PLAN.md`）  
- [x] 02-03: `expo-media-library`、权限、首次保存隐私（见 `02-03-PLAN.md`）  

---

### Phase 3: AI 温柔一句

**Goal**: 导出图底部「一句话」有稳定质量，失败不毁整张图。  
**Depends on**: Phase 2  
**Requirements**: EXPORT-07  

**Success Criteria**:

1. 有 Key 时生成符合语气约束的一句总结；无 Key/失败时使用兜底文案。  
2. 总结与当期统计数字大致一致（不出现明显事实错误）。  

**Plans**: 已完成（代码）  

Plans:

- [x] 03-01: Prompt/模板与校验（见 `03-01-PLAN.md`）  
- [x] 03-02: 与导出流水线顺序与错误处理（见 `03-02-PLAN.md`）  

---

### Phase 4: 工程与动效

**Goal**: 去冗余、动效收敛、可选趋势图补全；**增量** 优化棕地代码与 **项目结构/格式约定**（非大爆炸重构）。  
**Depends on**: Phase 3  
**Requirements**: ENG-02（含全仓增量优化子集）, ANIM-01, EXPORT-04（若 Phase 2 未做）  

**Success Criteria**:

1. 导出相关代码路径清晰，无主要重复块（**`04-01`**）。  
2. 动效审计清单完成且至少一批问题已修复（**`04-02`**）。  
3. （可选）月趋势图可读性达标或文档化取舍（**`04-02`**）。  
4. **棕地优化清单** + **≥6** 处跨目录增量优化 + **`STRUCTURE.md`** / **`.editorconfig`** 更新（**`04-03`**）。  

**Plans**: 已完成（`04-01` / `04-02` / `04-03`；见 `phases/04-engineering-motion/4-VERIFICATION.md`）  

Plans:

- [x] 04-01: 回顾导出单一派生状态（`04-01-PLAN.md`）  
- [x] 04-02: 趋势区 + 动效审计（`04-02-PLAN.md`）  
- [x] 04-03: 棕地优化与 `.editorconfig` / `STRUCTURE.md`（`04-03-PLAN.md`）  

---

### Phase 5: Apple 上架

**Goal**: App Store 提交流程就绪。  
**Depends on**: Phase 4（或并行准备元数据，但以功能稳定为前提）  
**Requirements**: IOS-01  

**Success Criteria**:

1. 构建与版本号、隐私与导出相关说明一致。  
2. 截图/描述与 `app-store-submission/` 更新就绪。  
3. 提审清单可勾选完成。  

**Plans**: 2 plans  

Plans:

- [x] 05-01-PLAN.md — 对齐中英文元数据主叙事与截图指南（最小可过审包）  
- [x] 05-02-PLAN.md — 完成预检清单闭环、4.3(a) 回复模板与 Roadmap 可追踪入口  
- 目标摘要：将 Phase 5 从“提审材料占位”推进为“可执行提审流程”（文案、截图、审核沟通三线闭环）。

---

### Phase 6: 治理基线与门禁

**Goal**: 重构前后关键用户路径可被持续验证，并具备可渐进收紧的治理门禁。  
**Depends on**: Phase 5  
**Requirements**: GOV-01, GOV-02, GOV-03

**Success Criteria**:

1. 开发者可一键运行治理检查命令并获得一致输出（结构规范/检查命令/执行说明齐备）。  
2. 规则收紧路径在文档中明确，团队可观察当前处于 report/warn/error 哪个阶段。  
3. 用户关键路径（记录、导出、同步）在重构前后表现一致并可被验收护栏持续验证。

**Plans**: 3 plans

Plans:

- [x] 06-01-PLAN.md — 建立治理脚手架与一键执行基线（命令、范围、说明）  
- [x] 06-02-PLAN.md — 落地 report/warn/error 渐进门禁与升级条件  
- [x] 06-03-PLAN.md — 建立记录/导出/同步关键路径一致性护栏与小包验收模板

---

### Phase 7: Shared 重复逻辑收敛

**Goal**: 共享逻辑形成单一来源，减少语义漂移并保持现有行为一致。  
**Depends on**: Phase 6  
**Requirements**: SHR-01, SHR-02, SHR-03

**Success Criteria**:

1. 响应式/时间区间/通用格式化逻辑有唯一入口，旧调用路径仍可通过兼容层稳定运行。  
2. 重复计算迁移后，用户可见结果（数值/显示）与迁移前一致。  
3. shared 关键边界输入具备基础单测，重构后能快速发现语义回归。

**Plans**: 6 plans（执行顺序含依赖：07-01 → 07-04 → 07-02 → 07-05 → 07-03 → 07-06）

Plans:

- [x] 07-01-PLAN.md — formatting 收敛首包：shared 单一来源 + 兼容层与单测基线（SHR-01/02/03）
- [x] 07-04-PLAN.md — formatting 关键页替换（导出/洞察）与最小回归
- [x] 07-02-PLAN.md — time-range 与 preset 单点映射、洞察链路 + 兼容层
- [x] 07-05-PLAN.md — time-range 导出链路独立迁移（可与 07-02 分段回滚）
- [x] 07-03-PLAN.md — responsive 收敛至 shared + `useResponsiveStyles` 适配
- [x] 07-06-PLAN.md — responsive 关键页迁移与断点回归

---

### Phase 8: 大文件拆分与结构重构

**Goal**: 关键大文件按职责拆分并降低复杂度，同时保持用户行为和对外 API 兼容。  
**Depends on**: Phase 7  
**Requirements**: ARC-01, ARC-02, ARC-03

**Success Criteria**:

1. `app/profile.tsx` 完成壳层化后，用户在个人页的核心交互与显示无变化。  
2. `store/useAppStore.ts` 完成首批 slice 化后，外部调用方式保持兼容且核心流程可正常运行。  
3. 500+ 行核心组件拆分后通过回归验证，用户侧未出现功能缺失或行为漂移。

**Plans**: 3 plans

Plans:

- [x] 08-01-PLAN.md — profile 壳层化：`features/profile/` + 三区子区块与 hooks（ARC-01）
- [x] 08-02-PLAN.md — store entries slice：`_loadEntries`/`_saveEntries` 单点 + Slices Pattern（ARC-02）
- [x] 08-03-PLAN.md — `EditEntryModal` 目录化拆分 + `@/components/entries` 迁移（ARC-03）

---

### Phase 9: 目录边界治理与冗余清理

**Goal**: 目录边界规则可执行、依赖关系可控，且高置信冗余代码被安全移除。  
**Depends on**: Phase 8  
**Requirements**: CLN-01, CLN-02, CLN-03

**Success Criteria**:

1. 新增代码不再出现跨层越界与循环依赖，边界检查可在本地与 CI 复现。  
2. 高置信死代码已移除并保留删除证据/回滚点，仓库噪音显著下降。  
3. 清理后通过 iOS/Android smoke 与关键路径验证，无动态引用误删导致的运行问题。

**Plans**: 5 plans（执行顺序 D-05：09-01 → 09-04 → 09-03 → 09-02 → 09-05）

Plans:

- [x] 09-01-PLAN.md — 扩展 scope（features/shared）、depcruise/knip/boundaries 配置、三项规则升 error（CLN-01）
- [x] 09-02-PLAN.md — 删除 reviewStatsTimeRange 薄适配器，迁移至 shared/time-range（CLN-02）
- [x] 09-03-PLAN.md — 删除 dateUtils deprecated（formatDateChinese/formatDateShort），迁移至 shared/formatting（CLN-02）
- [x] 09-04-PLAN.md — 删除 responsiveUtils，迁移至 useResponsiveStyles/createResponsiveMetrics（CLN-02）
- [x] 09-05-PLAN.md — 全量验证（verify:governance + smoke + test:unit），更新 VALIDATION（CLN-03）

---

### Phase 10: 测试治理与 CI 收口

**Goal**: 测试体系围绕关键路径稳定运行，CI 在速度与风险控制之间达成平衡。  
**Depends on**: Phase 9  
**Requirements**: TST-01, TST-02, TST-03

**Success Criteria**:

1. 示例/低价值/重复测试已清理，关键路径测试集可稳定覆盖核心用户流程。  
2. 测试目录与代码边界一致，开发者可以快速定位失败归属模块。  
3. CI 分层门禁稳定运行，PR 阶段与进阶阶段职责清晰且反馈可操作。

**Plans**: 3 plans

Plans:

- [x] 10-01-PLAN.md — TST-01：删除示例与重复 time-range 单测，test:ci + governance smoke 回归
- [x] 10-02-PLAN.md — TST-02：`unit/features`、shared/formatting 路径对齐，README 映射与 jest collectCoverageFrom
- [x] 10-03-PLAN.md — TST-03：GitHub Actions 分层（PR lint+test:ci；push main 治理+smoke），Node 20 锁定

### Phase 11: GitHub 仓库与可复现构建

**Goal**: 仓库达到可安全公开的基础：文档、许可与安全说明、无密钥、克隆即可按文档跑通基础命令。  
**Depends on**: Phase 10  
**Requirements**: GH-01, GH-02, GH-03, INT-01, INT-02, INT-03  

**Success Criteria**:

1. README 覆盖：项目简介、环境要求、安装、`typecheck`/`lint`/测试命令、分支与 CI 说明。  
2. 密钥与敏感配置不进入 Git；`.env.example` 与真实变量名对齐。  
3. 新开发者在干净目录按文档可完成安装并跑通文档承诺的最小校验集。

**Plans**:

- [x] 11-01-PLAN.md — INT-01：`typecheck` 脚本 + CI；GH-01：`SECURITY.md` + README 前置开发者区块 + 链接
- [x] 11-02-PLAN.md — GH-03：CONTRIBUTING 对齐；GH-01：`README.en`；INT-02：`.env.example`；GH-02：自检 SUMMARY

### Phase 12: 代码健康、测试精炼与单文件体量

**Goal**: 去除高置信死代码与调试残留；**精简测试集**（删示例/重复/无价值），保留 CI 与关键路径测试；建立大单文件清单并启动拆分。  
**Depends on**: Phase 11  
**Requirements**: QA-01, QA-02, TST2-01, TST2-02, SIZE-01  

**Success Criteria**:

1. knip/治理脚本结果无未解释的回归或已记录豁免。  
2. 删除的测试文件有清单可查；`test:ci` 与 smoke 仍绿。  
3. 超标文件清单写入计划目录，并完成至少一批次拆分或已登记为后续 plan。

**Plans**: `12-01-PLAN.md`（Wave 1 清单/文档/knip 基线）· `12-02-PLAN.md`（QA-02 日志）· `12-03-PLAN.md`（user slice 拆分）· `12-04-PLAN.md`（测试删除审计）

### Phase 13: RN/Expo 约定与中文注释

**Goal**: 配置与目录约定与 RN/Expo 实践对齐并文档化；核心业务链补充中文注释。  
**Depends on**: Phase 12  
**Requirements**: RN-01, RN-02, DOC-01  

**Success Criteria**:

1. `app.json`/Metro/Babel/TS 配置核对结论写入 README 或 codebase 文档。  
2. Expo Router 与 `app/` 约定在贡献说明中可查。  
3. store/features 关键路径中文注释覆盖达到约定阈值（由 plan 量化）。

**Plans**: `13-01-PLAN.md`（RN-01 配置审计 + STACK 索引）· `13-02-PLAN.md`（RN-02 Expo Router 文档 + CONTRIBUTING）· `13-03-PLAN.md`（DOC-01 store/主流程中文注释）

### Phase 14: UI 体验与非模版化

**Goal**: 明确并落实「非通用模版」的视觉与文案原则；关键路径 UI 抽检并形成改进 backlog。  
**Depends on**: Phase 13  
**Requirements**: UI-01, UI-02  

**Success Criteria**:

1. UI-SPEC 或等价文档含差异化原则与反模式列表。  
2. 五关键屏抽检表完成，阻塞项为 0 或已转为明确 follow-up issue/plan。

**Plans**: `14-01-PLAN.md`（`14-UI-SPEC` + CONTRIBUTING 入口）· `14-02-PLAN.md`（`14-UI-AUDIT` 五关键屏）· `14-03-PLAN.md`（待改进收口 + REQUIREMENTS/ROADMAP/SUMMARY）

### Phase 15: 页面壳与顶栏令牌（Screen Shell）

**Goal**: 在 `ScreenContainer` 之上统一栈式顶栏与可选底栏；顶栏尺寸/颜色从设计令牌读取；与 Phase 14「非模版化」区分——壳层只管结构，不统一各屏品牌内容。  
**Depends on**: Phase 14  
**Requirements**: （工程可维护性，见 `15-CONTEXT.md`）  

**Success Criteria**:

1. `StackScreenHeader` / `AppScreenShell` 落地；记一笔、情绪回顾图、资料顶栏复用。  
2. `SCREEN_HEADER_TOKENS` + `useThemeStyles().screenHeader` 为单一来源。  
3. CONTRIBUTING 写明滚动策略（禁止双滚动）。  

**Plans**: `15-01-PLAN.md`（阶段 A）· `15-02-PLAN.md`（阶段 B）

---

### Phase 16: 文档与元数据对齐（v1.3）

**Goal**: README、相关文档、App 上架元数据与当前代码逻辑及对外应用名 **心晴MO** 一致。  
**Depends on**: Phase 15  
**Requirements**: DOC-META-01, DOC-META-02, DOC-META-03, DOC-META-04

**Success Criteria**:

1. README.md 与 README.en.md：应用名称 **心晴MO** 明确、功能列表与实现一致、项目结构与目录实际一致、技术栈版本正确。  
2. CONTRIBUTING、SECURITY 等引用的脚本、路径与当前项目一致。  
3. app-description-zh/en、screenshot-guide 均以 **心晴MO** 为对外应用名表述一致；preflight-checklist、review-response 与 2.3.8/2.1a 修复后状态一致。  
4. 提审资料清单可交叉核对，无过期或矛盾引用。

**Plans**: `16-01-PLAN.md`（README + 相关文档）· `16-02-PLAN.md`（App 上架元数据）— 已完成（2026-03-24）

---

### Phase 17: 隐私轻面板（v1.4）

**Goal**: 用户可在一个最小入口内清楚理解并控制本地存储、云同步与 AI 摘要的数据边界。  
**Depends on**: Phase 16  
**Requirements**: SMP-01

**Success Criteria** (what must be TRUE):

1. 用户在隐私轻面板可一眼看到“本地/云同步/AI 摘要”三类数据边界说明。  
2. 用户可独立开关云同步与 AI 摘要，开关结果立即生效且状态可见。  
3. 用户在离线状态下仍可查看隐私边界信息与当前开关状态，不被强制联网。

**Plans**: 1 plan

Plans:

- [x] 17-01-PLAN.md — 隐私轻面板最小闭环：个人页单入口 + 本地优先独立开关 + 离线补偿同步

---

### Phase 18: 3 步极速记录（v1.4）

**Goal**: 用户能在最短路径内完成高频情绪记录，并在中断后无损恢复。  
**Depends on**: Phase 17  
**Requirements**: SMP-02

**Success Criteria** (what must be TRUE):

1. 用户可通过 3 步流程完成一条情绪记录，常规场景下可在 30 秒内结束。  
2. 用户在记录中途离开后再次进入时，可继续未完成内容而非从头开始。  
3. 用户完成记录后可确认本条记录已持久化（离线优先），不会因网络状态丢失。

**Plans**: 1 plan

Plans:

- [x] 18-01-PLAN.md — 3 步极速记录闭环：三步容器 + 草稿继续/丢弃 + 最终统一校验 + 离线优先保存确认

---

### Phase 19: 温和本地提醒（v1.4）

**Goal**: 用户获得可关闭、低频、非焦虑措辞的本地提醒，且不破坏离线优先体验。  
**Depends on**: Phase 18  
**Requirements**: SMP-04

**Success Criteria** (what must be TRUE):

1. 用户可开启或关闭本地提醒，并可感知当前提醒状态。  
2. 提醒文案保持温和非焦虑语气，不出现惩罚式或施压式表达。  
3. 用户在离线情况下仍能按设定接收本地提醒，关闭后不再收到提醒。

**Plans**: TBD

---

### Phase 20: 叙事卡片 2.0（v1.4）

**Goal**: 用户可导出带有“天气 + 花园”叙事风格的回顾卡片，形成区别于通用统计面板的表达。  
**Depends on**: Phase 19  
**Requirements**: SMP-06

**Success Criteria** (what must be TRUE):

1. 用户导出的回顾卡片保留天气与花园叙事元素，而非纯数字仪表盘风格。  
2. 用户能从导出卡片中读到温柔叙事总结与核心回顾信息的统一表达。  
3. 用户在无 AI 或 AI 失败场景下仍可成功导出完整卡片（含可读兜底内容）。

**Plans**: TBD

---

## Progress

|Phase|Plans Complete|Status|Completed|
|---|---|---|---|
|1. 统计与聚合基础|3/3|Verified|2025-03-21|
|2. 回顾图 UI + 图片导出|3/3|Verified|2025-03-21|
|3. AI 温柔一句|2/2|UAT partial（3/4 自动化）|2025-03-21|
|4. 工程与动效|3/3|Verified|2026-03-21|
|5. Apple 上架|2/2|Complete|2026-03-21|
|6. 治理基线与门禁|3/3|Verified|2026-03-21|
|7. Shared 重复逻辑收敛|6/6|Verified|2026-03-21|
|8. 大文件拆分与结构重构| 3/3 | Complete    | 2026-03-22 |
|9. 目录边界治理与冗余清理| 5/5 | Complete    | 2026-03-22 |
|10. 测试治理与 CI 收口| 3/3 | Complete    | 2026-03-22 |
|11. GitHub 仓库与可复现构建| 2/2 | Complete    | 2026-03-22 |
|12. 代码健康、测试精炼与单文件体量| 0/? | Complete    | 2026-03-22 |
|13. RN/Expo 约定与中文注释| 3/3 | Complete | 2026-03-22 |
|14. UI 体验与非模版化| 3/3 | Complete | 2026-03-22 |
|15. 页面壳与顶栏令牌| 2/2 | Complete | 2026-03-22 |
|16. 文档与元数据对齐| 2/2 | Complete | 2026-03-24 |
|17. 隐私轻面板| 1/1 | Complete    | 2026-04-07 |
|18. 3 步极速记录| 1/1 | Complete   | 2026-04-07 |
|19. 温和本地提醒| 0/0 | Abandoned | - |
|20. 叙事卡片 2.0| 0/0 | Abandoned | - |
|21. 代码质量清理| 0/0 | Not started | - |
|22. 测试修复| 0/0 | Not started | - |

### Phase 21: 代码质量清理 (v1.5)

**Goal**: 清理未使用代码、合并重复导出、修复 lint 警告。  
**Depends on**: Phase 20（abandoned, start fresh）  
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03

**Success Criteria** (what must be TRUE):

1. 未使用导出已移除或记录为合理豁免。  
2. AudioRecorder 等组件的重复导出问题已解决。  
3. lint 警告数显著减少。

**Plans**: TBD

### Phase 22: 测试修复 (v1.5)

**Goal**: 修复 expo-audio mock 问题导致的测试失败。  
**Depends on**: Phase 21  
**Requirements**: CLEAN-04

**Success Criteria** (what must be TRUE):

1. `test:ci` 全部通过，无 expo-audio mock 错误。  
2. 826 个测试保持通过。

**Plans**: TBD

---
Roadmap created: 2025-03-21  
*Phases 11–14 added: 2026-03-22 — milestone v1.2*  
*Phase 15 added: 2026-03-22 — screen shell & header tokens*  
*Phase 16 added: 2026-03-24 — milestone v1.3 docs & metadata alignment*  
*Phases 17–20 added: 2026-04-07 — milestone v1.4 minimal distinctive experience*
*Phase 21–22 added: 2026-04-19 — milestone v1.5 code quality*
