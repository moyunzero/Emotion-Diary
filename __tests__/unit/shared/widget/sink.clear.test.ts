/**
 * Wave 0 — QUAL-03 WidgetSnapshotSink Memory/NoOp clear + idempotency (D-03, D-04, D-08, D-11)
 */

import {
  buildWidgetSnapshot,
  createMemoryWidgetSnapshotSink,
  createNoOpWidgetSnapshotSink,
  WIDGET_SNAPSHOT_FORBIDDEN_KEYS,
  WIDGET_SNAPSHOT_KEY,
} from '@/shared/widget';
import { Deadline, MoodEntry, MoodLevel, Status } from '@/types';

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
    content: 'diary body must not reach sink payload shape',
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

describe('WidgetSnapshotSink (Memory + NoOp)', () => {
  it('exposes a single shared key constant for write/clear (D-08)', () => {
    expect(WIDGET_SNAPSHOT_KEY).toBe('widget_snapshot_v1');
  });

  it('MemorySink: write then read returns equivalent whitelist snapshot (D-03)', async () => {
    const sink = createMemoryWidgetSnapshotSink();
    const snapshot = buildWidgetSnapshot([makeEntry()], 1_700_000_000_000);

    assertWhitelistShape(snapshot);
    await expect(sink.write(snapshot)).resolves.toBeUndefined();

    const readBack = await sink.read!();
    expect(readBack).toEqual(snapshot);
    assertWhitelistShape(readBack!);
  });

  it('MemorySink: clear then read null; clear twice is idempotent (D-11)', async () => {
    const sink = createMemoryWidgetSnapshotSink();
    const snapshot = buildWidgetSnapshot([makeEntry()], 1_700_000_000_001);

    await sink.write(snapshot);
    await expect(sink.clear()).resolves.toBeUndefined();
    await expect(sink.read!()).resolves.toBeNull();

    await expect(sink.clear()).resolves.toBeUndefined();
    await expect(sink.read!()).resolves.toBeNull();
  });

  it('NoOpSink: write and clear resolve; read returns null (D-04)', async () => {
    const sink = createNoOpWidgetSnapshotSink();
    const snapshot = buildWidgetSnapshot([], 1_700_000_000_002);

    assertWhitelistShape(snapshot);
    await expect(sink.write(snapshot)).resolves.toBeUndefined();
    await expect(sink.clear()).resolves.toBeUndefined();
    await expect(sink.read!()).resolves.toBeNull();
  });
});
