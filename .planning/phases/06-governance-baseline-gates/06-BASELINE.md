# Phase 06 Governance Baseline

## Governance Goal

Build a minimal but executable governance baseline for refactor safety:

- one-command governance entry
- stable and reproducible output for local and CI
- clear scope and gate policy

Primary command: `npm run verify:governance`

## Fixed Execution Order

The governance script runs in this fixed order:

1. `knip`
2. `dependency-cruiser`
3. `eslint-plugin-boundaries`

This keeps the pipeline deterministic and auditable.

## Initial Scan Scope

Initial directories (Phase 06 baseline):

- `app`
- `components`
- `store`
- `utils`
- `hooks`
- `services`
- `lib`

Out of scope for this baseline:

- `ios`
- `android`
- docs/planning directories

## Current Gate Level

- Default level: `report`
- Selected high-risk checks: `warn`
- Policy: do not clear all historical debt at once; only block newly introduced violations.

Upgrade from `warn` to `error` requires two consecutive PR rounds with zero new violations.

## Baseline Snapshot and Evidence

### Local reproducible command

```bash
npm run verify:governance -- --dry-run
```

### CI reproducible command

```bash
npm ci
npm run verify:governance -- --dry-run
```

### Evidence format

Use concise summary output as evidence:

- stage-by-stage status (`PASS/FAIL`)
- scope list
- reproducible command hint

Avoid committing full raw tool reports unless explicitly required.

## allowlist Management Principles

- allowlist exists only for historical debt snapshot, not for hiding new issues.
- every allowlist entry must include reason, owner, and cleanup timing.
- new violations must be fixed or explicitly approved with traceable record.

## Notes

This baseline implements GOV-01 and prepares GOV-02/GOV-03 phases with a stable governance entrypoint.
