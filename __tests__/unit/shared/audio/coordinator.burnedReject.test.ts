/**
 * Wave 0 RED — playEntryAudio BURNED reject (ECHO-03 / D-35)
 * Rejects Status.BURNED with reason burned; does not create a player.
 * GREEN in Plan 04. Mirrors coordinator.audioMode mock style.
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
import { Status } from '@/types';

const audio: AudioData = {
  id: 'a1',
  localUri: 'file:///clip.m4a',
  duration: 3,
  fileSize: 100,
  fileHash: 'abc',
  createdAt: Date.now(),
  syncStatus: 'pending',
};

describe('audioCoordinator playEntryAudio BURNED reject (D-35)', () => {
  beforeEach(() => {
    initAudioCoordinator(jest.fn());
    jest.mocked(setAudioModeAsync).mockReset();
    jest.mocked(createAudioPlayer).mockReset();
    jest.mocked(setAudioModeAsync).mockResolvedValue(undefined as never);
    audioCoordinator.stop();
  });

  it('rejects Status.BURNED with reason burned and does not create a player', async () => {
    const result = await audioCoordinator.playEntryAudio(
      'e-burned',
      audio,
      Status.BURNED,
    );
    expect(result).toEqual({ ok: false, reason: 'burned' });
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(setAudioModeAsync).not.toHaveBeenCalled();
  });

  it('still allows ACTIVE playback path to attempt player creation', async () => {
    jest.mocked(createAudioPlayer).mockReturnValue({
      play: jest.fn(),
      remove: jest.fn(),
      addListener: jest.fn(),
    } as never);
    const result = await audioCoordinator.playEntryAudio(
      'e-active',
      audio,
      Status.ACTIVE,
    );
    expect(result).toEqual({ ok: true });
    expect(createAudioPlayer).toHaveBeenCalled();
  });
});
