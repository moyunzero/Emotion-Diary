---
phase: 9
slug: dir-boundary-cleanup
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 |
| **Config file** | jest.config.js, jest.ci.config.js |
| **Quick run command** | `yarn test:unit __tests__/unit/utils/ __tests__/unit/shared/` |
| **Full suite command** | `yarn test:unit` |
| **Governance command** | `npm run verify:governance` |
| **Smoke command** | `node scripts/verify-governance-smoke.js` |
| **Estimated runtime** | ~30s unit + ~10s governance |

---

## Sampling Rate

- **After every task commit:** Run affected unit tests + `npm run verify:governance`
- **After every plan wave:** Run `yarn test:unit` + full governance + smoke
- **Before `/gsd-verify-work`:** verify:governance 全绿 + 关键路径 smoke 通过
- **Max feedback latency:** 60 seconds

---

## Per-Plan Verification Map

| Plan | Wave | Requirement | Test Type | Automated Command | Status |
|------|------|-------------|-----------|-------------------|--------|
| 09-01 | 1 | CLN-01 | integration | `npm run verify:governance` | ✅ green |
| 09-02 | 2 | CLN-02 | unit | `yarn test:unit __tests__/unit/utils/ __tests__/unit/shared/` | ✅ green |
| 09-02 | 2 | CLN-02 | integration | `npm run verify:governance` (knip/depcruise) | ✅ green |
| 09-03 | 3 | CLN-02 | dateUtils | migrate to shared/formatting | ✅ green |
| 09-04 | 4 | CLN-02 | responsiveUtils | delete, useResponsiveStyles | ✅ green |
| 09-05 | 5 | CLN-03 | smoke | `node scripts/verify-governance-smoke.js` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `verify:governance` 确认 depcruise 使用 `scripts/governance/depcruise.cjs`（传 `--config`）
- [x] `verify:governance` 确认 knip 使用正确 scope 与 allowlist
- [x] 06-SMOKE-CHECKLIST 扩展「删除/迁移路径」检查项（D-14）

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 双端真机 smoke（可选） | CLN-03 | D-13 验证以脚本为主 | 按 06-SMOKE-CHECKLIST 手测 record/export/sync；至少一端真机 |

---

## Validation Sign-Off

- [x] All plans have automated verify (verify:governance / test:unit / smoke)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers depcruise/knip config path + smoke checklist extension
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter after Wave 0 complete

**Approval:** complete
