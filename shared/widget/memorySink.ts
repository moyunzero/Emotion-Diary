/**
 * In-memory WidgetSnapshotSink for Jest / __DEV__ (D-03, D-11).
 * No AsyncStorage — process-local slot keyed by WIDGET_SNAPSHOT_KEY.
 */

import type { WidgetSnapshot } from './types';
import { WIDGET_SNAPSHOT_KEY, type WidgetSnapshotSink } from './sink';

export class MemoryWidgetSnapshotSink implements WidgetSnapshotSink {
  private readonly store = new Map<string, WidgetSnapshot>();

  async write(snapshot: WidgetSnapshot): Promise<void> {
    this.store.set(WIDGET_SNAPSHOT_KEY, snapshot);
  }

  async clear(): Promise<void> {
    this.store.delete(WIDGET_SNAPSHOT_KEY);
  }

  async read(): Promise<WidgetSnapshot | null> {
    return this.store.get(WIDGET_SNAPSHOT_KEY) ?? null;
  }
}

export function createMemoryWidgetSnapshotSink(): WidgetSnapshotSink {
  return new MemoryWidgetSnapshotSink();
}
