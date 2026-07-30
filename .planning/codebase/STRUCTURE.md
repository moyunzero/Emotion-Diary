---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
# Codebase Structure

**Analysis Date:** 2026-07-30

## Directory Layout

```
Emotion-Diary/
├── app/                    # Expo Router routes (file = route)
│   ├── _layout.tsx         # Root Stack, splash, store/i18n init
│   ├── (tabs)/             # Tab group (not in URL path)
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # Dashboard tab
│   │   ├── record.tsx
│   │   └── insights.tsx
│   ├── profile.tsx
│   ├── recycle-bin.tsx
│   ├── review-export.tsx
│   └── dev-seed-retention.tsx
├── components/             # Shared / screen UI
│   ├── AudioRecorder/
│   ├── Dashboard.tsx
│   ├── EntryCard.tsx
│   ├── EntryEditor/
│   ├── Insights/
│   ├── ReviewExport/
│   ├── onboarding/
│   ├── retention/
│   ├── rituals/
│   ├── settings/
│   ├── share/
│   └── ...
├── features/               # Vertical feature modules
│   ├── profile/
│   └── recycleBin/
├── store/                  # Zustand root + slices
│   ├── useAppStore.ts
│   ├── refreshSystemLocaleIfNeeded.ts
│   └── modules/
├── shared/                 # Pure / coordinator helpers (no UI/store imports)
│   ├── audio/
│   ├── entries/
│   ├── sync/
│   ├── share/
│   ├── retention/
│   ├── weather/
│   ├── formatting/
│   ├── time-range/
│   └── responsive/
├── services/               # Side-effect orchestration
├── utils/                  # Cross-cutting utilities (AI, logger, errors)
├── lib/                    # SDK clients (`supabase.ts`)
├── hooks/                  # React hooks
├── constants/              # colors, spacing, performance knobs
├── styles/                 # Shared StyleSheet factories / tokens
├── types.ts                # Core domain models
├── types/                  # Extra TS types (companionDays, components)
├── i18n/                   # i18next bootstrap + locale helpers
├── locales/                # Translation JSON (zh-Hans, en-US, native)
├── assets/                 # Images / icons
├── supabase/
│   ├── migrations/
│   └── functions/delete-account/
├── __tests__/unit/         # Jest unit tests (mirrors source tree)
├── e2e/                    # Playwright (Expo Web)
├── .maestro/               # Maestro native E2E flows
├── acceptance/             # Acceptance fixtures / notes
├── scripts/                # verify-*, maestro-preflight, build helpers
├── .planning/              # Sole planning/engineering docs root
├── .github/workflows/      # CI
├── app.json                # Expo config (scheme emotiondiary)
├── eas.json
├── package.json
├── tsconfig.json           # `@/*` paths
├── eslint.config.js        # boundaries governance
├── jest.config.* / babel / metro
└── AGENTS.md
```

## Directory Purposes

**`app/`:**
- Purpose: Routing and app shell only — keep files thin
- Contains: Layouts and default-export route components
- Key files: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`

**`components/`:**
- Purpose: Reusable UI and primary screen implementations used by multiple routes
- Contains: PascalCase `.tsx`, feature subfolders (`Insights/`, `AudioRecorder/`, …)
- Key files: `components/Dashboard.tsx`, `components/EntryCard.tsx`, `components/EntryEditor/`, `components/MoodForm.tsx`

**`features/`:**
- Purpose: Self-contained verticals with screen + local hooks/styles/utils
- Contains: One folder per feature; no cross-feature imports
- Key files: `features/profile/ProfileScreen.tsx`, `features/profile/index.ts`, `features/recycleBin/RecycleBinScreen.tsx`

**`store/`:**
- Purpose: Global state and sync orchestration
- Contains: Root store + `modules/*.ts` slice implementations and `types.ts` contracts
- Key files: `store/useAppStore.ts`, `store/modules/entries.ts`, `store/modules/user.ts`, `store/modules/storage.ts`, `store/modules/types.ts`

**`shared/`:**
- Purpose: Pure domain logic + audio coordinators (no React screens)
- Contains: Domain folders with `.ts` helpers; partial barrel `shared/index.ts` (formatting/time-range/responsive only)
- Key files: `shared/entries/visibility.ts`, `shared/sync/cloudMerge.ts`, `shared/sync/tombstone.ts`, `shared/audio/coordinator.ts`

**`services/`:**
- Purpose: I/O-facing workflows (Supabase ops, notifications, seeds)
- Contains: camelCase service modules
- Key files: `services/audioSync.ts`, `services/entryTombstones.ts`, `services/emotionReminders.ts`

**`utils/`:**
- Purpose: App-wide helpers that may touch env/network/logging
- Contains: `aiService.ts`, `errorHandler.ts`, `logger.ts`, `StorageManager` in `storage.ts`
- Key files: `utils/aiService.ts`, `utils/logger.ts`, `utils/env.ts`

**`lib/`:**
- Purpose: Third-party client singletons
- Contains: `lib/supabase.ts` only (primary)

**`hooks/`:**
- Purpose: Reusable React hooks (responsive, haptics, tab blur audio stop)
- Key files: `hooks/useResponsiveStyles.ts`, `hooks/useStopAudioOnTabBlur.ts`, `hooks/useThemeStyles.ts`

**`constants/` / `styles/`:**
- Purpose: Design tokens and shared StyleSheets
- Key files: `constants/colors.ts`, `constants/spacing.ts`, `styles/sharedStyles.ts`, `styles/components/*.styles.ts`

**`i18n/` / `locales/`:**
- Purpose: Localization runtime and message catalogs
- Key files: `i18n/index.ts`, `i18n/mapDeviceLocale.ts`, `locales/zh-Hans/`, `locales/en-US/`

**`__tests__/unit/`:**
- Purpose: Jest/ts-jest unit tests mirroring `shared/`, `utils/`, `i18n/`, `store/`, `services/`
- Key pattern: `__tests__/unit/shared/sync/cloudMerge.test.ts`

**`.planning/`:**
- Purpose: Project/state/roadmap, domain contracts, codebase maps
- Key files: `.planning/codebase/ENGINEERING-SYSTEM.md`, `ENGINEERING-QUALITY.md`, this map

## Key File Locations

**Entry Points:**
- `package.json` (`main`: `expo-router/entry`): Metro/Expo bootstrap
- `app/_layout.tsx`: Root React tree and store initialization
- `app/(tabs)/index.tsx`: Default tab (Dashboard)

**Configuration:**
- `app.json` / `eas.json`: App identity, scheme `emotiondiary`, EAS profiles
- `tsconfig.json`: `strict` + `@/*`
- `eslint.config.js`: Layer boundaries (GOV)
- `metro.config.js` / `babel.config.js`: Bundler (Reanimated plugin last)
- `.nvmrc`: Node version pin

**Core Logic:**
- `store/useAppStore.ts`: Slice composition + sync
- `store/modules/entries.ts`: Entry lifecycle
- `types.ts`: `MoodEntry` and related models
- `lib/supabase.ts`: Cloud client
- `shared/sync/*` + `shared/entries/*`: Merge/visibility contracts

**Testing:**
- `__tests__/unit/**/*.test.ts`: Unit
- `e2e/*.spec.ts`: Playwright Web
- `.maestro/flows/`: Native E2E
- `playwright.config.ts`: E2E config

## Naming Conventions

**Files:**
- React components / screens: `PascalCase.tsx` — e.g. `EntryCard.tsx`, `ProfileScreen.tsx`
- Hooks: `useXxx.ts` — e.g. `useProfileSyncHandlers.ts`
- Utilities / services / shared modules: `camelCase.ts` — e.g. `cloudMerge.ts`, `audioSync.ts`
- Style factories: `*.styles.ts` under `styles/components/` or feature `styles/`
- Tests: `*.test.ts` under `__tests__/unit/...` mirroring source path
- Route files: lowercase / kebab Expo Router names — `recycle-bin.tsx`, `review-export.tsx`

**Directories:**
- Feature folders: camelCase (`recycleBin`) or lowercase (`profile`)
- Shared domain folders: lowercase / kebab (`time-range`, `entries`)
- Component groups: PascalCase folder matching domain (`AudioRecorder`, `Insights`)

**Symbols:**
- Components: `PascalCase`
- Functions: `camelCase` (`addEntry`, `mergeCloudPullEntries`)
- Types/interfaces: `PascalCase` (`MoodEntry`, `EntriesModule`)
- Enums: `PascalCase` enum + `UPPER` members (`MoodLevel.ANGRY`)
- Private store helpers: `_loadEntries`, `_saveEntries`, `_calculateWeather` prefix

**Imports:**
- Prefer `@/` alias for cross-tree imports (`@/features/profile`, `@/shared/entries/visibility`)
- Relative imports OK within the same feature/component folder

## Where to Add New Code

**New Feature (full screen):**
- Route stub: `app/<name>.tsx` (and register in `app/_layout.tsx` Stack if needed)
- Implementation: Prefer `features/<name>/` with `XxxScreen.tsx` + `index.ts` barrel when self-contained; otherwise `components/`
- Tests: `__tests__/unit/...` for pure logic; Maestro/Playwright for flows
- Do not import from `app/` inside `features/` or `components/`

**New Tab:**
- `app/(tabs)/<name>.tsx` + register `Tabs.Screen` in `app/(tabs)/_layout.tsx`
- Screen body in `components/` or `features/`

**New Zustand slice:**
1. Extend interface in `store/modules/types.ts`
2. Implement `createXSlice` / `createXModule` in `store/modules/<name>.ts`
3. Spread into `useAppStore` in `store/useAppStore.ts`
4. Add unit tests under `__tests__/unit/store/` when behavior is non-trivial

**New domain pure helper:**
- `shared/<domain>/<name>.ts` + test `__tests__/unit/shared/<domain>/<name>.test.ts`
- Must not import store/components/features/app

**New remote / device orchestration:**
- `services/<name>.ts` (Supabase/notifications/file I/O)
- Call from store actions or feature hooks — not from deep pure shared modules that should stay pure

**New utility:**
- `utils/<name>.ts` for generic helpers; keep domain-pure logic in `shared/` when possible

**New UI primitive:**
- `components/<Name>.tsx` (+ optional `styles/components/<Name>.styles.ts`)
- Constants/tokens in `constants/` or `styles/`

**i18n strings:**
- Add keys under `locales/zh-Hans/` and `locales/en-US/` namespaces; resolve via `useTranslation` / `i18n.t`

## Special Directories

**`.planning/`:**
- Purpose: GSD project docs, domain specs, engineering facts, codebase maps
- Generated: No (hand-maintained; mappers write `ARCHITECTURE.md` / `STRUCTURE.md` etc.)
- Committed: Yes

**`supabase/`:**
- Purpose: Migrations and Edge Functions
- Generated: Migrations authored; function deploy artifacts may be remote
- Committed: Source under `supabase/` yes; do not commit secrets

**`ios/` (and Android when present):**
- Purpose: Native project shells for Expo prebuild / EAS
- Generated: Partially (Expo / CocoaPods)
- Committed: Project sources as required by the repo; `Pods` typically local

**`.maestro/` / `e2e/` / `acceptance/`:**
- Purpose: Automated and acceptance verification assets
- Generated: No
- Committed: Yes

**`node_modules/` / `.expo/` / `dist/`:**
- Purpose: Dependencies and build caches
- Generated: Yes
- Committed: No

**`app-store-submission/` (if present):**
- Purpose: Store listing materials
- Generated: No
- Committed: As project policy

---

*Structure analysis: 2026-07-30*
