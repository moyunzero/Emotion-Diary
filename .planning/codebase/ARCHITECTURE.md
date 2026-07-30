---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
<!-- refreshed: 2026-07-30 -->
# Architecture

**Analysis Date:** 2026-07-30

## System Overview

Offline-first emotion diary (心晴MO): Expo Router UI → single Zustand store → services/shared/utils → AsyncStorage and optional Supabase/Groq.

```text
┌─────────────────────────────────────────────────────────────┐
│  Presentation (Expo Router + UI)                             │
├──────────────────┬──────────────────┬───────────────────────┤
│  Routes          │  Components      │  Feature screens      │
│  `app/`          │  `components/`   │  `features/`          │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  State — Zustand slices                                      │
│  `store/useAppStore.ts` + `store/modules/*`                  │
└────────────────────────────┬────────────────────────────────┘
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ Services        │ │ Shared (pure)   │ │ Utils / Lib         │
│ `services/`     │ │ `shared/`       │ │ `utils/` `lib/`     │
└────────┬────────┘ └────────┬────────┘ └──────────┬──────────┘
         │                   │                      │
         ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Persistence & cloud                                         │
│  AsyncStorage · Supabase (Auth/DB/Storage) · Groq REST      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Fonts, Splash, i18n, `initializeStore`, Stack, audio hosts | `app/_layout.tsx` |
| Tab shell | Three tabs (dashboard / record / insights) | `app/(tabs)/_layout.tsx` |
| Route stubs | Thin re-exports of screens | `app/(tabs)/*.tsx`, `app/profile.tsx`, `app/recycle-bin.tsx`, `app/review-export.tsx` |
| Dashboard / Entry UI | Main list, cards, filters, weather station | `components/Dashboard.tsx`, `components/EntryCard.tsx` |
| Entry editor | Create/edit mood entries + audio | `components/EntryEditor/`, `components/Record.tsx` |
| Insights | Garden / forecast / podcast UI | `components/Insights/` |
| Profile feature | Auth, sync, settings, companion days | `features/profile/ProfileScreen.tsx` |
| Recycle bin feature | Soft-deleted entries restore/purge | `features/recycleBin/RecycleBinScreen.tsx` |
| App store | Compose slices + `syncToCloud` / `syncFromCloud` | `store/useAppStore.ts` |
| Entries slice | CRUD, soft delete, purge, debounced save | `store/modules/entries.ts` |
| User slice | Auth, profile, guest↔user storage migration | `store/modules/user.ts` |
| Storage helpers | Per-user AsyncStorage keys + migrate | `store/modules/storage.ts` |
| Visibility / merge | Soft-delete filters; cloud merge; tombstones | `shared/entries/visibility.ts`, `shared/sync/cloudMerge.ts`, `shared/sync/tombstone.ts` |
| Audio coordinators | Single playback + recording session | `shared/audio/coordinator.ts`, `shared/audio/recordingCoordinator.ts` |
| Supabase client | Sole cloud SDK entry | `lib/supabase.ts` |
| AI service | Groq chat completions | `utils/aiService.ts` |

## Pattern Overview

**Overall:** Flux-style unidirectional data flow with Zustand slices (modular store) on Expo Router file-based navigation.

**Key Characteristics:**
- Offline-first: mutate local `entries` first, debounce persist, then optional cloud sync when logged in
- Single global `useAppStore` — no parallel domain stores
- Pure domain helpers in `shared/` (enforced by ESLint boundaries); I/O in `services/` / `utils/` / `lib/`
- Soft delete (`deletedAt`) vs permanent purge (`entry_tombstones` + local remove)
- Audio native handles live outside Zustand; store holds UI playback/recording fields only

## Layers

**Presentation (routes):**
- Purpose: File-based navigation and app lifecycle
- Location: `app/`
- Contains: `_layout.tsx`, `(tabs)/`, stack screens that re-export feature/component screens
- Depends on: `components/`, `features/`, `store/`, `i18n/`, `hooks/`
- Used by: Expo Router entry (`package.json` `"main": "expo-router/entry"`)

**Presentation (UI):**
- Purpose: Screens and reusable widgets
- Location: `components/`, `features/`
- Contains: Feature verticals (`features/profile`, `features/recycleBin`) and shared UI (`components/*`)
- Depends on: `store/`, `hooks/`, `shared/`, `services/`, `utils/`, `constants/`, `styles/`
- Used by: `app/` route files only (features must not import `app/`)

**State:**
- Purpose: Single source of truth for entries, user, weather, AI, audio UI, locale, sync status
- Location: `store/`
- Contains: `useAppStore.ts`, `modules/{entries,user,weather,ai,audio,locale,storage,types}.ts`
- Depends on: `services/`, `shared/`, `lib/supabase.ts`, `utils/`
- Used by: UI layers via selectors (`useAppStore(s => s.entries)`)

**Domain shared (pure):**
- Purpose: Testable pure functions with no React/store coupling
- Location: `shared/`
- Contains: `entries/`, `sync/`, `audio/` (coordinator modules + pure helpers), `share/`, `retention/`, `weather/`, `formatting/`, `time-range/`, `responsive/`
- Depends on: `types.ts`, limited `utils/` (e.g. logger in audio coordinator) — must not import `app/`, `features/`, `components/`, `store/`
- Used by: store, services, components, tests under `__tests__/unit/shared/`

**Services:**
- Purpose: Side-effectful orchestration (Supabase tombstones, audio upload, reminders, locale settings)
- Location: `services/`
- Contains: `audioSync.ts`, `entryTombstones.ts`, `emotionReminders.ts`, `companionDaysService.ts`, etc.
- Depends on: `lib/`, `shared/`, external SDKs
- Used by: store slices and feature hooks

**Utils / Lib:**
- Purpose: Cross-cutting helpers and SDK wrappers
- Location: `utils/`, `lib/`
- Contains: `aiService.ts`, `errorHandler.ts`, `logger.ts`, `storage.ts` (`StorageManager`), `lib/supabase.ts`
- Depends on: env/config, third-party clients
- Used by: store, services, UI

**Domain types:**
- Purpose: Core models (`MoodEntry`, `User`, enums)
- Location: `types.ts`, `types/`
- Contains: Mood/audio/user models; companion-days and component helper types
- Depends on: nothing app-layer
- Used by: all layers

## Data Flow

### Primary Request Path — create entry

1. User submits form in `components/EntryEditor` via `components/Record.tsx` → Tab `app/(tabs)/record.tsx`
2. Call `useAppStore.getState().addEntry(...)` (`store/modules/entries.ts`)
3. Slice assigns UUID via `generateEntryId()` (`shared/entries/visibility.ts`), prepends to `entries`, updates `firstEntryDate`, calls `_saveEntries()` (500ms debounce → AsyncStorage via `getStorageKey` / `saveToStorage` in `store/modules/storage.ts`) and `_calculateWeather()` (`store/modules/weather.ts`)
4. Logged-in sync (profile/handlers or post-auth) calls `syncToCloud()` (`store/useAppStore.ts`) → upsert `entries` + `uploadPendingAudios` (`services/audioSync.ts`)

### Soft delete → recycle bin → purge

1. `deleteEntry(id)` sets `deletedAt` only; entry remains in `entries` (`store/modules/entries.ts`)
2. Main UI uses `excludeSoftDeletedEntries` (`shared/entries/visibility.ts`); recycle bin uses `onlySoftDeletedEntries`
3. `restoreEntry` clears `deletedAt`; `purgeEntryForever` removes locally, `insertEntryTombstone` (`services/entryTombstones.ts`), then `syncToCloud` deletes cloud rows for tombstone ids only

### Cloud pull / recover memories

1. `syncFromCloud` / `recoverFromCloud` (`store/useAppStore.ts`) fetch tombstones + cloud `entries`
2. Transform snake_case columns → camelCase `MoodEntry`
3. `mergeCloudPullEntries` (`shared/sync/cloudMerge.ts`): local first, same id overwritten by cloud, tombstones filtered, sort by `timestamp` desc
4. Persist merged array to AsyncStorage; recalculate weather

### App startup

1. `app/_layout.tsx` → `initI18n()` → `initializeStore()` (`store/useAppStore.ts`)
2. `_loadUser` → `initializeFirstEntryDate` → entries hydrate (guest or user key) → optional `onAuthStateChange`
3. Hosts: `RecordingSessionHost`, `MetaphorOnboardingHost`; Splash hides when fonts + i18n + init ready

### AI forecast / podcast

1. Insights UI → `generateForecast` / `generatePodcast` (`store/modules/ai.ts`)
2. Slice filters soft-deleted entries then calls `utils/aiService.ts` (Groq)
3. Results stored on store (`emotionForecast` / `emotionPodcast`) with cache TTL inside AI util

**State Management:**
- Zustand `create<AppState>()` composing slice creators; sync APIs live on root store in `useAppStore.ts`
- Select narrowly in components; mutate only through named actions (`addEntry`, `deleteEntry`, …)
- Sync concurrency: `shared/sync/syncLock.ts` (`tryBeginSync` / pending queue / `processPendingSync`)

## Key Abstractions

**MoodEntry:**
- Purpose: Primary domain record (mood, tags, status, soft-delete, audios)
- Examples: `types.ts`, `store/modules/entries.ts`
- Pattern: Immutable updates via `map`/`filter` into new `entries` arrays

**Zustand ModuleCreator / slices:**
- Purpose: Typed slice contracts composed into `AppState`
- Examples: `store/modules/types.ts`, `store/modules/entries.ts`, `store/modules/user.ts`
- Pattern: `createXSlice(set, get, store)` returning partial state + actions

**Visibility helpers:**
- Purpose: Single definition of soft-delete visibility for UI/stats/AI
- Examples: `shared/entries/visibility.ts`
- Pattern: Pure predicates/filters; never mutate store inside shared

**Cloud merge / tombstone:**
- Purpose: Explicit permanent delete + cloud-wins pull
- Examples: `shared/sync/cloudMerge.ts`, `shared/sync/tombstone.ts`, `services/entryTombstones.ts`
- Pattern: No “cloud has / local missing ⇒ delete”; only tombstone-driven cloud DELETE

**Audio coordinators:**
- Purpose: One expo-audio player and one recording session; sync patches into store without importing store
- Examples: `shared/audio/coordinator.ts`, `shared/audio/recordingCoordinator.ts`
- Pattern: `init*Coordinator(setPatch)` at store create time; UI calls coordinator APIs; store exposes `pauseAudio` / `stopAudio`

**Storage key isolation:**
- Purpose: Guest vs per-user AsyncStorage namespaces
- Examples: `store/modules/storage.ts` (`getStorageKey`, migrate guest↔user)
- Pattern: Never write `mood_entries_*` via raw AsyncStorage outside storage module helpers

## Entry Points

**Expo Router / Metro:**
- Location: `expo-router/entry` (via `package.json` `main`)
- Triggers: App launch (iOS/Android/Web)
- Responsibilities: Boot native shell, load `app/_layout.tsx`

**Root layout:**
- Location: `app/_layout.tsx`
- Triggers: First render of navigation tree
- Responsibilities: Gesture root, ErrorBoundary, Stack registration, store/i18n lifecycle, background audio cancel

**Tab routes:**
- Location: `app/(tabs)/index.tsx`, `record.tsx`, `insights.tsx`
- Triggers: Tab bar / deep link `emotiondiary://…` (`app.json` scheme `emotiondiary`)
- Responsibilities: Mount screen components; stop audio on blur via `hooks/useStopAudioOnTabBlur.ts`

**Stack routes:**
- Location: `app/profile.tsx`, `app/recycle-bin.tsx`, `app/review-export.tsx`, `app/dev-seed-retention.tsx`
- Triggers: `router.push`, deep links, Maestro flows
- Responsibilities: Delegate to feature/component screens

**Edge function:**
- Location: `supabase/functions/delete-account/`
- Triggers: Account deletion from user slice
- Responsibilities: Server-side account cleanup

## Architectural Constraints

- **Threading:** Single JS event loop (React Native); async I/O for storage/network; Reanimated/Skia on UI worklets where used — do not block store actions with long sync loops when avoidable
- **Global state:** One Zustand store (`store/useAppStore.ts`); module-level singletons for audio/recording coordinators and sync lock (`shared/audio/*`, `shared/sync/syncLock.ts`)
- **Circular imports:** Audio coordinators must not import `store/` (inject `set` via `init*`); `RecordingState` type shared from `types.ts` / re-exported in `store/modules/types.ts`
- **Layer boundaries (ESLint `eslint-plugin-boundaries` in `eslint.config.js`):**
  - `store` / `components` / `features` must not import `app/`
  - `features` must not import other `features/`
  - `shared` must not import `app/`, `features/`, `components/`, `store/`
- **Path alias:** `@/*` → repo root (`tsconfig.json`)

## Anti-Patterns

### Mutating entries outside slice actions

**What happens:** Component does `useAppStore.setState({ entries: ... })` or writes AsyncStorage directly  
**Why it's wrong:** Skips soft-delete rules, weather recalculation, debounce save, and multi-account keys  
**Do this instead:** Call `addEntry` / `updateEntry` / `deleteEntry` / `restoreEntry` / `purgeEntryForever` in `store/modules/entries.ts`

### Soft-delete vs tombstone confusion

**What happens:** Writing `entry_tombstones` on ordinary delete, or deleting cloud rows because “local array missing id”  
**Why it's wrong:** Violates soft-delete/recycle-bin product rules and can wipe recoverable cloud data  
**Do this instead:** Soft delete only sets `deletedAt`; tombstones only on `purgeEntryForever`; sync DELETE only for tombstone ids (`shared/sync/tombstone.ts` comments)

### Second audio player or store-held native handle

**What happens:** Creating another `createAudioPlayer` in a component, or storing the player instance on Zustand  
**Why it's wrong:** Overlapping playback and lifecycle leaks; store must stay serializable UI state  
**Do this instead:** Use `shared/audio/coordinator.ts` for play/pause/stop; recording via `recordingCoordinator` + `clipBinding` on `AudioRecorder`

### Feature cross-imports or shared importing UI

**What happens:** `features/profile` imports `features/recycleBin`, or `shared/x` imports a React screen  
**Why it's wrong:** Breaks governance boundaries and pure-layer testability  
**Do this instead:** Share via `shared/` pure helpers or lift UI to `components/`; navigate between features only through `app/` routes

## Error Handling

**Strategy:** Convert unknown errors to user-facing i18n strings at sync/auth boundaries; log with structured logger; UI ErrorBoundary for render crashes.

**Patterns:**
- Sync/auth: local `getErrorMessage` in `store/useAppStore.ts` + `isNetworkError` / `isAuthError` from `utils/errorHandler.ts`
- Render: `components/ErrorBoundary.tsx` wraps root tree; logs via `utils/logger.ts`
- Prefer `logger` for new code; avoid production info spam (see `utils/logger.ts`)

## Cross-Cutting Concerns

**Logging:** `utils/logger.ts` — `logger.error(tag, message, meta)`; used by layout, ErrorBoundary, audio coordinator  
**Validation:** Domain enums/types in `types.ts`; DB constraints handled on sync (e.g. Postgres `23514` / RLS `42501` fallbacks in `syncToCloud`)  
**Authentication:** Supabase Auth via `lib/supabase.ts`; session checks inside sync; user slice owns login/register/logout/deleteAccount (`store/modules/user.ts`)  
**i18n:** `i18n/` + `locales/{zh-Hans,en-US}/`; preference in `store/modules/locale.ts`  
**Governance:** `yarn verify:governance` / ESLint boundaries; planning docs under `.planning/` only

---

*Architecture analysis: 2026-07-30*
