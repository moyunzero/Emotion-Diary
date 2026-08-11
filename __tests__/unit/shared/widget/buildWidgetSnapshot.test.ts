/**
 * Wave 0 — QUAL-03 buildWidgetSnapshot whitelist + empty + forbid-list
 */

import { Deadline, MoodEntry, MoodLevel, Status } from '@/types';
import {
  buildWidgetSnapshot,
  WIDGET_SNAPSHOT_FORBIDDEN_KEYS,
  WIDGET_SNAPSHOT_SCHEMA_VERSION,
} from '@/shared/widget';

const PII_CONTENT = 'secret diary content xyz';
const PII_PERSON = 'Alice SecretName';
const PII_TRIGGER = 'work-stress-trigger';
const PII_EMAIL = 'user@example.com';
const PII_NAME = 'Display Name Leak';

const WHITELIST_KEYS = [
  'schemaVersion',
  'updatedAt',
  'weatherBucket',
  'growthStage',
  'entryCountActive',
] as const;

const FORBIDDEN_OBJECT_KEYS = [
  'content',
  'people',
  'triggers',
  'audios',
  'remoteUrl',
  'id',
  'email',
  'name',
] as const;

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'entry-pii-id-should-never-leak',
    timestamp: Date.now(),
    moodLevel: MoodLevel.ANNOYED,
    content: PII_CONTENT,
    deadline: Deadline.LATER,
    people: [PII_PERSON],
    triggers: [PII_TRIGGER],
    status: Status.ACTIVE,
    audios: [
      {
        id: 'audio-pii-id',
        localUri: 'file:///secret.m4a',
        remoteUrl: 'https://cdn.example.com/secret.m4a',
        duration: 1,
        fileSize: 10,
        fileHash: 'abc',
        name: 'voice-memo-name',
        createdAt: 1,
        syncStatus: 'pending',
      },
    ],
    ...overrides,
  };
}

function assertWhitelistOnly(snapshot: object): void {
  const keys = Object.keys(snapshot).sort();
  expect(keys).toEqual([...WHITELIST_KEYS].sort());
  for (const forbidden of FORBIDDEN_OBJECT_KEYS) {
    expect(keys).not.toContain(forbidden);
  }
}

function assertNoPiiInJson(snapshot: object): void {
  const json = JSON.stringify(snapshot);
  expect(json).not.toContain(PII_CONTENT);
  expect(json).not.toContain(PII_PERSON);
  expect(json).not.toContain(PII_TRIGGER);
  expect(json).not.toContain(PII_EMAIL);
  expect(json).not.toContain(PII_NAME);
  expect(json).not.toContain('entry-pii-id-should-never-leak');
  expect(json).not.toContain('https://cdn.example.com/secret.m4a');
  expect(json).not.toMatch(/"people"/);
  expect(json).not.toMatch(/"triggers"/);
  expect(json).not.toMatch(/"content"/);
  expect(json).not.toMatch(/"audios"/);
  expect(json).not.toMatch(/"remoteUrl"/);
}

describe('buildWidgetSnapshot', () => {
  it('emits exactly whitelist keys (D-01)', () => {
    const now = 1_700_000_000_000;
    const snapshot = buildWidgetSnapshot([makeEntry()], now);
    assertWhitelistOnly(snapshot);
    expect(snapshot.schemaVersion).toBe(WIDGET_SNAPSHOT_SCHEMA_VERSION);
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.updatedAt).toBe(now);
    expect(snapshot.weatherBucket).toMatch(/^(sunny|cloudy|rainy|stormy)$/);
    expect(snapshot.growthStage).toMatch(
      /^(seed|sprout|seedling|bud|bloom)$/,
    );
    expect(typeof snapshot.entryCountActive).toBe('number');
  });

  it('never includes forbid-list keys or PII substrings (D-01 / D-11)', () => {
    const snapshot = buildWidgetSnapshot(
      [
        makeEntry({
          id: 'entry-pii-id-should-never-leak',
          content: PII_CONTENT,
          people: [PII_PERSON],
          triggers: [PII_TRIGGER],
        }),
      ],
      42,
    );
    assertWhitelistOnly(snapshot);
    assertNoPiiInJson(snapshot);
    for (const key of WIDGET_SNAPSHOT_FORBIDDEN_KEYS) {
      expect(Object.keys(snapshot)).not.toContain(key);
    }
  });

  it('empty input → sunny + seed + entryCountActive 0 (D-09)', () => {
    const now = 99;
    const snapshot = buildWidgetSnapshot([], now);
    assertWhitelistOnly(snapshot);
    expect(snapshot).toEqual({
      schemaVersion: 1,
      updatedAt: now,
      weatherBucket: 'sunny',
      growthStage: 'seed',
      entryCountActive: 0,
    });
  });

  it('fixtures with diary body / people / triggers / audios still whitelist-only (D-02)', () => {
    const snapshot = buildWidgetSnapshot(
      [
        makeEntry({ moodLevel: MoodLevel.FURIOUS }),
        makeEntry({
          id: 'other-id',
          status: Status.RESOLVED,
          moodLevel: MoodLevel.ANNOYED,
        }),
      ],
      7,
    );
    assertWhitelistOnly(snapshot);
    assertNoPiiInJson(snapshot);
    expect(snapshot).not.toHaveProperty('dominantPerson');
    expect(snapshot).not.toHaveProperty('potLabel');
    expect(snapshot).not.toHaveProperty('onThisDay');
    expect(snapshot).not.toHaveProperty('streak');
  });

  it('soft-deleted ACTIVE rows do not inflate entryCountActive or weather', () => {
    const now = 123;
    const softDeletedHeavy = makeEntry({
      moodLevel: MoodLevel.EXPLOSIVE,
      status: Status.ACTIVE,
      deletedAt: now - 1,
    });
    const snapshot = buildWidgetSnapshot([softDeletedHeavy], now);
    expect(snapshot.entryCountActive).toBe(0);
    expect(snapshot.weatherBucket).toBe('sunny');
    expect(snapshot.growthStage).toBe('seed');
  });

  it('counts visible ACTIVE only and maps weather / growth from domain math', () => {
    // One ACTIVE ANNOYED (level 1) → score 2 → sunny; entryCountActive 1
    // One RESOLVED → not in weather/count; rate 1/2 = 0.5 → seedling (≥0.4)
    const snapshot = buildWidgetSnapshot(
      [
        makeEntry({
          id: 'a',
          status: Status.ACTIVE,
          moodLevel: MoodLevel.ANNOYED,
        }),
        makeEntry({
          id: 'b',
          status: Status.RESOLVED,
          moodLevel: MoodLevel.EXPLOSIVE,
          content: PII_CONTENT,
        }),
      ],
      1,
    );
    expect(snapshot.entryCountActive).toBe(1);
    expect(snapshot.weatherBucket).toBe('sunny');
    expect(snapshot.growthStage).toBe('seedling');
    assertNoPiiInJson(snapshot);
  });
});
