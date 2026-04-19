/**
 * 音频状态管理模块
 * 负责录音状态、播放状态管理
 */

import { StateCreator } from 'zustand';
import { AudioData, MoodEntry, SyncStatus } from '../../types';
import { AppStore } from './types';

/**
 * 录音状态
 */
export type RecordingState =
  | 'idle'        // 空闲，显示"按住说话"
  | 'recording'   // 正在录音，显示"松开结束" + 波形
  | 'canceling'   // 向上滑动取消，显示"松开取消"
  | 'processing'  // 录音结束，正在处理文件
  | 'preview';    // 显示预览和播放/删除按钮

/**
 * 音频播放状态
 */
export interface AudioPlayerState {
  currentAudioId: string | null;  // 当前播放的音频ID
  isPlaying: boolean;
  playbackPosition: number;      // 当前播放位置（秒）
  duration: number;              // 总时长
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
  // 播放控制
  playAudio: (audioId: string, uri: string) => void;
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
  AppStore,
  [],
  [],
  AudioState & AudioActions
> = (set, get, _store) => ({
  // 播放状态初始值
  currentAudioId: null,
  isPlaying: false,
  playbackPosition: 0,
  duration: 0,

  // 录音状态初始值
  recordingState: 'idle',
  recordingDuration: 0,
  currentRecordingUri: null,

  // 播放控制
  playAudio: (audioId: string, _uri: string) => {
    set({
      currentAudioId: audioId,
      isPlaying: true,
    });
  },

  pauseAudio: () => {
    set({ isPlaying: false });
  },

  stopAudio: () => {
    set({
      currentAudioId: null,
      isPlaying: false,
      playbackPosition: 0,
    });
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
    set({
      recordingState: 'recording',
      recordingDuration: 0,
      currentRecordingUri: null,
    });
  },

  stopRecording: async () => {
    const { currentRecordingUri, recordingDuration } = get();

    if (!currentRecordingUri) {
      set({ recordingState: 'idle' });
      return null;
    }

    const audioData: AudioData = {
      id: Date.now().toString(),
      localUri: currentRecordingUri,
      duration: recordingDuration,
      fileSize: 0, // 会在上传前计算
      fileHash: '', // 会在上传前计算
      createdAt: Date.now(),
      syncStatus: 'pending',
    };

    set({
      recordingState: 'preview',
      currentRecordingUri: null,
      recordingDuration: 0,
    });

    return audioData;
  },

  cancelRecording: () => {
    set({
      recordingState: 'idle',
      recordingDuration: 0,
      currentRecordingUri: null,
    });
  },
});

/**
 * 获取正在播放的音频ID
 */
export const getCurrentPlayingAudioId = (state: AppStore): string | null => {
  return state.currentAudioId;
};

/**
 * 检查是否有音频正在播放
 */
export const isAudioPlaying = (state: AppStore): boolean => {
  return state.isPlaying && state.currentAudioId !== null;
};
