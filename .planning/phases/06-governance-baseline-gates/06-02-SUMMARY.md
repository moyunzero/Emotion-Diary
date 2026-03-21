---
phase: 06-governance-baseline-gates
plan: 02
subsystem: infra
tags: [governance, depcruise, eslint, boundaries, knip]
requires:
  - phase: 06-01
    provides: verify:governance baseline command and scope contract
provides:
  - report/warn progressive dependency-boundary rule configuration
  - baseline allowlist strategy for historical debt containment
  - governance gate policy document with upgrade and rollback rules
affects: [phase-06-03, phase-07, phase-08, phase-09]
tech-stack:
  added: [eslint-plugin-boundaries]
  patterns: [progressive-gates, baseline-allowlist, warn-to-error-upgrade]
key-files:
  created:
    - scripts/governance/depcruise.cjs
    - scripts/governance/allowlist.knip.json
    - .planning/phases/06-governance-baseline-gates/06-GATE-RULES.md
    - .planning/phases/06-governance-baseline-gates/06-02-SUMMARY.md
  modified:
    - eslint.config.js
    - package.json
    - yarn.lock
key-decisions:
  - "Boundaries lint gate defaults to warn and upgrades via GOV_BOUNDARIES_LEVEL=error after D-10 is met."
  - "Historical unused-export debt is tracked in allowlist baseline instead of forcing immediate cleanup."
patterns-established:
  - "Pattern 1: governance rules stay report/warn-first, then promote only with two clean PR rounds."
  - "Pattern 2: merge blocking policy must pair with documented emergency unlock and rollback path."
requirements-completed: [GOV-02]
duration: 9min
completed: 2026-03-21
---

# Phase 06 Plan 02: Governance Progressive Gates Summary

**Progressive governance gates shipped with depcruise + ESLint boundaries, including explicit warn-to-error upgrade criteria and rollback-safe enforcement rules.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-21T14:53:30Z
- **Completed:** 2026-03-21T15:02:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added executable dependency-cruiser governance config with explicit report/warn levels and D-11 candidate rules.
- Added allowlist baseline artifact to contain historical debt and enforce "only new violations" policy.
- Integrated ESLint boundaries progressive gate into lint pipeline and documented D-10/D-12/D-15 operational policy.

## Task Commits

Each task was committed atomically:

1. **Task 1: 落地依赖边界与历史债务基线策略** - `5e6cf1d` (feat)
2. **Task 2: 在 ESLint 与治理文档中同步门禁升级机制** - `19de3a4` (feat)

## Files Created/Modified
- `scripts/governance/depcruise.cjs` - Governance rule levels, scope constraints, and D-11 candidate mapping.
- `scripts/governance/allowlist.knip.json` - Baseline allowlist policy and historical debt snapshot container.
- `eslint.config.js` - Boundaries lint gate with warn-first progressive level control.
- `.planning/phases/06-governance-baseline-gates/06-GATE-RULES.md` - Upgrade criteria, blocking and emergency unlock contract, D-15 minimum verification bar.
- `package.json` - Added lint-gate dependency for boundaries plugin.
- `yarn.lock` - Locked dependency graph update for boundaries plugin.

## Decisions Made
- Used environment-driven gate escalation (`GOV_BOUNDARIES_LEVEL`) to avoid hard-switching to error before D-10 conditions are met.
- Kept candidate error classes visible at warn level to ensure team observability without blocking historical debt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm dependency install conflict blocked lint gate integration**
- **Found during:** Task 2 (ESLint gate integration)
- **Issue:** `npm install -D eslint-plugin-boundaries` failed with peer-resolution conflict (`ERESOLVE`).
- **Fix:** Installed the same dependency through Yarn (`yarn add -D eslint-plugin-boundaries`) to match repository toolchain and unblock lint integration.
- **Files modified:** `package.json`, `yarn.lock`
- **Verification:** `npm run lint` passes with boundaries rule active.
- **Committed in:** `19de3a4` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** No scope creep; fix was required to complete planned lint-gate integration.

## Issues Encountered
- Boundaries plugin emits migration warnings for deprecated `element-types` naming; functional gate is active and lint remains passing in current baseline.

## Known Stubs
- `scripts/governance/allowlist.knip.json`: `historicalDebt.unusedExports` / `unusedDependencies` are intentionally empty baseline arrays and will be populated by first debt snapshot run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GOV-02 implementation artifacts are in place and executable.
- Ready for `06-03` to bind these gates with key-path behavior consistency checks (record/export/sync).

## Self-Check: PASSED

- FOUND: `.planning/phases/06-governance-baseline-gates/06-02-SUMMARY.md`
- FOUND: `5e6cf1d`
- FOUND: `19de3a4`

---
*Phase: 06-governance-baseline-gates*
*Completed: 2026-03-21*
