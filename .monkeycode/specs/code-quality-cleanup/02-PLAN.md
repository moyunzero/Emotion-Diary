---
phase: 21-code-quality-cleanup
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - components/AppScreenShell.tsx
  - components/Profile/ProfileMenuItem.tsx
  - components/Profile/ProfileStatCard.tsx
  - components/Profile/ProfileUserCard.tsx
  - features/profile/types.ts
  - services/audioSync.ts
autonomous: true
requirements:
  - CLEAN-01
  - CLEAN-03

must_haves:
  truths:
    - "Unused type exports removed from Profile and AppScreenShell"
    - "Unused variables removed from audioSync.ts"
    - "Lint warnings for unused variables reduced"
  artifacts:
    - path: "components/AppScreenShell.tsx"
      provides: "Removed unused type exports"
    - path: "components/Profile/"
      provides: "Cleaned type exports"
    - path: "services/audioSync.ts"
      provides: "Removed unused variables"
  key_links:
    - from: "services/audioSync.ts"
      to: "Line 30, Line 113"
      via: "variable removal"
      pattern: "const|let|var"
---

<objective>
Remove unused type exports and unused variables that are causing lint warnings (per D-04, D-05, D-06).
</objective>

<context>
@.planning/phases/21-code-quality-cleanup/21-CONTEXT.md

# From CONTEXT.md Specific Issues:

### Unused Type Exports (8)
- `AppScreenShellProps` — type only, not used
- `ProfileMenuItemProps` — interface not used
- `ProfileStatCardProps` — not used
- `ProfileUserCardProps` — not used

### Lint Warnings - Unused Variables
- audioSync.ts lines 30 and 113: Unused variables
- AudioRecorder unused variables: CANCEL_THRESHOLD_PX, isPressed, handleCancelRecording, avgNeighbor

Pattern: Unused variables should be removed, not eslint-disabled (established pattern from CONTEXT.md)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove unused type exports from AppScreenShell</name>
  <files>components/AppScreenShell.tsx</files>
  <action>
1. Read AppScreenShell.tsx
2. Find AppScreenShellProps type export
3. Check if AppScreenShellProps is imported anywhere: `grep -r "AppScreenShellProps" --include="*.tsx" --include="*.ts" | grep -v "AppScreenShell.tsx"`
4. If no external imports found, remove the type export
5. Keep internal type usage if needed
  </action>
  <verify>
    <automated>
      grep -r "AppScreenShellProps" --include="*.tsx" --include="*.ts" | grep -v "AppScreenShell.tsx" | wc -l
    </automated>
  </verify>
  <done>AppScreenShellProps removed if unused; internal type usage preserved</done>
</task>

<task type="auto">
  <name>Task 2: Remove unused Profile type exports</name>
  <files>
    components/Profile/ProfileMenuItem.tsx
    components/Profile/ProfileStatCard.tsx
    components/Profile/ProfileUserCard.tsx
    features/profile/types.ts
  </files>
  <action>
For each component file:
1. Read the file to find type exports (ProfileMenuItemProps, ProfileStatCardProps, ProfileUserCardProps)
2. Check if each type is imported anywhere in codebase:
   - `grep -r "ProfileMenuItemProps" --include="*.tsx" --include="*.ts" | grep -v "ProfileMenuItem.tsx"`
   - `grep -r "ProfileStatCardProps" --include="*.tsx" --include="*.ts" | grep -v "ProfileStatCard.tsx"`
   - `grep -r "ProfileUserCardProps" --include="*.tsx" --include="*.ts" | grep -v "ProfileUserCard.tsx"`
3. If no external imports found, remove the type export
4. Also check features/profile/types.ts for any re-exports
  </action>
  <verify>
    <automated>
      # Verify types are not imported elsewhere
      echo "Checking Profile type imports..."
      grep -r "ProfileMenuItemProps\|ProfileStatCardProps\|ProfileUserCardProps" --include="*.tsx" --include="*.ts" | grep -v "components/Profile/" | wc -l
    </automated>
  </verify>
  <done>Unused Profile type exports removed</done>
</task>

<task type="auto">
  <name>Task 3: Remove unused variables from audioSync.ts</name>
  <files>services/audioSync.ts</files>
  <action>
1. Read audioSync.ts
2. Find variables at lines 30 and 113 (per CONTEXT.md D-06)
3. For each unused variable:
   - Check if it's actually used in the code
   - If unused, remove the variable declaration
   - If intentionally unused but needed for future, prefix with underscore (_unusedName)
4. Run `yarn lint` to verify warning count decreased
  </action>
  <verify>
    <automated>
      yarn lint 2>&1 | grep -c "no-unused-vars"
    </automated>
  </verify>
  <done>Unused variables removed; lint warnings for audioSync.ts resolved</done>
</task>

</tasks>

<verification>
- [ ] Run `yarn lint` - verify unused-vars warnings decreased
- [ ] Run `yarn typecheck` - no type errors from removal
</verification>

<success_criteria>
- Unused type exports removed from Profile and AppScreenShell components
- Unused variables removed from audioSync.ts
- Lint warnings for unused variables reduced
</success_criteria>

<output>
After completion, create `.planning/phases/21-code-quality-cleanup/21-02-SUMMARY.md`
</output>