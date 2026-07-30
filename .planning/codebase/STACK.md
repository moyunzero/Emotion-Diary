---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
# Technology Stack

**Analysis Date:** 2026-07-30

## Languages

**Primary:**
- TypeScript ~5.9.2 - App code (`app/`, `components/`, `features/`, `store/`, `services/`, `shared/`, `utils/`, `hooks/`, `lib/`), typed with `strict: true` in `tsconfig.json`
- TSX / React JSX - Expo Router screens and UI components

**Secondary:**
- JavaScript (CommonJS) - Tooling and governance scripts (`scripts/*.js`, `babel.config.js`, `metro.config.js`, `eslint.config.js`)
- SQL - Supabase migrations under `supabase/migrations/`
- Deno TypeScript - Edge Function `supabase/functions/delete-account/index.ts`
- YAML - Maestro E2E flows (`.maestro/`), GitHub Actions (`.github/workflows/ci.yml`), EAS (`eas.json`)
- JSON - i18n catalogs (`locales/`), Expo config (`app.json`), package manifest

## Runtime

**Environment:**
- Node.js `>=20.0.0` (`package.json` `engines`); `.nvmrc` pins `20`
- CI uses Node 22 (`.github/workflows/ci.yml`)
- Mobile/Web: Expo / React Native runtime (Hermes on native; browser for web)

**Package Manager:**
- Yarn Classic 1.x (observed `1.22.22`)
- Lockfile: `yarn.lock` present (committed)

## Frameworks

**Core:**
- Expo ~54.0.30 - Cross-platform app shell, plugins, EAS builds (`app.json`, `eas.json`)
- Expo Router ~6.0.21 - File-based routing (`app/`, entry `expo-router/entry` in `package.json`)
- React 19.1.0 + React Native 0.81.5 - UI runtime
- React Native Web ~0.21.0 + `react-dom` 19.1.0 - Web target (`yarn web`)
- Zustand ^5.0.9 - Global state (`store/useAppStore.ts`, `store/modules/*`)
- React Navigation 7.x - Tabs/native primitives via Expo Router (`@react-navigation/*`)

**Testing:**
- Jest 29.7.0 + ts-jest 29.4.0 - Unit tests (`package.json` `jest` block, `__tests__/`)
- Playwright ^1.52.0 - Web E2E (`playwright.config.ts`, `e2e/`)
- Maestro - Native E2E (`.maestro/flows/`, `yarn test:maestro`)

**Build/Dev:**
- Metro (Expo default) - Bundler; production minify tuned in `metro.config.js`
- Babel `babel-preset-expo` + `react-native-reanimated/plugin` (`babel.config.js`)
- TypeScript compiler - `yarn typecheck` (`tsc --noEmit`)
- ESLint 9 + `eslint-config-expo` + `eslint-plugin-boundaries` (`eslint.config.js`)
- EAS Build - Android/iOS store and preview profiles (`eas.json`)
- Expo experiments: `typedRoutes`, `reactCompiler` (`app.json`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.89.0 - Auth, Postgres sync, Storage, Edge Function invoke (`lib/supabase.ts`)
- `expo-audio` ~1.1.1 - Recording/playback (coordinated via `shared/audio/`)
- `expo-secure-store` ~15.0.8 - Auth session storage adapter for Supabase (`lib/supabase.ts`)
- `@react-native-async-storage/async-storage` ^2.2.0 - Offline persistence (`utils/storage.ts`, store modules)
- `i18next` ^26.3.1 + `react-i18next` ^17.0.8 - Localization (`i18n/`, `locales/`)
- `zod` ^4.3.5 - Runtime validation where used
- `js-md5` ^0.8.3 - Audio file hash for integrity (`types.ts` `AudioData.fileHash`)

**UI / media:**
- `@shopify/flash-list` 2.0.2 - High-performance lists
- `@shopify/react-native-skia` 2.2.12 - Canvas/graphics
- `react-native-reanimated` ~4.1.1 + `react-native-worklets` 0.5.1 - Animations
- `react-native-gesture-handler` ~2.28.0 - Gestures
- `react-native-svg` 15.12.1 + `lucide-react-native` - Icons/SVG
- `expo-image` ~3.0.11 - Image loading
- `react-native-view-shot` 4.0.3 - Share/export capture
- `expo-media-library` ~18.2.1 - Save share images to photos
- `@expo-google-fonts/lato` ^0.4.1 + `expo-font` - Typography
- `expo-haptics` ~15.0.8 - Tactile feedback
- `expo-notifications` ~0.32.17 - Local reminders (`services/emotionReminders.ts`)
- `expo-localization` ~17.0.9 - Device locale (`i18n/mapDeviceLocale.ts`)
- `expo-file-system` ~18.1.6 - Local file access for audio/media
- `expo-device` ~8.0.10 - Device identity/info

**Infrastructure:**
- `react-native-url-polyfill` ^3.0.0 - URL support for Supabase client
- `react-native-safe-area-context` / `react-native-screens` - Navigation chrome
- `expo-linking` / `expo-web-browser` / `expo-splash-screen` / `expo-system-ui` / `expo-status-bar` / `expo-constants` / `expo-symbols` / `@expo/vector-icons` - Expo platform modules

**Dev / governance tooling:**
- `dependency-cruiser`, `madge`, `depcheck`, `knip` (via `knip.json`) - Dependency and boundary analysis
- `source-map-explorer` - Bundle inspection
- `commander`, `inquirer`, `glob` - CLI scripts under `scripts/`

## Configuration

**Environment:**
- Local: `.env` present (gitignored); template `.env.example` present — do not commit secrets
- Client-facing vars must use `EXPO_PUBLIC_*` prefix (Expo bundling)
- Production builds: configure via EAS Secrets / EAS env (referenced in `lib/supabase.ts` warnings)
- Validate with `yarn verify:env` → `scripts/verify-env-security.js`

**Key configs required (names only):**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GROQ_API_KEY` (AI features; optional for offline-only use)

**Build:**
- `app.json` - Expo app identity, plugins, New Architecture (`newArchEnabled: true`), bundle IDs
- `eas.json` - development / preview / production profiles
- `tsconfig.json` - Extends `expo/tsconfig.base`; path alias `@/*` → repo root
- `babel.config.js`, `metro.config.js` - Transform and minify
- `playwright.config.ts` - Web E2E against Expo web on port 8081
- `eslint.config.js` - Lint + layer boundaries
- `knip.json` - Dead-code allowlists under `scripts/governance/`

## Platform Requirements

**Development:**
- Node ≥ 20, Yarn, Expo CLI via `npx expo` / `yarn start`
- iOS: Xcode + Simulator (min iOS 15.1 per `app.json`); `yarn ios`
- Android: Android SDK / emulator; `yarn android`
- Web: `yarn web` (static web output configured in `app.json`)
- Optional: Maestro CLI for native E2E; Playwright for web E2E

**Production:**
- iOS App Store — bundle `com.moyunzero.emotiondiary` (`app.json`)
- Android — package `com.moyunzero.emotiondiary`; production AAB via EAS (`eas.json` `production`)
- EAS project id in `app.json` `extra.eas.projectId`
- Web static export capability via Expo (`app.json` `web.output: "static"`)
- Backend: Supabase (Auth + Postgres + Storage + Edge Functions); Groq HTTPS API for AI

---

*Stack analysis: 2026-07-30*
