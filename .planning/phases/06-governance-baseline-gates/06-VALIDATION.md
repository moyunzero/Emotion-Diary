---
phase: 6
slug: governance-baseline-gates
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 30.x + eslint 9.x + node scripts |
| **Config file** | `jest.config.js`, `jest.ci.config.js`, `eslint.config.js` |
| **Quick run command** | `npm run lint && npm test -- --runInBand --watchman=false __tests__/unit/utils/reviewStatsTimeRange.test.ts` |
| **Full suite command** | `npm run lint && npm test -- --watchman=false` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm test -- --watchman=false`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | GOV-01 | lint + smoke | `npm run lint` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | GOV-02 | config check | `node scripts/verify-governance.js --check-stages` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | GOV-03 | unit + smoke | `npm test -- --watchman=false __tests__/unit` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | GOV-01 | rule scan | `npx knip --reporter compact` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | GOV-02 | dep graph | `npx depcruise --config .dependency-cruiser.cjs app components store utils hooks services lib` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | GOV-02 | lint boundary | `npm run lint` | ✅ | ⬜ pending |
| 06-03-01 | 03 | 3 | GOV-03 | contract smoke | `node scripts/verify-governance.js --contracts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-governance.js` — governance stage and contract checks
- [ ] `.dependency-cruiser.cjs` — dependency boundary baseline
- [ ] `.knip.json` — dead-code baseline and allowlist
- [ ] boundary rules in `eslint.config.js` — staged report/warn setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 记录主路径无回归 | GOV-03 | 涉及端侧交互流程 | 打开记录页，创建/编辑/保存一条记录，确认列表与详情一致 |
| 导出主路径无回归 | GOV-03 | 导出涉及视觉与权限 | 进入回顾导出，保存到相册，检查关键字段文案与统计一致 |
| 同步主路径无回归 | GOV-03 | 依赖账号与网络状态 | 登录后手动触发同步，检查无错误提示与数据一致性 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
