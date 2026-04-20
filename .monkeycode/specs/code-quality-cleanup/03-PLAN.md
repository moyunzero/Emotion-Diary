---
phase: 21-code-quality-cleanup
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - components/Dashboard.tsx
  - features/profile/ProfileScreen.tsx
  - hooks/useThemeStyles.ts
  - components/AudioRecorder/
autonomous: true
requirements:
  - CLEAN-03

must_haves:
  truths:
    - "React hooks exhaustive-deps warnings addressed"
    - "AudioRecorder unused variables removed"
    - "Lint warnings significantly reduced"
  artifacts:
    - path: "components/Dashboard.tsx"
      provides: "Fixed hooks dependencies"
    - path: "features/profile/ProfileScreen.tsx"
      provides: "Fixed hooks dependencies"
    - path: "hooks/useThemeStyles.ts"
      provides: "Fixed hooks dependencies"
    - path: "components/AudioRecorder/"
      provides: "Removed unused variables (D-05)"
  key_links:
    - from: "components/Dashboard.tsx"
      to: "React hooks deps"
      via: "useCallback or useEffect dependency arrays"
    - from: "hooks/useThemeStyles.ts"
      to: "React hooks deps"
      via: "dependency arrays"
---

<objective>
Fix React hooks exhaustive-deps warnings and remaining lint warnings (per D-07, D-05).
</objective>

<context>
@.planning/phases/21-code-quality-cleanup/21-CONTEXT.md

# From CONTEXT.md:

### Lint Warnings (15)
- import/no-named-as-default (4)
- @typescript-eslint/no-unused-vars (6)
- react-hooks/exhaustive-deps (5)

### D-05: AudioRecorder unused variables
- CANCEL_THRESHOLD_PX
- isPressed
- handleCancelRecording
- avgNeighbor

### D-07: React hooks dependencies
- Add missing dependencies or wrap in useCallback with proper deps
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Dashboard.tsx hooks dependencies</name>
  <files>components/Dashboard.tsx</files>
  <action>
1. Read Dashboard.tsx
2. Run `yarn lint 2>&1 | grep "Dashboard"` to identify specific warnings
3. For each exhaustive-deps warning:
   - Add missing dependency to useEffect/useMemo/useCallback dependency array
   - OR if dependency is intentionally excluded, wrap in useCallback with proper justification comment
4. Ensure all reactive values are captured in dependency arrays
  </action>
  <verify>
    <automated>
      yarn lint 2>&1 | grep -c "exhaustive-deps"
    </automated>
  </verify>
  <done>Dashboard.tsx hooks dependencies fixed; exhaustive-deps warnings resolved</done>
</task>

<task type="auto">
  <name>Task 2: Fix ProfileScreen.tsx hooks dependencies</name>
  <files>features/profile/ProfileScreen.tsx</files>
  <action>
1. Read ProfileScreen.tsx
2. Run `yarn lint 2>&1 | grep "ProfileScreen"` to identify specific warnings
3. For each exhaustive-deps warning:
   - Add missing dependency to useEffect/useMemo/useCallback dependency array
   - OR wrap callback in useCallback with proper deps
4. Ensure all reactive values are captured
  </action>
  <verify>
    <automated>
      yarn lint 2>&1 | grep "ProfileScreen" | grep -c "exhaustive-deps" || echo "0"
    </automated>
  </verify>
  <done>ProfileScreen.tsx hooks dependencies fixed</done>
</task>

<task type="auto">
  <name>Task 3: Fix useThemeStyles.ts hooks dependencies</name>
  <files>hooks/useThemeStyles.ts</files>
  <action>
1. Read useThemeStyles.ts
2. Run `yarn lint 2>&1 | grep "useThemeStyles"` to identify warnings
3. Fix exhaustive-deps warnings by:
   - Adding missing dependencies, OR
   - Wrapping callbacks in useCallback with proper deps
4. Document any intentional exclusions with comments
  </action>
  <verify>
    <automated>
      yarn lint 2>&1 | grep "useThemeStyles" | grep -c "exhaustive-deps" || echo "0"
    </automated>
  </verify>
  <done>useThemeStyles.ts hooks dependencies fixed</done>
</task>

<task type="auto">
  <name>Task 4: Remove AudioRecorder unused variables (D-05)</name>
  <files>
    components/AudioRecorder/
  </files>
  <action>
Per CONTEXT.md D-05, remove these unused variables from AudioRecorder:
- CANCEL_THRESHOLD_PX
- isPressed
- handleCancelRecording
- avgNeighbor

1. Find each variable in AudioRecorder files
2. If truly unused (not referenced elsewhere), remove the declaration
3. If needed for future, prefix with underscore: _CANCEL_THRESHOLD_PX
  </action>
  <verify>
    <automated>
      yarn lint 2>&1 | grep "AudioRecorder" | grep -c "no-unused-vars" || echo "0"
    </automated>
  </verify>
  <done>AudioRecorder unused variables removed per D-05</done>
</task>

</tasks>

<verification>
- [ ] Run `yarn lint` - verify exhaustive-deps warnings decreased
- [ ] Run `yarn typecheck` - no type errors
- [ ] Verify app still functions correctly
</verification>

<success_criteria>
- React hooks exhaustive-deps warnings addressed for Dashboard, ProfileScreen, useThemeStyles
- AudioRecorder unused variables removed
- Total lint warning count significantly reduced
</success_criteria>

<output>
After completion, create `.planning/phases/21-code-quality-cleanup/21-03-SUMMARY.md`
</output>