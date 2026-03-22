---
phase: 13
slug: rn-expo
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-22
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x（Expo 预设） |
| **Config file** | `jest.config.js` / `jest.ci.config.js` |
| **Quick run command** | `yarn typecheck && yarn lint` |
| **Full suite command** | `yarn test:ci` |
| **Estimated runtime** | ~2–5 分钟（视机器） |

---

## Sampling Rate

- **After every task commit:** `yarn typecheck && yarn lint`
- **After every plan wave:** `yarn test:ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 600 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | RN-01 | doc+grep | `rg -q` 审计文件固定标题 | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | RN-01 | doc+grep | `rg` README/STACK 指针 | ✅ | ⬜ pending |
| 13-02-01 | 02 | 2 | RN-02 | doc+grep | `test -f` 路由文档 | ✅ | ⬜ pending |
| 13-02-02 | 02 | 2 | RN-02 | doc+grep | `rg` CONTRIBUTING 链接 | ✅ | ⬜ pending |
| 13-03-01 | 03 | 3 | DOC-01 | manual+rg | `rg` 中文模块头 / 文件计数 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements（Jest/CI 已就位）

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 中文注释可读性 | DOC-01 | 自然语言质量 | 抽检 3 个已改文件：注释是否解释「为何」而非重复代码 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 600s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
