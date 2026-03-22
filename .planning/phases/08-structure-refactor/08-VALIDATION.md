---
phase: 08
slug: structure-refactor
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-21
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (Expo preset) |
| **Config file** | `jest.config.js` / `package.json` scripts |
| **Quick run command** | `yarn lint` + focused `yarn test:unit <path> -i` |
| **Full suite command** | `yarn test:ci` (or project CI-equivalent) |
| **Estimated runtime** | ~2–8 minutes (varies by machine) |

---

## Sampling Rate

- **After every task commit:** Run `yarn lint` and task-scoped unit tests from plan `<verify>`
- **After every plan wave:** Run `yarn test:ci` or governance smoke if touched paths require it
- **Before `/gsd-verify-work`:** Full suite green
- **Max feedback latency:** 600 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-* | 01 | 1 | ARC-01 | unit + lint | `yarn lint` + profile-related tests | ✅ | ⬜ pending |
| 08-02-* | 02 | 2 | ARC-02 | unit + lint | `yarn lint` + store/entries tests | ✅ | ⬜ pending |
| 08-03-* | 03 | 3 | ARC-03 | unit + lint | `yarn lint` + EditEntryModal tests | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers phase requirements (Jest, ESLint, governance smoke). No Wave 0 install.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Profile screen parity | ARC-01 | Visual + gesture flows | Open profile: login/register/edit/sync paths unchanged vs baseline |
| Edit entry flow parity | ARC-03 | Modal UX | Create/edit entry, save, cancel, deadline picker — no regression |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable
- [ ] `nyquist_compliant: true` set in frontmatter after execution

**Approval:** pending
