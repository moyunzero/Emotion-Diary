---
last_mapped_commit: 5c06e616ac14890cec95af53bd4ce5bc9177744c
---
# Testing Patterns

**Analysis Date:** 2026-07-30

## Test Framework

**Runner:**
- Jest `29.7.0` with `ts-jest` `29.4.0`
- Config: inline `jest` key in `package.json` (no separate `jest.config.*`)
- Environment: `testEnvironment: "node"` — pure Node unit tests (no RN renderer / no `jest.setup.js`)
- Path alias: `"^@/(.*)$": "<rootDir>/$1"`
- `testPathIgnorePatterns`: `/node_modules/`, `/e2e/` (Playwright specs are not run by Jest)

**Assertion Library:**
- Jest built-in `expect` / matchers (`@types/jest` `29.5.14`)

**E2E:**
- Playwright `@playwright/test` `^1.52.0` — config `playwright.config.ts`, specs under `e2e/`
- Maestro CLI — config `.maestro/config.yaml` (`appId: com.moyunzero.emotiondiary`), flows under `.maestro/flows/`

**Run Commands:**
```bash
yarn test                          # All Jest unit tests
yarn test __tests__/unit/shared/sync/tombstone.test.ts   # Single file
yarn test:e2e                      # Playwright (starts Expo web on :8081 unless reused)
yarn test:e2e:ui                   # Playwright UI mode
yarn test:maestro                  # All Maestro flows in .maestro/flows
yarn test:maestro:preflight        # bash scripts/maestro-preflight.sh
yarn test:maestro:restore          # recycle-bin-restore.yaml only
yarn test:maestro:purge            # recycle-bin-purge.yaml only
yarn typecheck                     # tsc --noEmit (CI gate)
yarn lint                          # ESLint (CI gate)
```

## Test File Organization

**Location:**
- Unit: `__tests__/unit/<area>/` mirroring production areas (`shared/`, `store/`, `utils/`, `services/`, `i18n/`, `constants/`, `config/`)
- Playwright: `e2e/*.spec.ts` plus `e2e/fixtures/`, `e2e/helpers/`
- Maestro: `.maestro/flows/*.yaml`, shared steps in `.maestro/subflows/`, acceptance screenshots under `.maestro/acceptance/`

**Naming:**
- Unit: `*.test.ts` (not `*.spec.ts` for Jest)
- Playwright: `*.spec.ts`
- Maestro: descriptive kebab-case YAML

**Structure:**
```text
__tests__/unit/
├── config/           # e.g. nativeLocales.test.ts
├── constants/
├── i18n/             # copy smoke, initI18n, resolvers
├── services/
├── shared/           # entries, sync, audio, share, retention, weather, formatting
├── store/            # storage, locale, pendingSyncQueue
└── utils/            # errorHandler, aiService.*, reviewExport*
e2e/
├── fixtures/         # e.g. entries.ts seed factories
├── helpers/          # e.g. storage.ts keys
└── *.spec.ts
.maestro/
├── config.yaml
├── flows/
├── subflows/
└── acceptance/
```

**Scale (approx.):** ~55 Jest suites under `__tests__/unit/` (exact count drifts with additions); Playwright has 3 specs; Maestro has recycle-bin + acceptance flows (`011`–`015`).

## Test Structure

**Suite Organization:**
```typescript
/**
 * Module purpose + what is locked (regression intent).
 */

import { collectTombstoneEntryIds } from '../../../../shared/sync/tombstone';

describe('collectTombstoneEntryIds', () => {
  it('null / undefined → []', () => {
    expect(collectTombstoneEntryIds(null)).toEqual([]);
  });

  it.each(['a', 'b'])('example table case: %s', (id) => {
    expect(id).toBeTruthy();
  });
});
```

Real examples:
- Pure logic: `__tests__/unit/shared/sync/tombstone.test.ts`
- Classification tables: `__tests__/unit/utils/errorHandler.test.ts` (`it.each`)
- Persistence with mocks: `__tests__/unit/store/storage.test.ts`
- Dynamic import + locale: `__tests__/unit/i18n/initI18n.test.ts`

**Patterns:**
- File-level comment describing scope and non-goals (what is intentionally not covered)
- `describe` per export / behavior cluster; `it` names state outcome (often bilingual Chinese/English)
- `beforeEach`: `jest.clearAllMocks()`, reset in-memory mock stores, or `jest.resetModules()` for i18n singletons
- Prefer testing exported pure functions over mounting full React trees

## Mocking

**Framework:** Jest (`jest.mock`, `jest.fn`, `jest.spyOn`, `jest.doMock`)

**Patterns:**
```typescript
// Hoisted module mock with in-memory Map (AsyncStorage)
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      _reset: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
  };
});

// Native / Expo stubs commonly paired in i18n and share tests
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US' }]),
}));

// Capture / RN surface mocks — declare fns first, then jest.mock
const mockCaptureRef = jest.fn();
jest.mock('react-native-view-shot', () => ({
  captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));
```

See:
- `__tests__/unit/store/storage.test.ts` — AsyncStorage map + `makeEntry` factory
- `__tests__/unit/shared/share/captureViewToPng.test.ts` — view-shot + `InteractionManager`
- `__tests__/unit/shared/audio/recordingCoordinator.clipHandler.test.ts` — expo-audio / file-system / haptics / logger
- `__tests__/unit/store/locale.test.ts` — `@/utils/aiService`, `@/i18n`, services

**What to Mock:**
- `@react-native-async-storage/async-storage`
- `expo-localization`, `expo-audio`, `expo-file-system`, `expo-haptics` when imported by unit under test
- `react-native` Platform / PixelRatio / InteractionManager slices when needed
- Network: `global.fetch` as `jest.Mock` (e.g. `__tests__/unit/utils/aiService.locale.test.ts`)
- Side-effect services when testing store locale / reminders (`@/services/emotionReminders`)

**What NOT to Mock:**
- Pure `shared/` and `utils/` logic under test — call real implementations
- Do not hit real Supabase / Groq / network in unit tests
- Prefer not to spin up full `useAppStore` for pure helpers; when store behavior is needed, isolate modules (`storage.ts`) or use lightweight stand-ins (`pendingSyncQueue.test.ts` local queue class)

**No global setup file:** there is no `jest.setup.js`; each suite owns its mocks. `@testing-library/react-native` is not a project dependency — do not assume component RTL tests unless added later.

## Fixtures and Factories

**Test Data:**
```typescript
function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'entry-1',
    timestamp: 1000,
    moodLevel: MoodLevel.ANNOYED,
    content: 'test',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    ...overrides,
  };
}
```

**Locations:**
- Inline factories in unit files (common) — e.g. `makeEntry` in `__tests__/unit/store/storage.test.ts`
- E2E factories: `e2e/fixtures/entries.ts` (`createSoftDeletedEntry`)
- E2E constants: `e2e/helpers/storage.ts` (`GUEST_STORAGE_KEY` must match `store/modules/storage.ts`)
- Maestro seeds: `.maestro/subflows/seed-recycle-bin.yaml`, `seed-active-entry.yaml`, `seed-retention-touchpoints.yaml`

## Coverage

**Requirements:** None enforced — no `coverageThreshold` / default coverage script in `package.json`

**View Coverage (ad hoc):**
```bash
yarn test --coverage
```

**Practical coverage focus:**
- Sync tombstones / cloud merge / soft-delete visibility (`shared/sync/*`, `shared/entries/*`)
- Error classification (`utils/errorHandler.ts`)
- Storage keying / guest migration (`store/modules/storage.ts`)
- Audio retry math and clipHandler ownership (`shared/audio/*`)
- i18n init + bilingual smoke / namespace keys (`__tests__/unit/i18n/*`)
- Share card model / capture sizing (`shared/share/*`)

## Test Types

**Unit Tests:**
- Default and CI-backed path (`yarn test`)
- Node + ts-jest; no device required
- Prefer pure functions extracted to `shared/` / `utils/` so UI stays thin

**Integration Tests:**
- Limited; some suites exercise module + mocked AsyncStorage / fetch together
- Full store + Supabase paths are not automated in CI

**E2E Tests:**

| Layer | Tool | Scope | CI |
|-------|------|-------|----|
| Web | Playwright | Expo Web on `http://127.0.0.1:8081` | Not in CI — local `yarn test:e2e` |
| Native | Maestro | iOS/Android simulator + dev build | Not in CI — local `yarn test:maestro` |

Playwright (`playwright.config.ts`):
- `testDir: ./e2e`, Chromium Desktop Chrome
- Timeout 90s; expect 20s; CI retries 1
- `webServer`: `npx expo start --web --port 8081`, `reuseExistingServer: !CI`

Playwright pattern (`e2e/recycle-bin-main-path.spec.ts`):
- Seed guest entries via `page.addInitScript` + `localStorage`
- Navigate routes; assert with `getByTestId` / text
- Accept browser dialogs in `beforeEach`

Maestro pattern (`.maestro/flows/recycle-bin-restore.yaml`):
- `runFlow` subflows for seed / deep link
- Tap by `id:` (`recycle-restore-button`, `dashboard-header`, `mood-entry-card`)
- Alert: `tapOn: { index: 1 }` for confirm (RN Alert has no testID)
- Deep links: `emotiondiary://`, `emotiondiary://recycle-bin`

## Common Patterns

**Async Testing:**
```typescript
await expect(captureViewToPng(target)).rejects.toThrow('Invalid capture dimensions');

await page.waitForFunction(
  ({ key, id }) => { /* read localStorage */ },
  { key: GUEST_STORAGE_KEY, id: 'e2e-recycle-entry-001' },
  { timeout: 10_000 },
);
```

**Error Testing:**
```typescript
it.each(['Network request failed', 'ENOTFOUND example.com'])(
  '识别为网络错误：%s',
  (msg) => {
    expect(isNetworkError(new Error(msg))).toBe(true);
  },
);
```

**Timers / time:**
```typescript
jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
// pendingSyncQueue tests use real setTimeout with short delays + awaits
```

**Module isolation (i18n):**
```typescript
beforeEach(async () => {
  jest.resetModules();
});
const { initI18n, i18n } = await import('@/i18n');
```

**Immutability checks:**
- Assert helpers do not mutate input arrays/objects (tombstone / merge tests)

## CI Alignment

**PR gate** (`.github/workflows/ci.yml` job `pr-gate`):
```text
yarn install --frozen-lockfile → yarn typecheck → yarn lint → yarn test
```

**Push to `master`** (job `governance`):
```text
typecheck → lint → test → yarn verify:governance → node scripts/verify-governance-smoke.js
```

- Node `22` in CI; `package.json` `engines.node` `>=20`
- E2E (Playwright / Maestro) are local-only; do not rely on them for merge green

## Prescriptive Guidelines for New Tests

1. Put unit tests under `__tests__/unit/<mirrored-path>/<name>.test.ts`.
2. Extract pure logic to `shared/` or `utils/` first when UI-heavy code needs coverage.
3. Mock Expo / AsyncStorage / network at file top; reset in `beforeEach`.
4. Do not add Playwright specs under paths Jest will pick up (keep in `e2e/`, already ignored).
5. For UI automation, add stable `testID`s and prefer Maestro `id:` / Playwright `getByTestId` over visible copy (except Alert indices).
6. Keep suites offline — no real Supabase/Groq credentials in tests.

---

*Testing analysis: 2026-07-30*
