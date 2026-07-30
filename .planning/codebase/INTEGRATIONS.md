---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
# External Integrations

**Analysis Date:** 2026-07-30

## APIs & External Services

**Backend (BaaS):**
- Supabase - Auth, Postgres rows for mood entries/profiles/tombstones, Storage for audio, Edge Function for account deletion
  - SDK/Client: `@supabase/supabase-js` via `lib/supabase.ts`
  - Auth: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Offline fallback: placeholder client when env missing (`isSupabaseConfigured()` in `lib/supabase.ts`)

**AI inference:**
- Groq Chat Completions API - Emotion insights, forecasts, podcasts, review closing summaries
  - Client: direct `fetch` in `utils/aiService.ts` (no Groq SDK)
  - Endpoint: `https://api.groq.com/openai/v1/chat/completions`
  - Model: `llama-3.1-8b-instant`
  - Auth: `EXPO_PUBLIC_GROQ_API_KEY` (Bearer header)
  - Store wiring: `store/modules/ai.ts`

**Local notifications (device, not push SaaS):**
- `expo-notifications` - Daily/weekly local reminder schedules
  - Implementation: `services/emotionReminders.ts`, settings in `services/reminderSettings.ts`
  - Web: unsupported / degraded (returns reason `"web"`)

**Weather metaphor:**
- Not an external weather API - mood→weather narrative/buckets are local
  - `shared/weather/weatherNarrative.ts`, `store/modules/weather.ts`, `utils/reviewStatsWeather.ts`

## Data Storage

**Databases:**
- Supabase Postgres (remote)
  - Connection: `EXPO_PUBLIC_SUPABASE_URL` + anon key (PostgREST via JS client)
  - Client: `@supabase/supabase-js` (no ORM)
  - Tables in use (from client + migrations):
    - `entries` — mood entries; soft-delete column `deletedat` (`supabase/migrations/20260514200000_entries_deleted_at.sql`)
    - `profiles` — user profile rows (`store/modules/user.ts`)
    - `entry_tombstones` — purge-from-cloud markers (`supabase/migrations/20260514000000_entry_tombstones.sql`, `services/entryTombstones.ts`)
  - Sync orchestration: `store/useAppStore.ts` (`syncToCloud` / `syncFromCloud`), `store/modules/entries.ts`

**File Storage:**
- Supabase Storage bucket `audios` — upload/download/delete of `.m4a` clips (`services/audioSync.ts`)
- Local filesystem / app sandbox — recording URIs via `expo-audio` + `expo-file-system`
- Device photo library — save share images via `expo-media-library` (plugin in `app.json`)

**Caching:**
- AsyncStorage — entries, settings, reminder prefs, profile cache (`utils/storage.ts`, `store/modules/storage.ts`)
- In-memory TTL cache for Groq responses (`utils/aiService.ts`, max 50 entries)
- No Redis / CDN cache layer

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email + password)
  - Implementation: `store/modules/user.ts`
    - `supabase.auth.signUp`
    - `supabase.auth.signInWithPassword`
    - `supabase.auth.signOut`
    - `supabase.auth.getSession` / `onAuthStateChange` (also in `store/useAppStore.ts`)
  - Session persistence: `expo-secure-store` adapter in `lib/supabase.ts` (`SecureStoreAdapter`)
  - Guest ↔ authenticated data migration: `store/modules/storage.ts` helpers

**Account deletion:**
- Client invokes Edge Function `delete-account` via `supabase.functions.invoke` (`store/modules/user.ts`)
- Server: `supabase/functions/delete-account/index.ts` (Deno)
  - Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Edge Function secrets — not client env)
  - Deletes `entry_tombstones`, `entries`, `profiles`, then `auth.admin.deleteUser`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry/Crashlytics/PostHog (confirmed in `utils/logger.ts` comments)

**Logs:**
- In-app `utils/logger.ts` — leveled console logging; gated by `utils/env.ts` (`NODE_ENV`)
- Prefer `logger` over raw `console` for new code; Metro production minify drops `console` (`metro.config.js` `drop_console: true`)

## CI/CD & Deployment

**Hosting:**
- Native apps: Apple App Store + Google Play (EAS Build)
- Expo EAS project: `app.json` `extra.eas.projectId`
- Web: Expo static web (`yarn web` / Playwright against `npx expo start --web`)
- Backend: Supabase-hosted Postgres, Storage, Auth, Edge Functions

**CI Pipeline:**
- GitHub Actions `.github/workflows/ci.yml`
  - PR: `yarn typecheck` → `yarn lint` → `yarn test` (Node 22, Yarn cache)
  - Push to `master`: same plus `yarn verify:governance` and `scripts/verify-governance-smoke.js`
- E2E (local only, not in CI): `yarn test:e2e` (Playwright), `yarn test:maestro` (Maestro)

**Release tooling:**
- `eas.json` profiles: `development`, `preview` (internal APK), `production` (AAB / App Store)
- Scripts: `yarn build:preview`, `yarn build:production`, `yarn build:ios`, `yarn build:ios:production`
- Config verifiers: `scripts/verify-eas-config.js`, `scripts/verify-all-configs.js`, privacy/permissions/icon scripts

## Environment Configuration

**Required env vars (client):**
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — public anon key (RLS-protected)
- `EXPO_PUBLIC_GROQ_API_KEY` — Groq API key for AI features

**Edge Function secrets (server-side only):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional / tooling:**
- `NODE_ENV` — development / test / production (`utils/env.ts`, EAS production profile)
- `CI` — Playwright retries/reporter (`playwright.config.ts`)
- `E2E_SHARE_WEB_DOWNLOAD` — gates a Playwright share-download scenario (`e2e/share-card-web-download.spec.ts`)

**Secrets location:**
- Local: `.env` (gitignored); template `.env.example` (no secrets)
- EAS: EAS Secrets / build env for store builds
- Supabase Dashboard: Edge Function secrets for service role
- Never commit `.env`, JWTs, or `gsk_*` keys — checked by `scripts/verify-env-security.js`

## Webhooks & Callbacks

**Incoming:**
- None — no public HTTP webhook endpoints in the app repo
- Deep link scheme: `emotiondiary` (`app.json` `scheme`) via `expo-linking` / Expo Router

**Outgoing:**
- HTTPS to Groq Chat Completions (`utils/aiService.ts`)
- HTTPS to Supabase Auth / PostgREST / Storage / Functions (`lib/supabase.ts` and callers)
- No third-party analytics beacons

## Integration Map (quick reference)

| Concern | Primary files |
|---------|----------------|
| Supabase client | `lib/supabase.ts` |
| Auth / profile / delete | `store/modules/user.ts` |
| Entry sync | `store/useAppStore.ts`, `store/modules/entries.ts` |
| Tombstones | `services/entryTombstones.ts`, `supabase/migrations/20260514000000_entry_tombstones.sql` |
| Audio cloud | `services/audioSync.ts` |
| AI | `utils/aiService.ts`, `store/modules/ai.ts` |
| Local reminders | `services/emotionReminders.ts` |
| Soft-delete column | `supabase/migrations/20260514200000_entries_deleted_at.sql` |
| Account wipe Edge Fn | `supabase/functions/delete-account/index.ts` |

---

*Integration audit: 2026-07-30*
