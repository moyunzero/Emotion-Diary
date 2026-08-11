/**
 * audioCoordinator — audio-mode setup failure must not create/start a player.
 */

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(),
  createAudioPlayer: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import {
  audioCoordinator,
  initAudioCoordinator,
} from '@/shared/audio/coordinator';
import type { AudioData } from '@/types';

const audio: AudioData = {
  id: 'a1',
  localUri: 'file:///clip.m4a',
  duration: 3,
  fileSize: 100,
  fileHash: 'abc',
  createdAt: Date.now(),
  syncStatus: 'pending',
};

describe('audioCoordinator ensurePlaybackAudioMode failures', () => {
  beforeEach(() => {
    initAudioCoordinator(jest.fn());
    jest.mocked(setAudioModeAsync).mockReset();
    jest.mocked(createAudioPlayer).mockReset();
    audioCoordinator.stop();
  });

  it('playEntryAudio returns error and does not create player when setAudioModeAsync fails', async () => {
    jest.mocked(setAudioModeAsync).mockRejectedValue(new Error('mode fail'));
    const result = await audioCoordinator.playEntryAudio('e1', audio);
    expect(result).toEqual({ ok: false, reason: 'error' });
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('playDraftAudio returns error and does not create player when setAudioModeAsync fails', async () => {
    jest.mocked(setAudioModeAsync).mockRejectedValue(new Error('mode fail'));
    const result = await audioCoordinator.playDraftAudio(audio);
    expect(result).toEqual({ ok: false, reason: 'error' });
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });
});
