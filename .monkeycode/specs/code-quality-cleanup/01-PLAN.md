---
phase: 21-code-quality-cleanup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/AudioRecorder/AudioList.tsx
  - components/AudioRecorder/AudioPreview.tsx
  - components/AudioRecorder/RecordButton.tsx
  - components/AudioRecorder/WaveformView.tsx
autonomous: true
requirements:
  - CLEAN-01
  - CLEAN-02

must_haves:
  truths:
    - "Unused AudioRecorder exports are removed from the codebase"
    - "Duplicate default+named exports are resolved"
    - "No compilation or import errors from export changes"
  artifacts:
    - path: "components/AudioRecorder/"
      provides: "Cleaned up exports"
    - path: "components/AudioRecorder/index.ts"
      provides: "Single source of truth for exports"
  key_links:
    - from: "components/AudioRecorder/index.ts"
      to: "AudioList.tsx, AudioPreview.tsx, RecordButton.tsx, WaveformView.tsx"
      via: "named exports only"
      pattern: "export \\{ .* \\} from"
---

<objective>
Clean up AudioRecorder unused and duplicate exports, following the decision in CONTEXT.md (D-01, D-02, D-03) to keep only named exports while removing unused components.
</objective>

<context>
@.planning/phases/21-code-quality-cleanup/21-CONTEXT.md

# Background

From CONTEXT.md analysis:
- **Unused Exports**: AudioList, AudioPreview, RecordButton, WaveformView exported but never imported outside AudioRecorder/
- **Duplicate Exports**: Each exported as both default and named
- **Decision**: Remove unused components entirely, keep only named exports for used components

# Pattern context

The codebase uses Named exports as standard pattern per AGENTS.md and prior decisions.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove unused AudioRecorder exports</name>
  <files>components/AudioRecorder/AudioList.tsx, components/AudioRecorder/AudioPreview.tsx, components/AudioRecorder/RecordButton.tsx, components/AudioRecorder/WaveformView.tsx</files>
  <action>
1. Remove unused component exports (AudioList, AudioPreview, RecordButton, WaveformView) from their respective files if they are truly unused
2. Verify each component is not imported anywhere: `grep -r "AudioList\|AudioPreview\|RecordButton\|WaveformView" --include="*.tsx" --include="*.ts" | grep -v "components/AudioRecorder"`
3. If truly unused (0 results), remove the export line
4. Keep the file if it has internal usage; otherwise remove entire component

For each file:
- Check imports in the codebase
- If no external imports found beyond index.ts re-exports, remove the component
  </action>
  <verify>
    <automated>
      # Verify no external imports reference removed components
      echo "Checking for remaining imports..."
      grep -r "from.*components/AudioRecorder" --include="*.tsx" --include="*.ts" | wc -l
    </automated>
  </verify>
  <done>Unused AudioRecorder components removed; only used components remain exported</done>
</task>

<task type="auto">
  <name>Task 2: Consolidate duplicate exports in index.ts</name>
  <files>components/AudioRecorder/index.ts</files>
  <action>
1. Read current index.ts to see current export pattern
2. If both default and named exports exist, remove default exports:
   ```typescript
   // Remove: export default AudioList
   // Keep: export { AudioList }
   ```
3. If component was removed in Task 1, remove from index.ts entirely
4. Ensure only one export pattern per component
  </action>
  <verify>
    <automated>
      # Verify only named exports remain
      grep -c "export {" components/AudioRecorder/index.ts
    </automated>
  </verify>
  <done>Index.ts has clean named exports only; no duplicate export patterns</done>
</task>

</tasks>

<verification>
- [ ] Verify no TypeScript compilation errors: `yarn typecheck`
- [ ] Verify no runtime import errors: app starts without AudioRecorder errors
</verification>

<success_criteria>
- AudioRecorder components used externally are accessible via named exports
- Unused components are removed
- No duplicate export patterns remain (no default + named for same component)
</success_criteria>

<output>
After completion, create `.planning/phases/21-code-quality-cleanup/21-01-SUMMARY.md`
</output>