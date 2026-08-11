/**
 * Widget snapshot orchestration (QUAL-03 / D-06, D-08, D-10).
 * Args-in entries — never imports store or components.
 * Primary sink is native-shared (QUAL-03 / D-03 — not app-local KV as sole SoT).
 */

import { Platform } from 'react-native';

import {
  buildWidgetSnapshot,
  createMemoryWidgetSnapshotSink,
  createNoOpWidgetSnapshotSink,
  type WidgetSnapshotSink,
} from '@/shared/widget';
import type { MoodEntry } from '@/types';
import { logger } from '@/utils/logger';

/** Test-only sink override; null restores factory selection. */
let injectedSink: WidgetSnapshotSink | null = null;
/** Cached factory result for this process (cleared when injection changes). */
let cachedSink: WidgetSnapshotSink | null = null;

/**
 * Serialized widget sink ops — publish/clear must not overlap so a late
 * publish cannot overwrite a subsequent clear (logout / D-10).
 */
let opChain: Promise<void> = Promise.resolve();

/**
 * Jest/unit injection so tests do not need the native module.
 * Pass null to clear injection and reset the factory cache.
 */
export function __setWidgetSnapshotSinkForTests(
  sink: WidgetSnapshotSink | null,
): void {
  injectedSink = sink;
  cachedSink = null;
}

/** @internal unit tests — reset the serial queue between cases. */
export function __resetWidgetSnapshotOpQueueForTests(): void {
  opChain = Promise.resolve();
}

function isJestEnv(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env.JEST_WORKER_ID !== undefined
  );
}

function tryCreateNativeSink(): WidgetSnapshotSink | null {
  try {
    // Local Expo module (package.json → file:./modules/widget-snapshot) — must be
    // yarn-linked so autolinking registers WidgetSnapshotModule; else this falls to NoOp.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('widget-snapshot') as {
      createNativeWidgetSnapshotSink?: () => {
        write?: (snapshot: unknown) => Promise<void>;
        clear?: () => Promise<void>;
      };
    };
    if (typeof mod.createNativeWidgetSnapshotSink !== 'function') {
      return null;
    }
    const native = mod.createNativeWidgetSnapshotSink();
    if (
      !native ||
      typeof native.write !== 'function' ||
      typeof native.clear !== 'function'
    ) {
      return null;
    }
    // Adapt write/clear only — do not trust native read as WidgetSnapshot.
    return {
      write: (snapshot) => native.write!(snapshot),
      clear: () => native.clear!(),
    };
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.warn('widgetSnapshot', 'native module unavailable', error);
    }
  }
  return null;
}

/**
 * Select sink: injected → Jest Memory → web NoOp → native bridge → NoOp.
 * Never uses app-local KV as sole/permanent SoT (D-03 / QUAL-03).
 */
export function getWidgetSnapshotSink(): WidgetSnapshotSink {
  if (injectedSink) {
    return injectedSink;
  }
  if (cachedSink) {
    return cachedSink;
  }

  if (isJestEnv()) {
    cachedSink = createMemoryWidgetSnapshotSink();
    return cachedSink;
  }

  if (Platform.OS === 'web') {
    cachedSink = createNoOpWidgetSnapshotSink();
    return cachedSink;
  }

  const native = tryCreateNativeSink();
  cachedSink = native ?? createNoOpWidgetSnapshotSink();
  if (!native && typeof __DEV__ !== 'undefined' && __DEV__) {
    logger.warn(
      'widgetSnapshot',
      'falling back to NoOp sink (native bridge missing)',
    );
  }
  return cachedSink;
}

/** Build whitelist snapshot and write via the selected sink (D-05/D-06). */
export async function publishWidgetSnapshot(
  entries: readonly MoodEntry[],
  now: number = Date.now(),
): Promise<void> {
  const snapshot = buildWidgetSnapshot(entries, now);
  await getWidgetSnapshotSink().write(snapshot);
}

/** Clear the same sink/key used by publish (D-08). */
export async function clearWidgetSnapshot(): Promise<void> {
  await getWidgetSnapshotSink().clear();
}

/**
 * Enqueue a widget sink thunk on the shared serial queue.
 * The thunk runs only after prior ops finish; rejections are logged, never thrown to callers.
 */
export function scheduleWidgetSnapshotOp(
  thunk: () => Promise<void>,
  label: string,
): void {
  opChain = opChain.then(async () => {
    try {
      await thunk();
    } catch (error) {
      logger.warn('widgetSnapshot', label, error);
    }
  });
}

/**
 * Enqueue clear and await this clear finishing.
 * Logs failures; never propagates (logout / deleteAccount / persist-fail paths).
 */
export function enqueueClearWidgetSnapshot(label: string): Promise<void> {
  const run = opChain.then(async () => {
    try {
      await clearWidgetSnapshot();
    } catch (error) {
      logger.warn('widgetSnapshot', label, error);
    }
  });
  opChain = run;
  return run;
}
