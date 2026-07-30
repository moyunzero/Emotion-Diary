---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
# Coding Conventions

**Analysis Date:** 2026-07-30

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — e.g. `components/EntryCard.tsx`, `components/Dashboard.tsx`
- Feature screens: `PascalCase` under `features/<name>/` — e.g. `features/profile/ProfileScreen.tsx`, `features/recycleBin/RecycleBinScreen.tsx`
- Hooks: `use` + `PascalCase` — e.g. `hooks/useThemeStyles.ts`, `hooks/useStopAudioOnTabBlur.ts`
- Store slices: `camelCase.ts` under `store/modules/` — e.g. `store/modules/entries.ts`, `store/modules/storage.ts`
- Shared pure modules: `camelCase.ts` under `shared/<domain>/` — e.g. `shared/sync/tombstone.ts`, `shared/audio/uploadRetry.ts`
- Style factories: `ComponentName.styles.ts` under `styles/components/` — e.g. `styles/components/Dashboard.styles.ts`
- Feature-local styles may live beside the screen — e.g. `features/recycleBin/recycleBin.styles.ts`
- Unit tests: `<sourceBasename>.test.ts` mirroring source path under `__tests__/unit/` — e.g. `__tests__/unit/shared/sync/tombstone.test.ts`
- Domained unit suites may use dotted suffixes — e.g. `aiService.locale.test.ts`, `aiService.cache.test.ts`
- E2E (Playwright): kebab-case `*.spec.ts` under `e2e/` — e.g. `e2e/recycle-bin-main-path.spec.ts`
- Maestro flows: kebab-case `*.yaml` under `.maestro/flows/` and `.maestro/subflows/`

**Functions:**
- `camelCase` for functions and methods — e.g. `collectTombstoneEntryIds`, `filterOutTombstonedEntries` in `shared/sync/tombstone.ts`
- Factory creators for Zustand slices: `createXxxSlice` / `createXxxModule` — e.g. `createEntriesSlice` in `store/modules/entries.ts`, `createAIModule` in `store/modules/ai.ts`
- Style factories: `createXxxStyles(width, height)` — e.g. `createDashboardStyles` in `styles/components/Dashboard.styles.ts`
- Event handlers and callbacks: `onXxx` props; boolean helpers prefer `is` / `has` / `should` prefixes — e.g. `isSoftDeleted` in `shared/entries/visibility.ts`, `isNetworkError` in `utils/errorHandler.ts`

**Variables:**
- `camelCase` locals and store fields
- Module-level timer/singleton refs may use `XxxRef` suffix — e.g. `saveEntriesTimeoutRef` in `store/modules/entries.ts`
- Env / feature flags and storage keys: descriptive string constants — e.g. guest key `mood_entries_guest` via `getStorageKey` in `store/modules/storage.ts`

**Types:**
- Domain enums and interfaces in `types.ts` — e.g. `MoodLevel`, `Status`, `MoodEntry`, `RecordingState`
- Store contracts in `store/modules/types.ts` — e.g. `AppState`, `EntriesModule`
- Prefer `interface` / `type` / `enum`; export public APIs with explicit types
- Use `import type` for type-only imports when practical — e.g. `import type { View } from "react-native"` in tests

**Constants:**
- `UPPER_SNAKE_CASE` for module constants — e.g. `AUDIO_UPLOAD_MAX_ATTEMPTS`, `AUDIO_UPLOAD_BASE_DELAY_MS` in `shared/audio/uploadRetry.ts`
- Color / design tokens via `COLORS` and `DESIGN_TOKENS` in `constants/colors.ts`
- Screen header tokens in `styles/screenHeaderTokens.ts`

## Code Style

**Formatting:**
- No Prettier / Biome config detected; rely on ESLint + TypeScript
- Quotes are mixed (`'` and `"`) across modules — match the file you edit
- Indentation: 2 spaces (TypeScript / TSX)

**Linting:**
- Tool: ESLint 9 flat config — `eslint.config.js`
- Base: `eslint-config-expo` via `eslint/config` `defineConfig`
- Layer boundaries: `eslint-plugin-boundaries` at `error` (`governanceGateLevel`)
- Lint scope (from `package.json` `lint` script): `app`, `components`, `constants`, `features`, `hooks`, `lib`, `services`, `store`, `utils`, `shared`, `types`, `types.ts`, `constants.ts`
- Cache: `--cache --cache-location .expo/cache/eslint/`

**TypeScript:**
- `strict: true` in `tsconfig.json` (extends `expo/tsconfig.base`)
- Path alias: `@/*` → repo root (also mirrored in Jest `moduleNameMapper`)
- Exclude: `node_modules`, `supabase/functions`
- Avoid `any` except temporary / unavoidable cases (e.g. legacy logger `data?: any` in `utils/logger.ts`)

## Import Organization

**Order (prescriptive):**
1. External packages (`react`, `react-native`, `zustand`, Expo modules, etc.)
2. Blank line
3. Alias imports `@/...` (preferred for cross-layer)
4. Relative imports (`../`, `./`) when staying within the same package area
5. Type-only: `import type { ... }`

**Path Aliases:**
- Always prefer `@/` for cross-directory imports in new code — e.g. `import { ensureMilliseconds } from "@/shared/formatting"` in `store/useAppStore.ts`
- Relative imports remain common inside `store/modules/` and some `shared/` callers — match neighbors

**Layer rules (must follow — enforced by ESLint):**
| From | Disallow |
|------|----------|
| `store`, `components` | `app` |
| `features` | `app`, other `features` |
| `shared` | `app`, `features`, `components`, `store` |

Documented intent (also in `.planning/codebase/ENGINEERING-QUALITY.md`): `utils` stays pure helpers; `services` must not import `components` / `store`; business mutations go through `useAppStore` actions.

**Cleanup:**
- Delete unused imports in the same change that made them unused
- After replacing a data flow or public API, search and remove orphaned exports / dead branches before commit

## Error Handling

**Patterns:**
- Typed errors: `AppError` + `ErrorType` enum in `utils/errorHandler.ts` (`NETWORK`, `VALIDATION`, `AUTH`, `SYNC`, `AI`, `STORAGE`, `UNKNOWN`)
- Classification helpers for retry / auth decisions: `isNetworkError`, `isAuthError`, `isValidationError`, `isTemporaryError` in `utils/errorHandler.ts`
- User-visible / recoverable messaging goes through `errorHandler`; do not invent ad-hoc toast strings for the same cases
- Async I/O: wrap in `try/catch`; classify with helpers before retrying (sync / AI / audio upload)
- React tree: class `ErrorBoundary` in `components/ErrorBoundary.tsx` logs via `logger` and renders fallback UI
- Web Alert: `utils/webAlertPolyfill.ts` for Web dialog parity where needed

**Do this:**
```typescript
import { isAuthError, isNetworkError } from "@/utils/errorHandler";
// classify then branch: retry / re-auth / surface message
```

**Avoid:**
- Swallowing errors with empty `catch`
- Retrying auth/validation failures as if they were transient network errors

## Logging

**Framework:** `utils/logger.ts` — singleton `Logger.getInstance()` exported as `logger`

**Patterns:**
- Prefer `logger.warn` / `logger.error` / `logger.info` with a context string (module name) as first semantic arg
- Gate noisy output with `isDevelopment()` from `utils/env.ts` (logger already scopes console output to development)
- Info-level must not spam production builds
- `Logger.persistLog` is intentionally unimplemented (placeholder until Sentry / file logging)
- Legacy `console.error` / `console.warn` may remain on emergency paths; new code should use `logger`

## Comments

**When to Comment:**
- Module headers explaining domain invariants (tombstones, soft-delete, clipHandler ownership) — see `shared/sync/tombstone.ts`, `store/modules/entries.ts`
- Non-obvious constraints (debounce timers, singleton refs, ESLint disable with reason)
- Do not restate obvious code

**JSDoc/TSDoc:**
- Public classes / constructors and non-trivial exports often have JSDoc (`AppError`, `Logger`, slice creators)
- Prefer concise Chinese or English matching surrounding file language

## Function Design

**Size:**
- Prefer small pure functions in `shared/` and `utils/` (easy to unit-test)
- Keep Zustand actions focused; heavy merge / filter logic belongs in `shared/`

**Parameters:**
- Prefer explicit typed params over large untyped bags
- Readonly inputs for pure filters — e.g. `ReadonlySet<string>` in `filterOutTombstonedEntries`

**Return Values:**
- Pure helpers return new arrays / values; do not mutate caller inputs (tests assert immutability — see `__tests__/unit/shared/sync/tombstone.test.ts`)
- Export return types on public APIs when not obvious from inference

## Module Design

**Exports:**
- Named exports for pure modules (`shared/`, `utils/`, `services/`)
- Zustand: compose slices in `store/useAppStore.ts`; consumers import `useAppStore`
- Feature barrels: thin `index.ts` re-exports — e.g. `features/profile/index.ts` exports `ProfileScreen`
- Shared namespace barrel: `shared/index.ts` re-exports `formatting`, `timeRange`, `responsive` as namespaces

**Barrel Files:**
- Use sparingly; feature/package entry points only
- Prefer deep imports for `shared/<domain>/` and `store/modules/` to avoid cycles

**Components:**
- Function components + hooks only (except `ErrorBoundary` class)
- Complex UI: folder with colocated pieces — e.g. `components/AudioRecorder/`, `components/EntryEditor/`, `components/Insights/`
- Lists: prefer `@shopify/flash-list` over long `ScrollView` maps
- Styles: extract to `styles/components/*.styles.ts` factories driven by `createResponsiveMetrics` from `shared/responsive`
- Theme access: `hooks/useThemeStyles.ts` / `useDynamicStyles` (light theme only)

**Store:**
- Business mutations via `useAppStore` actions — do not mutate nested state outside setters
- Selectors: subscribe to precise fields — e.g. `useAppStore((s) => s.effectiveLocale)` — avoid whole-store destructure unless intentional
- Guest/user persistence: `migrateGuestDataToUser` on session restore; logout overwrites guest storage with current snapshot (`store/modules/storage.ts`)
- Soft delete: `deletedAt` via entries slice; tombstones only on explicit purge (`shared/sync/tombstone.ts`, `services/entryTombstones.ts`)

**Audio:**
- Playback: single instance via `shared/audio/coordinator.ts` + store `pauseAudio` / `stopAudio`
- Recording: `shared/audio/recordingCoordinator.ts` singleton; register clip handlers with ownership-safe `releaseRecordingClipHandler`; UI binding via `AudioClipBinding` in `components/AudioRecorder/AudioRecorder.tsx`

**i18n:**
- Runtime copy: `i18next` / `react-i18next` under `i18n/`
- Native permission strings: `locales/native/{en,zh}.json` via `app.json` `expo.locales` (independent of i18next)
- AI cache keys must include locale prefix (`utils/aiService`); locale changes clear AI cache

**E2E selectors:**
- Stable `testID` on critical controls (Profile recycle item, restore/purge, dashboard header, mood cards)
- Maestro: deep links `emotiondiary://…` + `id:` selectors; Alert confirm via `tapOn index: 1`
- Playwright Web: `page.on('dialog', accept)` + `getByTestId`

**Git / commits (project convention):**
- Branch: `YYMMDD-(feat|fix|chore|refactor)-描述`
- Do not commit directly on `master`
- Conventional Commits preferred

---

*Convention analysis: 2026-07-30*
