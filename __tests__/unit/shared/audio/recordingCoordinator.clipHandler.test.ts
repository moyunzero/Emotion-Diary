/**
 * recordingCoordinator — clipHandler 所有权（§2.3 回归）
 */

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
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
  releaseRecordingClipHandler,
  setRecordingClipHandler,
} from '../../../../shared/audio/recordingCoordinator';

function makeHandler(tag: string): (clip: AudioData) => void {
  return jest.fn((clip: AudioData) => {
    void tag;
    void clip;
  });
}

describe('recordingCoordinator clipHandler ownership', () => {
  const clip: AudioData = {
    id: '1',
    localUri: 'file:///a.m4a',
    duration: 1,
    fileSize: 1,
    fileHash: 'h',
    createdAt: 1,
    syncStatus: 'pending',
  };

  afterEach(() => {
    setRecordingClipHandler(null);
  });

  it('release 非当前 handler 后当前 handler 仍占住协调器（set(null) 能清空）', () => {
    const a = makeHandler('a');
    const b = makeHandler('b');
    setRecordingClipHandler(a);
    setRecordingClipHandler(b);

    releaseRecordingClipHandler(a);
    setRecordingClipHandler(null);

    const c = makeHandler('c');
    setRecordingClipHandler(c);
    c(clip);
    expect(c).toHaveBeenCalled();
    expect(a).not.toHaveBeenCalled();
  });

  it('release 当前 handler 后新 set 可正常注册', () => {
    const first = makeHandler('first');
    setRecordingClipHandler(first);
    releaseRecordingClipHandler(first);

    const second = makeHandler('second');
    setRecordingClipHandler(second);

    second(clip);
    expect(second).toHaveBeenCalledWith(clip);
  });

  it('setRecordingClipHandler(null) 清空全局 handler', () => {
    const handler = makeHandler('h');
    setRecordingClipHandler(handler);
    setRecordingClipHandler(null);

    const next = makeHandler('next');
    setRecordingClipHandler(next);

    next(clip);
    expect(next).toHaveBeenCalled();
  });
});
