# Phase 21: Code Quality Cleanup - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up unused code exports, merge duplicate exports, fix lint warnings, and resolve test failures related to expo-audio mock. This is a code hygiene phase with no user-facing feature changes.

**Scope:**
- Remove unused exports (AudioRecorder components, Profile types)
- Merge duplicate default + named exports (AudioRecorder)
- Fix lint warnings (unused variables, React hooks dependencies)
- Fix test failures (expo-audio mock issue)

</domain>

<decisions>
## Implementation Decisions

### Approach to Cleanup
- **D-01:** Unused exports in AudioRecorder: Remove default exports while keeping named exports (standard pattern)
- **D-02:** Unused type exports in Profile: Remove entirely (types only, no code breaking)
- **D-03:** Duplicate exports: Remove duplicate default exports from AudioRecorder components
- **D-04:** Unused variables: Remove or prefix with underscore where intentionally unused

### Lint Warning Resolution
- **D-05:** AudioRecorder unused variables: Remove (CANCEL_THRESHOLD_PX, isPressed, handleCancelRecording, avgNeighbor)
- **D-06:** audioSync.ts unused variables: Remove (lines 30 and 113)
- **D-07:** React hooks dependencies: Add missing dependencies or wrap in useCallback with proper deps

### Test Mock Fix
- **D-08:** expo-audio mock: Add proper ES module mock to Jest config

### knip Configuration
- **D-09:** Configuration hints: Review 13 hints, prioritize critical ones in planning

</decisions>

<specifics>
## Specific Issues to Address

### Unused Exports (8)
- `AudioList` — exported but not imported anywhere
- `AudioPreview` — exported but not imported anywhere
- `RecordButton` — exported but not imported anywhere
- `WaveformView` — exported but not imported anywhere

### Unused Type Exports (8)
- `AppScreenShellProps` — type only, not used
- `ProfileMenuItemProps` — interface not used
- `ProfileStatCardProps` — not used
- `ProfileUserCardProps` — not used

### Duplicate Exports (5)
- AudioList, AudioPreview, AudioRecorder, RecordButton, WaveformView each exported as both default and named

### Lint Warnings (15)
- import/no-named-as-default (4)
- @typescript-eslint/no-unused-vars (6)
- react-hooks/exhaustive-deps (5)

### Test Failures (3 suites)
- expo-audio mock issue causing SyntaxError

</specifics>

<canonical_refs>
## Canonical References

### Code Quality
- `knip.json` — current knip configuration
- `.eslintrc.js` or equivalent — lint configuration
- `jest.config.js` — test configuration

### Audit Sources
- `yarn lint` output — 15 warnings
- `npx knip` output — 8 unused exports, 5 duplicate exports, 8 unused types
- `yarn test:ci` output — 3 failed suites (expo-audio)

</canonical_refs>

  代码上下文>
## Existing Code Insights

### Relevant Files
- `components/AudioRecorder/` — AudioList.tsx, AudioPreview.tsx, RecordButton.tsx, WaveformView.tsx, index.ts
- `components/AppScreenShell.tsx` — unused type export
- `components/Profile/` — ProfileMenuItem.tsx, ProfileStatCard.tsx, ProfileUserCard.tsx
- `features/profile/` — various unused type exports
- `services/audioSync.ts` — unused variables
- `components/Dashboard.tsx` — React hooks deps
- `features/profile/ProfileScreen.tsx` — React hooks deps
- `hooks/useThemeStyles.ts` — React hooks deps

### Established Patterns
- Named exports preferred over default exports in this codebase
- Unused variables should be removed, not eslint-disabled

</code_context>

<deferred>
## Deferred Ideas

- None — all issues are within Phase 21 scope

</deferred>

---

*Phase: 21-code-quality-cleanup*
*Context gathered: 2026-04-19*