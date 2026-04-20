# Phase 21 Plan 03: React Hooks Dependencies + Remaining Lint Warnings Summary

**One-liner:** Fixed 3 React hooks exhaustive-deps warnings and removed all remaining unused variables, bringing lint warnings from 15 → 0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix Dashboard.tsx hooks dependencies | d465df5 | Dashboard.tsx |
| 2 | Fix ProfileScreen.tsx hooks dependencies | d465df5 | ProfileScreen.tsx |
| 3 | Fix useThemeStyles.ts hooks dependencies | d465df5 | useThemeStyles.ts |
| 4 | Remove AudioRecorder unused variables (D-05) | d465df5 | RecordButton.tsx, WaveformView.tsx |

## Changes Made

### React Hooks Exhaustive-Deps Warnings (3 fixed)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| Dashboard.tsx | ~307 | useCallback missing `styles.*` deps | Added `styles` to dependency array |
| ProfileScreen.tsx | ~104 | useEffect missing `state` dep | Added `state` to dependency array (idempotent) |
| ProfileScreen.tsx | ~121 | useEffect missing `state` dep | Added `state` to dependency array (idempotent) |
| useThemeStyles.ts | ~30 | useMemo missing `styleFactory` dep | Added `styleFactory` to dependency array |

### Unused Variables Removed (AudioRecorder D-05)

#### RecordButton.tsx
- `CANCEL_THRESHOLD_PX` — unused constant
- `isPressed` state — value never read (setter called but getter unused)
- `setIsPressed` calls removed (lines 44, 64, 85)
- `handleCancelRecording` function — never called
- `useState` import removed (no longer needed)

#### WaveformView.tsx
- `avgNeighbor` — assigned but never used (already removed in Task 4)
- `leftNeighbor` — assigned but never used
- `rightNeighbor` — assigned but never used

### Import Fix

**EditEntryForm.tsx** line 23:
- Changed `import AudioRecorder from '../AudioRecorder/AudioRecorder'` 
- To `import { AudioRecorder } from '../AudioRecorder/AudioRecorder'`
- Resolves import/no-named-as-default ESLint warning

## Verification

- [x] `yarn lint` — **0 warnings** (was 15 at start of phase)
- [x] `yarn typecheck` — **no errors**

## Total Lint Warning Reduction

| Warning Type | Initial | Final |
|--------------|---------|-------|
| `@typescript-eslint/no-unused-vars` | 6 | 0 |
| `react-hooks/exhaustive-deps` | 5 | 0 |
| `import/no-named-as-default` | 4 | 0 |
| **Total** | **15** | **0** |

## Commit

`d465df5` — refactor(21-03): fix React hooks deps and remaining lint warnings

## Deviations

None — plan executed exactly as written, achieving the goal of reducing all lint warnings to zero.
