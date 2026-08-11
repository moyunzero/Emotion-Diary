/**
 * Widget snapshot sink contract (QUAL-03 / D-03, D-08).
 * Platform storage is pluggable — Memory/NoOp here; native App Group in 16-03.
 */

import type { WidgetSnapshot } from './types';

/** Single key for write + clear (D-08 — no orphan keys). */
export const WIDGET_SNAPSHOT_KEY = 'widget_snapshot_v1';

/**
 * iOS App Group id for Phase 17 / native Plan 16-03.
 * Documented here so native sink and entitlements share one source.
 */
export const WIDGET_SNAPSHOT_APP_GROUP_ID = 'group.com.moyunzero.emotiondiary';

/**
 * Write / clear / optional read for widget privacy snapshot.
 * Implementations must not use AsyncStorage as sole permanent SoT (D-03).
 */
export interface WidgetSnapshotSink {
  write(snapshot: WidgetSnapshot): Promise<void>;
  clear(): Promise<void>;
  /** Optional; used by Jest MemorySink and debug readback. */
  read?(): Promise<WidgetSnapshot | null>;
}
