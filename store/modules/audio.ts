/**
 * 音频状态管理模块
 * 负责录音状态、播放状态管理
 */

import { StateCreator } from 'zustand';
import { audioCoordinator } from '../../shared/audio/coordinator';
import {
  commitRecordingIfActive,
  forceCancelRecording,
  recordingCoordinator,
} from '../../shared/audio/recordingCoordinator';
import { AudioData, MoodEntry, SyncStatus } from '../../types';
import { AppState, RecordingState } from './types';

/**
 * 音频播放状态（与 coordinator 写入字段一致）
 */
export interface AudioPlayerState {
  currentAudioId: string | null;
  playbackEntryId: string | null;
  playbackScope: "draft" | "entry" | null;
  isPlaying: boolean;
  playbackPosition: number;
  duration: number;
}

/**
 * 音频状态接口
 */
export interface AudioState extends AudioPlayerState {
  // 录音状态
  recordingState: RecordingState;
  recordingDuration: number;      // 当前录音时长（秒）
  currentRecordingUri: string | null; // 当前录音的本地URI
}

/**
 * 音频操作接口
 */
export interface AudioActions {
  // 播放控制（实际播放入口见 `shared/audio/coordinator`）
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (position: number) => void;
  setPlaybackPosition: (position: number) => void;

  // 录音控制
  setRecordingState: (state: RecordingState) => void;
  setRecordingDuration: (duration: number) => void;
  setCurrentRecordingUri: (uri: string | null) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioData | null>;
  cancelRecording: () => void;
}

/**
 * 计算 Entry 的同步状态
 * 只有当 Entry 本身及所有附件都 synced 时，Entry 才标记为 synced
 */
export function computeEntrySyncStatus(entry: MoodEntry): SyncStatus {
  if (!entry.audios?.length) {
    return entry.syncStatus || 'pending';
  }

  const allSynced = entry.audios.every(a => a.syncStatus === 'synced');
  const anyFailed = entry.audios.some(a => a.syncStatus === 'failed');

  if (anyFailed) return 'failed';
  return allSynced ? 'synced' : 'pending';
}

/**
 * 创建音频状态模块
 */
export const createAudioSlice: StateCreator<
  AppState,
  [],
  [],
  AudioState & AudioActions
> = (set, _get, _store) => ({
  // 播放状态初始值
  currentAudioId: null,
  playbackEntryId: null,
  playbackScope: null,
  isPlaying: false,
  playbackPosition: 0,
  duration: 0,

  // 录音状态初始值
  recordingState: 'idle',
  recordingDuration: 0,
  currentRecordingUri: null,

  // 播放控制
  pauseAudio: () => {
    audioCoordinator.pause();
  },

  stopAudio: () => {
    audioCoordinator.stop();
  },

  seekTo: (position: number) => {
    set({ playbackPosition: position });
  },

  setPlaybackPosition: (position: number) => {
    set({ playbackPosition: position });
  },

  // 录音控制
  setRecordingState: (state: RecordingState) => {
    set({ recordingState: state });
  },

  setRecordingDuration: (duration: number) => {
    set({ recordingDuration: duration });
  },

  setCurrentRecordingUri: (uri: string | null) => {
    set({ currentRecordingUri: uri });
  },

  startRecording: async () => {
    recordingCoordinator.pressIn();
  },

  stopRecording: async () => {
    return commitRecordingIfActive();
  },

  cancelRecording: () => {
    void forceCancelRecording();
  },
});

/**
 * 获取正在播放的音频ID
 */
export const getCurrentPlayingAudioId = (state: AppState): string | null => {
  return state.currentAudioId;
};

/**
 * 检查是否有音频正在播放
 */
export const isAudioPlaying = (state: AppState): boolean => {
  return state.isPlaying && state.currentAudioId !== null;
};
