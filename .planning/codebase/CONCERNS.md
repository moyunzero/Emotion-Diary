---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---

# Codebase Concerns

**Analysis Date:** 2026-07-30

## Tech Debt

**Oversized UI / service modules:**
- Issue: Several files exceed ~500–1000 lines, concentrating auth UI, AI prompts, sync orchestration, and entry cards in single modules. Hard to review and easy to regress unrelated behavior.
- Files: `features/profile/components/ProfileSettingsSection.tsx` (~1003), `utils/aiService.ts` (~960), `components/EntryCard.tsx` (~892), `store/useAppStore.ts` (~794), `store/modules/user.ts` (~771), `components/ReviewExport/ReviewExportScreen.tsx` (~559), `components/MoodForm.tsx` (~541), `components/EntryEditor/EntryEditor.tsx` (~529), `shared/audio/recordingCoordinator.ts` (~473)
- Impact: Slow reviews; high merge-conflict risk; accidental coupling between unrelated UI and domain logic
- Fix approach: Split by concern (settings sections, AI forecast/podcast/prescription, card playback vs actions, sync actions out of `useAppStore` into dedicated modules). Prefer extracting pure helpers already started in `shared/`

**Dual sync status surfaces:**
- Issue: Store `StoreSyncStatus` (`idle` | `syncing` | `pending` | `error`) in `store/modules/types.ts` coexists with Profile UI `SyncStatus` (`idle` | `syncing` | `success` | `error`) in `features/profile/hooks/useProfileScreenState.ts`. Handlers in `features/profile/hooks/useProfileSyncHandlers.ts` map and reset both with timeouts
- Impact: Status flicker / mismatched labels when store returns `pending` while UI shows `syncing`; harder to reason about a single source of truth
- Fix approach: Drive Profile chrome from store `syncStatus` only, or introduce one shared sync-state machine

**Weather copy not i18n-backed:**
- Issue: `store/modules/weather.ts` hardcodes Chinese `description` strings (`关系晴朗`, `相处不错哦~`, etc.) while the app supports `zh-Hans` / `en-US`
- Impact: English locale still shows Chinese weather descriptions
- Fix approach: Move strings into `locales/*/insights.json` (or `common`) and resolve via `effectiveLocale`

**Incomplete audio download path:**
- Issue: `downloadAudio` in `services/audioSync.ts` calls Storage `.download()` then returns `{ success: true }` without writing a local file or returning `localPath`
- Impact: Callers cannot hydrate offline playback from cloud blobs through this API; dead / misleading surface
- Fix approach: Either implement write-to-cache + return path, or delete unused export and rely on `remoteUrl` + `resolveAudioSource` in `shared/audio/playback.ts`

**Console logging in hot paths:**
- Issue: Broad `console.error` / `console.warn` in `store/modules/user.ts`, `store/modules/entries.ts`, `store/modules/storage.ts`, `services/audioSync.ts`, `lib/supabase.ts` instead of `utils/logger.ts`
- Impact: Noisy production builds; inconsistent privacy / level control; `Logger.persistLog` remains a no-op placeholder
- Fix approach: Route new and critical paths through `logger`; keep `__DEV__` guards for info logs

**Duplicate resolve-rate logic:**
- Issue: `computeResolveRate` / growth-stage thresholds are mirrored in `shared/retention/resolveRevisitSubtitleKey.ts`, `services/gardenMilestone.ts`, and `components/Insights/utils.tsx`
- Impact: Threshold drift between garden UI, retention copy, and milestone badges
- Fix approach: Single shared helper under `shared/retention/` or `shared/garden/`

**Legacy openspec cleanup in flight:**
- Issue: Git working tree deletes root `openspec/` docs while domain of record is `.planning/`. Agents must not recreate root `openspec/`
- Impact: Confusion if tools or habits still point at deleted paths
- Fix approach: Keep `.planning/` as sole doc root; historical SSD under `.planning/archive/openspec-changes/`

## Known Bugs

**Recording clipHandler cross-mount races (mitigated, still fragile):**
- Symptoms: After editing an entry, returning to「记一笔」can record natively while clips never attach to the form
- Files: `shared/audio/recordingCoordinator.ts`, `components/AudioRecorder/AudioRecorder.tsx`, `components/EntryEditor/EntryEditor.tsx`, `hooks/useStopAudioOnTabBlur.ts`
- Trigger: Second `AudioRecorder` unmount clearing global `clipHandler`, while tab instance does not re-register
- Workaround: Current contract — `releaseRecordingClipHandler(handler)` + `clipBinding` (`"tab-focus"` | `{ active }`). Regression path: edit → close → record on create tab. Unit coverage: `__tests__/unit/shared/audio/recordingCoordinator.clipHandler.test.ts` (release semantics only; full gesture chain is manual)

**Stale localUri after cross-device sync (mitigated for playback):**
- Symptoms: Player silent when `localUri` points at another device’s sandbox path
- Files: `shared/audio/playback.ts` (`resolveAudioSource`), consumers via `shared/audio/coordinator.ts`
- Trigger: Pull cloud entry with source-device `localUri` still present
- Workaround: Existence check then fall back to `remoteUrl`. Entries that never uploaded (`syncStatus: failed` / no `remoteUrl`) remain unplayable on other devices

**Cloud pull overwrites local same-id edits:**
- Symptoms: Local unsynced edits for an existing id disappear after「从云端合并」
- Files: `shared/sync/cloudMerge.ts` (`mergeCloudPullEntries`), `store/useAppStore.ts` (`syncFromCloud` / `recoverFromCloud`)
- Trigger: Edit locally → pull before successful push
- Workaround: Product copy warns users (`constants/syncDataOps.ts` / sync locale strings). No version vector or field-level merge

## Security Considerations

**Client-exposed Groq API key:**
- Risk: `EXPO_PUBLIC_GROQ_API_KEY` is bundled into the client (`utils/aiService.ts` → `getGroqApiKey`). Key can be extracted and abused for rate/cost
- Files: `utils/aiService.ts`, `.env.example`
- Current mitigation: Optional key; missing key falls back to static copy; basic format check; in-memory cache TTL
- Recommendations: Proxy Groq via Edge Function with auth + per-user quotas; rotate keys if leaked; never put production-only secrets in `EXPO_PUBLIC_*`

**Supabase anon key + RLS dependency:**
- Risk: Anon key is public by design; data safety depends entirely on RLS and Storage policies. Misconfigured policies expose entries or audio
- Files: `lib/supabase.ts`, `store/useAppStore.ts` (RLS fallback insert/update path), `services/audioSync.ts`
- Current mitigation: `isSupabaseConfigured()` gates cloud ops; offline placeholder client when env missing
- Recommendations: Keep RLS audited on `entries`, `entry_tombstones`, `profiles`, Storage `audios`; add CI/policy smoke where possible

**Public audio URLs:**
- Risk: `getPublicUrl` in `services/audioSync.ts` assumes bucket objects are publicly readable. Guessable `{userId}/{audioId}.m4a` paths may leak audio if bucket is public
- Files: `services/audioSync.ts`
- Current mitigation: Path scoped under `userId/`; upload uses authenticated client
- Recommendations: Prefer private bucket + signed URLs; ensure Storage policies deny anonymous list/read of other users’ prefixes

**Account deletion leaves Storage orphans:**
- Risk: Edge Function `supabase/functions/delete-account/index.ts` deletes `entry_tombstones`, `entries`, `profiles`, Auth user — but does **not** remove `audios` Storage objects. Client `deleteAccount` in `store/modules/user.ts` keeps a local guest snapshot of entries (including audio metadata) after cloud wipe
- Files: `supabase/functions/delete-account/index.ts`, `store/modules/user.ts`
- Current mitigation: Auth user deleted; DB rows removed
- Recommendations: In Edge Function, list/remove `audios/{userId}/**` before `deleteUser`; document privacy expectation for post-delete guest snapshot

**SecureStore session size (H4):**
- Risk: Large session blobs can fail `SecureStore.setItemAsync`; adapter in `lib/supabase.ts` swallows errors (warn + no-op), which can drop persisted auth silently
- Files: `lib/supabase.ts` (`SecureStoreAdapter`)
- Current mitigation: Try/catch on get/set/remove; compressed session noted in engineering quality notes
- Recommendations: Detect set failures and surface re-login; keep session payload minimal

**No production error telemetry:**
- Risk: `utils/logger.ts` `persistLog` is intentionally unimplemented (no Sentry / file sink). Production failures are invisible post-ship
- Files: `utils/logger.ts`
- Current mitigation: Console in development via `isDevelopment()`
- Recommendations: Add Sentry (or equivalent) with PII scrubbing before expanding remote logging

## Performance Bottlenecks

**Full-table cloud upsert on backup:**
- Problem: `syncToCloud` in `store/useAppStore.ts` upserts the user’s current `entries` set (minus tombstones) and runs sequential audio uploads via `uploadPendingAudios`
- Files: `store/useAppStore.ts`, `services/audioSync.ts`, `shared/audio/uploadRetry.ts`
- Cause: No delta / cursor sync; audio retries are serial with exponential backoff
- Improvement path: Incremental sync by `updatedAt`; parallelize audio uploads with a small concurrency cap; skip unchanged rows

**Large list / card weight:**
- Problem: Dashboard list + heavy `EntryCard` (~892 lines) with audio UI, retry, rituals
- Files: `components/Dashboard.tsx`, `components/EntryCard.tsx`, `shared/entries/dashboardFilter.ts`
- Cause: Rich per-row UI; FlashList helps but card complexity remains
- Improvement path: Keep `getItemType` + filter; subscribe playback progress only on active card; further split card into presentational subcomponents

**AI generation cost and latency:**
- Problem: Groq chat calls in `utils/aiService.ts` for forecast / podcast / prescription / review closing; rate-limit sensitive
- Files: `utils/aiService.ts`, `store/modules/ai.ts`
- Cause: Client-side LLM; cache helps but cold paths still hit network
- Improvement path: Locale-prefixed cache keys already required (`buildAiCacheKey`); ensure `setLocale` / `setLocaleMode` clear AI store + cache; consider server-side generation

**Insights first paint:**
- Problem: Multiple Insight widgets can stall the Insights tab
- Files: `components/Insights/InsightsDeferredSections.tsx`, `components/Insights/index.tsx`
- Cause: Heavy secondary sections
- Improvement path: Keep deferred mounting pattern; avoid adding sync AI work to the critical path

## Fragile Areas

**Store sync orchestration:**
- Files: `store/useAppStore.ts` (`syncToCloud`, `syncFromCloud`, `processPendingSync`), `shared/sync/syncLock.ts`, `shared/sync/cloudMerge.ts`, `shared/sync/tombstone.ts`, `services/entryTombstones.ts`
- Why fragile: Process-wide mutex + pending debounce; tombstone filter must stay aligned across purge, push, and pull; cloud-wins merge; RLS upsert fallback branches
- Safe modification: Change pure helpers (`cloudMerge`, `tombstone`) with tests first (`__tests__/unit/shared/sync/`); keep lock acquire/release in `finally`; never skip tombstone filtering on either direction
- Test coverage: Unit tests for merge/lock/tombstones; **no** end-to-end store sync integration test against real Supabase

**recordingCoordinator singleton:**
- Files: `shared/audio/recordingCoordinator.ts`, `components/AudioRecorder/RecordingSessionHost.tsx`, `components/AudioRecorder/AudioRecorder.tsx`
- Why fragile: One native recorder + one `clipHandler`; arm/cancel races (`armInFlight`, `abortArmRequested`); `NativeSharedObjectNotFound` expected after unmount
- Safe modification: Preserve `releaseRecordingClipHandler` identity check; new mounts must pass explicit `clipBinding`; do not call `setRecordingClipHandler(null)` blindly
- Test coverage: Clip-handler release unit tests only; gesture / focus races need device QA

**audioSync upload pipeline:**
- Files: `services/audioSync.ts`, `store/modules/entries.ts` (`retryAudioUpload`), `components/EntryCard.tsx`
- Why fragile: Upload passes `localUri` string into Storage `.upload`; status transitions `pending` → `synced` | `failed`; backup retries `failed` too
- Safe modification: Keep retry injectable (`uploadAudioWithRetry` deps) for tests; do not mark entry synced while any audio remains failed (`computeEntrySyncStatus` in `store/modules/audio.ts`)
- Test coverage: `__tests__/unit/services/audioSync.test.ts`, `__tests__/unit/shared/audio/uploadRetry.test.ts`

**aiService monolith:**
- Files: `utils/aiService.ts`, `store/modules/ai.ts`, `store/modules/locale.ts` (`clearAiCache`)
- Why fragile: Prompt parsing, locale cache keys, Groq error classification, and fallbacks live in one file; locale switch must clear cache or wrong-language AI shows
- Safe modification: Keep `loc:{AppLocale}:` key prefix; any new AI feature must clear on locale change; prefer adding small pure parsers with unit tests under `__tests__/unit/utils/`
- Test coverage: Cache / locale / forecast unit tests exist; prescription parsing less covered

**lib/supabase bootstrap:**
- Files: `lib/supabase.ts`
- Why fragile: Empty env still constructs a client against offline placeholders; callers must gate with `isSupabaseConfigured()`. SecureStore failures are silent
- Safe modification: Never assume `supabase` implies cloud is live; always check `isSupabaseConfigured()` before network writes
- Test coverage: Not detected for `lib/supabase.ts` itself

**Guest ↔ user storage migration:**
- Files: `store/modules/storage.ts` (`migrateGuestDataToUser`, `replaceGuestStorageEntries`), `store/modules/user.ts` (login / logout / deleteAccount)
- Why fragile: Wrong merge vs replace policy reintroduces deleted guest entries or drops data on account switch
- Safe modification: Login migrates guest → user (`keep-first`); logout/delete **replace** guest snapshot — do not merge on logout
- Test coverage: `__tests__/unit/store/storage.test.ts` (verify when changing merge policy)

## Scaling Limits

**Local entries in AsyncStorage:**
- Current capacity: Entire `MoodEntry[]` (with audio metadata) JSON-serialized per user key (`mood_entries_{userId}` / guest)
- Limit: Device storage / JSON parse cost; dashboard filter helps render but not persistence size
- Scaling path: Pagination / archival of burned & purged metadata; compress or split audio metadata; consider SQLite if lists grow large

**Cloud sync model:**
- Current capacity: Full upsert of visible local set per backup
- Limit: Breaks down with large histories + many pending audios (time, battery, timeout)
- Scaling path: Incremental sync, server-side tombstone GC, batched Storage ops

**AI rate limits:**
- Current capacity: Groq free/paid tier + client cache
- Limit: Concurrent Insights widgets or rapid locale switches can burn quota
- Scaling path: Server proxy, stricter client throttling, shared request coalescing

## Dependencies at Risk

**Expo SDK major upgrades:**
- Risk: Expo ~54 / `expo-audio` / SecureStore / Router APIs shift; recording and auth adapters break
- Impact: `shared/audio/recordingCoordinator.ts`, `lib/supabase.ts`, navigation focus for `clipBinding`
- Migration plan: Follow Expo upgrade guide; re-run Maestro recording / recycle-bin flows after prebuild

**Groq model / API stability:**
- Risk: Model id `llama-3.1-8b-instant` or response shape changes
- Impact: Forecast / podcast / prescription parsing in `utils/aiService.ts`
- Migration plan: Pin model; expand fallbacks; add contract tests for parsers

**Supabase Edge runtime for delete-account:**
- Risk: Deno / `esm.sh` import drift; service-role misuse
- Impact: Account deletion failures or incomplete wipe
- Migration plan: Pin SDK versions; add Storage cleanup; integration test in staging

## Missing Critical Features

**True multi-device conflict resolution:**
- Problem: Last-write / cloud-wins only; no CRDT or `updatedAt` field merge
- Blocks: Safe concurrent editing on two devices without user confirmation discipline

**Observability:**
- Problem: No Sentry / crash / sync-failure dashboards
- Blocks: Detecting production sync or recording failures early

**E2E in CI:**
- Problem: Playwright (`yarn test:e2e`) and Maestro (`.maestro/`) are local-only; CI runs `typecheck` → `lint` → `test` only (`.github/workflows/ci.yml`)
- Blocks: Catching navigation / Alert / deep-link regressions automatically

**Private audio delivery:**
- Problem: Public URL pattern for synced audio
- Blocks: Stronger privacy guarantees for voice diaries

## Test Coverage Gaps

**Store sync integration (`useAppStore` sync\*):**
- What's not tested: Full `syncToCloud` / `syncFromCloud` against mocked Supabase client (tombstone purge + upsert + audio + merge)
- Files: `store/useAppStore.ts`
- Risk: Regression in RLS fallback or pending-lock debounce goes unnoticed
- Priority: High

**delete-account + client cleanup contract:**
- What's not tested: Edge Function Storage cleanup; client guest snapshot after delete
- Files: `supabase/functions/delete-account/index.ts`, `store/modules/user.ts`
- Risk: Orphan audio / unexpected local data retention
- Priority: High

**recordingCoordinator gesture / focus matrix:**
- What's not tested: tab-focus vs edit-visible binding under Stack overlays; `forceCancelRecording` vs arm race
- Files: `shared/audio/recordingCoordinator.ts`, `components/AudioRecorder/AudioRecorder.tsx`
- Risk: Silent “record succeeds but clip missing”
- Priority: High

**downloadAudio / Storage round-trip:**
- What's not tested: Meaningful download → local file behavior (API currently incomplete)
- Files: `services/audioSync.ts`
- Risk: False confidence if callers start using it
- Priority: Medium

**Profile sync handlers / large UI:**
- What's not tested: `useProfileSyncHandlers`, `ProfileSettingsSection` dual-status mapping
- Files: `features/profile/hooks/useProfileSyncHandlers.ts`, `features/profile/components/ProfileSettingsSection.tsx`
- Risk: UX status bugs only found manually
- Priority: Medium

**Coverage enforcement:**
- What's not tested: No Jest coverage thresholds in package scripts / config detected
- Files: `package.json` (`yarn test`)
- Risk: Coverage can regress silently despite ~55 unit suites
- Priority: Low

---

*Concerns audit: 2026-07-30*
