---
phase: 10
slug: ci
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.2.0 + ts-jest + react-native preset |
| **Config file** | `jest.config.js`（本地/覆盖率）；`jest.ci.config.js`（CI） |
| **Quick run command** | `yarn test:ci` 或 `yarn test:unit` |
| **Full suite command** | `yarn test`（等同默认 jest） |
| **Estimated runtime** | ~30–60s（视用例数量） |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:ci`（或受影响路径的 `yarn jest <path>`）
- **After every plan wave:** Run `yarn test:release` + `yarn verify:governance -- --dry-run` 或全量执行视门禁级别
- **Before `/gsd-verify-work`:** Full suite `yarn test:ci` + 进阶门禁（governance + smoke）绿
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-* | 10-01 | 1 | TST-01 | unit/integration | `yarn test:ci` | ✅ | ⬜ pending |
| 10-01-* | 10-01 | 1 | TST-01 | smoke | `node scripts/verify-governance-smoke.js` | ✅ | ⬜ pending |
| 10-02-* | 10-02 | 2 | TST-02 | manual/optional | 目录清单检查 | ❌ 可选 W0 | ⬜ pending |
| 10-03-* | 10-03 | 3 | TST-03 | CI | GHA workflow | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/*.yml` — 覆盖 TST-03
- [ ] （可选）`engines` 或 `.nvmrc` — 与 CI `node-version` 对齐
- [ ] 更新 `__tests__/README.md` — 反映 `features/`、`shared/` 映射与 TST-01 删除示例后的结构
- [ ] （可选）对齐 `jest.config.js` `collectCoverageFrom` 含 `features/`、`shared/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TST-02 目录约定可被文档/清单检查 | TST-02 | 无现成自动化 | 人工核对 `__tests__/unit` 与源码 `features/`、`shared/`、`store/` 映射 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
