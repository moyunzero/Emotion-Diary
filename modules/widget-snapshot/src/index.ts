/**
 * Native WidgetSnapshot bridge — write/clear/read one JSON string (QUAL-03).
 * Key + App Group id must stay aligned with shared/widget/sink.ts.
 */

import { requireNativeModule } from 'expo';

/** Must match shared/widget/sink.ts WIDGET_SNAPSHOT_KEY */
export const NATIVE_WIDGET_SNAPSHOT_KEY = 'widget_snapshot_v1';

/** Must match shared/widget/sink.ts WIDGET_SNAPSHOT_APP_GROUP_ID */
export const NATIVE_WIDGET_SNAPSHOT_APP_GROUP_ID =
  'group.com.moyunzero.emotiondiary';

type WidgetSnapshotNativeModule = {
  writeSnapshot: (json: string) => Promise<void>;
  clearSnapshot: () => Promise<void>;
  readSnapshot: () => Promise<string | null>;
};

export type NativeWidgetSnapshotSink = {
  write: (snapshot: object) => Promise<void>;
  clear: () => Promise<void>;
  read: () => Promise<object | null>;
};

/**
 * Creates a sink backed by iOS App Group UserDefaults /
 * Android MODE_PRIVATE SharedPreferences (not app-local KV sole SoT).
 */
export function createNativeWidgetSnapshotSink(): NativeWidgetSnapshotSink {
  const Native =
    requireNativeModule<WidgetSnapshotNativeModule>('WidgetSnapshot');

  return {
    async write(snapshot: object): Promise<void> {
      await Native.writeSnapshot(JSON.stringify(snapshot));
    },
    async clear(): Promise<void> {
      await Native.clearSnapshot();
    },
    async read(): Promise<object | null> {
      const raw = await Native.readSnapshot();
      if (raw == null || raw === '') return null;
      return JSON.parse(raw) as object;
    },
  };
}
