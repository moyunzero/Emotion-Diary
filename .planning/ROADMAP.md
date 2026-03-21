# Roadmap: 焚语 — 情绪回顾图 & 工程/上架

## Overview

在棕地代码上先建立 **可测试的统计与聚合层**，再实现 **符合契约的回顾图片**（含分享与隐私提示），随后接入 **一句 AI 温柔总结与兜底**，接着做 **动效与架构收敛**，最后完成 **Apple App Store** 提交相关项。主轴始终是 **可维护、可验证**，导出功能是本轮用户价值最高点。

## Phases

- [ ] **Phase 1: 统计与聚合基础** — 周/月范围、解决率与环比、记录/和解笔数、Top 天气与 Top 触发器、陪伴天数数据源统一
- [ ] **Phase 2: 回顾图 UI + 图片导出** — 版式契约、view-shot（或等价方案）、相册与分享、导出前隐私提示
- [ ] **Phase 3: AI 温柔一句** — Groq 集成与语气约束、失败兜底、与导出图合成顺序稳定
- [ ] **Phase 4: 工程与动效** — 增量去冗余、可选趋势图、动效审计清单与首批修复
- [ ] **Phase 5: Apple 上架** — 隐私与元数据、截图与描述、提审清单闭环

## Phase Details

### Phase 1: 统计与聚合基础

**Goal**: 所有导出所需数字可从一个清晰的数据层算出，并具备单元测试。  
**Depends on**: Nothing（棕地已有 `MoodEntry` 等）  
**Requirements**: ENG-01,（为 Phase 2 铺垫 EXPORT-01～03、05～06 的数据面）  

**Success Criteria**:

1. 给定时间范围，可得到：记录笔数、和解笔数、解决率、环比对比所需的上期数据。  
2. 可得到 Top 3 天气档位与天数、Top 3 触发器（与现有枚举/映射一致）。  
3. 「陪伴第 N 天」与现有逻辑一致，无重复计算路径。

**Plans**: TBD（`/gsd-plan-phase 1`）

Plans:

- [ ] 01-01: 定义回顾统计纯函数/API 边界与类型  
- [ ] 01-02: 实现周/月聚合与单元测试  
- [ ] 01-03: Top 天气 / Top 触发器与陪伴天数对接 store  

---

### Phase 2: 回顾图 UI + 图片导出

**Goal**: 用户可见完整「导出版式契约」预览并导出图片、可分享。  
**Depends on**: Phase 1  
**Requirements**: EXPORT-01～03, EXPORT-05～06, EXPORT-08, EXPORT-04（占位或简易图可选）  

**Success Criteria**:

1. 预览与最终图一致包含：页眉（范围+陪伴天数）、解决率大数字+环比、笔数小字、Top3 天气、Top3 触发器+园艺建议。  
2. iOS 上可保存/分享；导出前有明确隐私提示。  
3. 长图生成在合理数据量下可接受（无明显长时间卡死）。

**Plans**: TBD  

Plans:

- [ ] 02-01: 回顾卡片布局组件（与设计系统/字体一致）  
- [ ] 02-02: 接入 view-shot 或选定渲染导出链路  
- [ ] 02-03: Share / 相册权限与文案  

---

### Phase 3: AI 温柔一句

**Goal**: 导出图底部「一句话」有稳定质量，失败不毁整张图。  
**Depends on**: Phase 2  
**Requirements**: EXPORT-07  

**Success Criteria**:

1. 有 Key 时生成符合语气约束的一句总结；无 Key/失败时使用兜底文案。  
2. 总结与当期统计数字大致一致（不出现明显事实错误）。  

**Plans**: TBD  

Plans:

- [ ] 03-01: Prompt/模板与校验  
- [ ] 03-02: 与导出流水线顺序与错误处理  

---

### Phase 4: 工程与动效

**Goal**: 去冗余、动效收敛、可选趋势图补全。  
**Depends on**: Phase 3  
**Requirements**: ENG-02, ANIM-01, EXPORT-04（若 Phase 2 未做）  

**Success Criteria**:

1. 导出相关代码路径清晰，无主要重复块。  
2. 动效审计清单完成且至少一批问题已修复。  
3. （可选）月趋势图可用或明确放弃并文档化原因。  

**Plans**: TBD  

---

### Phase 5: Apple 上架

**Goal**: App Store 提交流程就绪。  
**Depends on**: Phase 4（或并行准备元数据，但以功能稳定为前提）  
**Requirements**: IOS-01  

**Success Criteria**:

1. 构建与版本号、隐私与导出相关说明一致。  
2. 截图/描述与 `app-store-submission/` 更新就绪。  
3. 提审清单可勾选完成。  

**Plans**: TBD  

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 统计与聚合基础 | 0/TBD | Not started | - |
| 2. 回顾图 UI + 图片导出 | 0/TBD | Not started | - |
| 3. AI 温柔一句 | 0/TBD | Not started | - |
| 4. 工程与动效 | 0/TBD | Not started | - |
| 5. Apple 上架 | 0/TBD | Not started | - |

---
*Roadmap created: 2025-03-21*
