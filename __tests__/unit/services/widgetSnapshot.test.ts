/**
 * QUAL-03 — services/widgetSnapshot publish/clear + sink selection (D-06, D-08, D-10)
 */

import fs from 'fs';
import path from 'path';

import {
  createMemoryWidgetSnapshotSink,
  WIDGET_SNAPSHOT_FORBIDDEN_KEYS,
  WIDGET_SNAPSHOT_SCHEMA_VERSION,
} from '@/shared/widget';
import { Deadline, MoodEntry, MoodLevel, Status } from '@/types';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const WHITELIST_KEYS = [
  'schemaVersion',
  'updatedAt',
  'weatherBucket',
  'growthStage',
  'entryCountActive',
] as const;

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'entry-should-not-leak',
    timestamp: Date.now(),
    moodLevel: MoodLevel.ANNOYED,
    content: 'diary body must not reach snapshot',
    deadline: Deadline.LATER,
    people: ['PersonName'],
    triggers: ['trigger-tag'],
    status: Status.ACTIVE,
    ...overrides,
  };
}

function assertWhitelistShape(snapshot: object): void {
  const keys = Object.keys(snapshot).sort();
  expect(keys).toEqual([...WHITELIST_KEYS].sort());
  for (const forbidden of WIDGET_SNAPSHOT_FORBIDDEN_KEYS) {
    expect(keys).not.toContain(forbidden);
  }
}

describe('services/widgetSnapshot', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('does not import store, components, or AsyncStorage (D-10 / D-03)', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../services/widgetSnapshot.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/from ['"].*store/);
    expect(source).not.toMatch(/from ['"].*components/);
    // Acceptance: no AsyncStorage identifier anywhere (sole-sink prohibition).
    expect(source).not.toMatch(/\bAsyncStorage\b/);
  });

  it('package.json links widget-snapshot for Expo autolinking (avoids silent NoOp)', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8'),
    );
    expect(pkg.dependencies['widget-snapshot']).toMatch(
      /modules\/widget-snapshot/,
    );
    expect(pkg.scripts['verify:widget-native']).toBe(
      'node scripts/verify-widget-native-link.js',
    );
  });

  it('native sink require uses package name widget-snapshot', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../services/widgetSnapshot.ts'),
      'utf8',
    );
    expect(source).toMatch(/require\(['"]widget-snapshot['"]\)/);
  });

  it('publishWidgetSnapshot writes whitelist snapshot via Memory sink; clear empties', async () => {
    const {
      __setWidgetSnapshotSinkForTests,
      publishWidgetSnapshot,
      clearWidgetSnapshot,
    } = await import('@/services/widgetSnapshot');

    const sink = createMemoryWidgetSnapshotSink();
    __setWidgetSnapshotSinkForTests(sink);

    const now = 1_700_000_000_100;
    await publishWidgetSnapshot([makeEntry()], now);

    const written = await sink.read!();
    expect(written).not.toBeNull();
    assertWhitelistShape(written!);
    expect(written).toEqual(
      expect.objectContaining({
        schemaVersion: WIDGET_SNAPSHOT_SCHEMA_VERSION,
        updatedAt: now,
        weatherBucket: expect.stringMatching(/^(sunny|cloudy|rainy|stormy)$/),
        growthStage: expect.stringMatching(
          /^(seed|sprout|seedling|bud|bloom)$/,
        ),
        entryCountActive: 1,
      }),
    );

    await clearWidgetSnapshot();
    await expect(sink.read!()).resolves.toBeNull();
  });

  it('getWidgetSnapshotSink under Jest defaults to Memory without injection', async () => {
    const {
      __setWidgetSnapshotSinkForTests,
      getWidgetSnapshotSink,
      publishWidgetSnapshot,
      clearWidgetSnapshot,
    } = await import('@/services/widgetSnapshot');

    __setWidgetSnapshotSinkForTests(null);

    const sink = getWidgetSnapshotSink();
    expect(typeof sink.write).toBe('function');
    expect(typeof sink.clear).toBe('function');
    expect(typeof sink.read).toBe('function');

    await publishWidgetSnapshot([], 1_700_000_000_200);
    const written = await sink.read!();
    expect(written).not.toBeNull();
    assertWhitelistShape(written!);
    expect(written!.entryCountActive).toBe(0);

    await clearWidgetSnapshot();
    await expect(sink.read!()).resolves.toBeNull();
  });

  it('scheduleWidgetSnapshotOp logs rejection via logger.warn (no unhandled rejection)', async () => {
    jest.resetModules();
    jest.doMock('@/utils/logger', () => ({
      logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
    }));
    const { logger } = await import('@/utils/logger');
    const { scheduleWidgetSnapshotOp } = await import('@/services/widgetSnapshot');

    const rejection = new Error('sink boom');
    scheduleWidgetSnapshotOp(Promise.reject(rejection), 'test op failed');

    await new Promise((r) => setImmediate(r));
    expect(logger.warn).toHaveBeenCalledWith(
      'widgetSnapshot',
      'test op failed',
      rejection,
    );
  });
});
