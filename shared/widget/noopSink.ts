/**
 * No-op WidgetSnapshotSink for web / unsupported platforms (D-04).
 * write/clear always resolve; read returns null. Never throws.
 */

import type { WidgetSnapshot } from './types';
import type { WidgetSnapshotSink } from './sink';

export class NoOpWidgetSnapshotSink implements WidgetSnapshotSink {
  async write(_snapshot: WidgetSnapshot): Promise<void> {
    // intentionally no-op
  }

  async clear(): Promise<void> {
    // intentionally no-op (idempotent)
  }

  async read(): Promise<WidgetSnapshot | null> {
    return null;
  }
}

export function createNoOpWidgetSnapshotSink(): WidgetSnapshotSink {
  return new NoOpWidgetSnapshotSink();
}
