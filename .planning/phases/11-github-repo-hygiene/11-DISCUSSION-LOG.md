# Phase 11: GitHub 仓库与可复现构建 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `11-CONTEXT.md`.

**Date:** 2026-03-22  
**Phase:** 11 — GitHub 仓库与可复现构建  
**Areas discussed:** README 结构；SECURITY 文档；GH-03 贡献/准则；typecheck 与最小校验集

---

## 区域 1 — README 结构与受众

| Option | Description | Selected |
|--------|-------------|----------|
| A | 主 README 前置「开发者快速上手」，长功能说明后移或链接到其它文档 | ✓ |
| B | 极简 README，仅链接到外部长文 | |
| C | 维持单文件长 README，不重组 | |

**User's choice:** 用户选择「全部」讨论项；采用会话中推荐的 **A**（D-01～D-03）。  
**Notes:** 保留 `README.en.md`；openspec / codebase 作延伸权威源。

---

## 区域 2 — 安全说明（SECURITY）

| Option | Description | Selected |
|--------|-------------|----------|
| A | 新增根目录 `SECURITY.md`，README 摘要 + 链接 | ✓ |
| B | 仅 README 内嵌安全章节，无独立文件 | |
| C | 仅链到 GitHub 默认安全页面，无仓库内文档 | |

**User's choice:** **A**（D-04～D-06）。  
**Notes:** 修复当前 README → 不存在的 `./SECURITY.md` 断链。

---

## 区域 3 — GH-03 贡献与行为准则

| Option | Description | Selected |
|--------|-------------|----------|
| A | 独立 CONTRIBUTING + COC，README 链出 | ✓ |
| B | 仅 README 章节 | |
| C | 极简「欢迎 Issue」无正式文档 | |

**User's choice:** **A**（D-07～D-09）。  
**Notes:** 仓库已存在 `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`；本阶段以一致性与链接为主。

---

## 区域 4 — 最小校验集与 typecheck

| Option | Description | Selected |
|--------|-------------|----------|
| A | 新增 `yarn typecheck`（`tsc --noEmit`），README 承诺 typecheck + lint + test:ci | ✓ |
| B | 不增加脚本，README 仅承诺 lint + test:ci 并解释无独立 typecheck | |

**User's choice:** **A**（D-10～D-12）。  
**Notes:** 与 ROADMAP / INT-01 中 typecheck 表述对齐。

---

## Claude's Discretion

- `SECURITY.md` 标题级结构与示例措辞（D-04 脚注）。
- README 目录锚点具体命名（D-03 脚注）。

## Deferred Ideas

- Phase 12+ 代码健康与测试精炼；git-secrets 等工具仅作为 GH-02 可选任务。
