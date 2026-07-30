/**
 * recordingCoordinator — clipHandler 所有权 / 真实 dispatch（TEST-01, D-01..D-04）
 *
 * 断言经 commitRecordingIfActive → commitStopInternal → clipHandler?.(newAudio)，
 * 禁止直接调用 handler mock 再 expect toHaveBeenCalled（vacuous）。
 */

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Warning: 'warning' },
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Linking: { openSettings: jest.fn() },
}));

jest.mock('../../../../shared/audio/coordinator', () => ({
  audioCoordinator: { stop: jest.fn() },
}));

jest.mock('../../../../utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

import type { AudioData } from '../../../../types';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import {
  commitRecordingIfActive,
  forceCancelRecording,
  initRecordingCoordinator,
  recordingCoordinator,
  registerRecordingRecorder,
  releaseRecordingClipHandler,
  setRecordingClipHandler,
  unregisterRecordingRecorder,
} from '../../../../shared/audio/recordingCoordinator';

function makeRecorder(isRecording = true) {
  return {
    uri: 'file:///src.m4a',
    getStatus: jest.fn(() => ({ isRecording, durationMillis: 3000 })),
    stop: jest.fn().mockResolvedValue(undefined),
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
  };
}

describe('recordingCoordinator clipHandler ownership (real dispatch)', () => {
  let recordingState: string = 'idle';
  const sync = jest.fn((patch: { recordingState?: string }) => {
    if (patch.recordingState !== undefined) {
      recordingState = patch.recordingState;
    }
  });

  beforeEach(() => {
    recordingState = 'idle';
    sync.mockClear();
    initRecordingCoordinator(sync, () => recordingState as never);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 42,
    });
    (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    (requestRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    });
    (setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    setRecordingClipHandler(null);
    await forceCancelRecording();
  });

  it('stale release of superseded (tab) handler is a no-op; commit delivers only to edit handler', async () => {
    registerRecordingRecorder(makeRecorder(true) as never);

    const tabHandler = jest.fn<void, [AudioData]>();
    const editHandler = jest.fn<void, [AudioData]>();

    setRecordingClipHandler(tabHandler);
    setRecordingClipHandler(editHandler);
    releaseRecordingClipHandler(tabHandler);

    await commitRecordingIfActive();

    expect(editHandler).toHaveBeenCalledTimes(1);
    expect(editHandler.mock.calls[0][0]).toMatchObject({
      duration: 3,
      fileSize: 42,
      syncStatus: 'pending',
    });
    expect(tabHandler).not.toHaveBeenCalled();
  });

  it('release of current handler clears; subsequent commit does not call released handler', async () => {
    registerRecordingRecorder(makeRecorder(true) as never);

    const first = jest.fn<void, [AudioData]>();
    setRecordingClipHandler(first);
    releaseRecordingClipHandler(first);

    await commitRecordingIfActive();

    expect(first).not.toHaveBeenCalled();
  });

  it('setRecordingClipHandler(null) then commit does not call prior handler', async () => {
    registerRecordingRecorder(makeRecorder(true) as never);

    const handler = jest.fn<void, [AudioData]>();
    setRecordingClipHandler(handler);
    setRecordingClipHandler(null);

    await commitRecordingIfActive();

    expect(handler).not.toHaveBeenCalled();
  });

  it('commitRecordingIfActive is a no-op when recorder reports not recording', async () => {
    registerRecordingRecorder(makeRecorder(false) as never);

    const handler = jest.fn<void, [AudioData]>();
    setRecordingClipHandler(handler);

    await commitRecordingIfActive();

    expect(handler).not.toHaveBeenCalled();
  });

  it('commit delivers clip with duration/fileSize/syncStatus pending shape', async () => {
    registerRecordingRecorder(makeRecorder(true) as never);

    const handler = jest.fn<void, [AudioData]>();
    setRecordingClipHandler(handler);

    await commitRecordingIfActive();

    expect(handler).toHaveBeenCalledTimes(1);
    const clip = handler.mock.calls[0][0];
    expect(clip).toMatchObject({
      duration: 3,
      fileSize: 42,
      syncStatus: 'pending',
    });
    expect(typeof clip.localUri).toBe('string');
    expect(clip.localUri.length).toBeGreaterThan(0);
  });

  it('unregisterRecordingRecorder force-cancels and clears so subsequent commit does not deliver', async () => {
    const recorder = makeRecorder(true);
    registerRecordingRecorder(recorder as never);

    const handler = jest.fn<void, [AudioData]>();
    setRecordingClipHandler(handler);

    unregisterRecordingRecorder(recorder as never);

    await commitRecordingIfActive();

    expect(handler).not.toHaveBeenCalled();
  });

  it('forceCancelRecording during hung arm resets armInFlight so a later pressIn is not swallowed', async () => {
    let resolvePerm!: (value: { granted: boolean }) => void;
    (requestRecordingPermissionsAsync as jest.Mock).mockImplementation(
      () =>
        new Promise<{ granted: boolean }>((resolve) => {
          resolvePerm = resolve;
        }),
    );

    const recorder = makeRecorder(false);
    registerRecordingRecorder(recorder as never);

    recordingCoordinator.pressIn();
    await Promise.resolve();
    expect(recordingState).toBe('preparing');

    await forceCancelRecording();
    expect(recordingState).toBe('idle');

    resolvePerm({ granted: true });
    await new Promise((r) => setTimeout(r, 20));

    (requestRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    });
    recorder.prepareToRecordAsync.mockClear();
    recorder.record.mockClear();

    recordingCoordinator.pressIn();
    await new Promise((r) => setTimeout(r, 250));

    expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
    expect(recorder.record).toHaveBeenCalled();
    expect(recordingState).toBe('recording');
  });
});
