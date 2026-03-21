# Roadmap: 焚语 — 情绪回顾图 & 工程/上架

## Overview

在棕地代码上先建立 **可测试的统计与聚合层**，再实现 **符合契约的回顾图片**（**保存到系统相册**与隐私提示；v1 不接系统分享/第三方），随后接入 **一句 AI 温柔总结与兜底**，接着做 **动效与架构收敛**，最后完成 **Apple App Store** 提交相关项。主轴始终是 **可维护、可验证**，导出功能是本轮用户价值最高点。

## Phases

- [x] **Phase 1: 统计与聚合基础** — 周/月范围、解决率与环比、记录/和解笔数、Top 天气与 Top 触发器、陪伴天数数据源统一（见 `phases/01-stats-aggregation/1-VERIFICATION.md`）
- [x] **Phase 2: 回顾图 UI + 图片导出** — 版式契约、view-shot（或等价方案）、**保存到相册**、导出前隐私提示（见 `phases/02-ui/2-VERIFICATION.md`）
- [x] **Phase 3: AI 温柔一句** — Groq 集成与语气约束、失败兜底、与导出流水线顺序（见 `phases/03-ai/3-UAT.md`，真机 1 项待测）
- [x] **Phase 4: 工程与动效** — 增量去冗余、趋势区月份标签、动效审计清单与棕地优化（见 `phases/04-engineering-motion/4-VERIFICATION.md`）
- [x] **Phase 5: Apple 上架** — 隐私与元数据、截图与描述、提审清单闭环
- [ ] **Phase 6: 治理基线与门禁** — 建立治理脚手架、渐进门禁策略与关键路径一致性护栏
- [ ] **Phase 7: Shared 重复逻辑收敛** — 响应式/时间/格式化逻辑单一来源化并提供兼容层
- [ ] **Phase 8: 大文件拆分与结构重构** — `profile` 与 `store` 切分落位且外部行为/API 不回归
- [ ] **Phase 9: 目录边界治理与冗余清理** — 依赖边界可执行化、死代码清理并双端验证
- [ ] **Phase 10: 测试治理与 CI 收口** — 测试集提纯、目录对齐、分层 CI 稳定落地

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
- [ ] 06-02-PLAN.md — 落地 report/warn/error 渐进门禁与升级条件  
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

**Plans**: TBD

---

### Phase 8: 大文件拆分与结构重构

**Goal**: 关键大文件按职责拆分并降低复杂度，同时保持用户行为和对外 API 兼容。  
**Depends on**: Phase 7  
**Requirements**: ARC-01, ARC-02, ARC-03

**Success Criteria**:

1. `app/profile.tsx` 完成壳层化后，用户在个人页的核心交互与显示无变化。  
2. `store/useAppStore.ts` 完成首批 slice 化后，外部调用方式保持兼容且核心流程可正常运行。  
3. 500+ 行核心组件拆分后通过回归验证，用户侧未出现功能缺失或行为漂移。

**Plans**: TBD

---

### Phase 9: 目录边界治理与冗余清理

**Goal**: 目录边界规则可执行、依赖关系可控，且高置信冗余代码被安全移除。  
**Depends on**: Phase 8  
**Requirements**: CLN-01, CLN-02, CLN-03

**Success Criteria**:

1. 新增代码不再出现跨层越界与循环依赖，边界检查可在本地与 CI 复现。  
2. 高置信死代码已移除并保留删除证据/回滚点，仓库噪音显著下降。  
3. 清理后通过 iOS/Android smoke 与关键路径验证，无动态引用误删导致的运行问题。

**Plans**: TBD

---

### Phase 10: 测试治理与 CI 收口

**Goal**: 测试体系围绕关键路径稳定运行，CI 在速度与风险控制之间达成平衡。  
**Depends on**: Phase 9  
**Requirements**: TST-01, TST-02, TST-03

**Success Criteria**:

1. 示例/低价值/重复测试已清理，关键路径测试集可稳定覆盖核心用户流程。  
2. 测试目录与代码边界一致，开发者可以快速定位失败归属模块。  
3. CI 分层门禁稳定运行，PR 阶段与进阶阶段职责清晰且反馈可操作。

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
|6. 治理基线与门禁|0/0|Not started|-|
|7. Shared 重复逻辑收敛|0/0|Not started|-|
|8. 大文件拆分与结构重构|0/0|Not started|-|
|9. 目录边界治理与冗余清理|0/0|Not started|-|
|10. 测试治理与 CI 收口|0/0|Not started|-|

---
Roadmap created: 2025-03-21
