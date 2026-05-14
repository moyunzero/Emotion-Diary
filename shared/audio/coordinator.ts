/**
 * 全局单一音频播放协调器（止血层）
 *
 * - 全应用最多一个 expo-audio 播放实例；新播放自动替换旧实例。
 * - 通过 initAudioCoordinator 注入的 Zustand set 同步 UI（currentAudioId / isPlaying / position 等）。
 * - 不 import store，避免循环依赖；由 useAppStore 创建时注册 sync。
 */

import { AudioStatus, createAudioPlayer } from "expo-audio";
import { getInfoAsync } from "expo-file-system";
import type { AudioData } from "../../types";
import { logger } from "../../utils/logger";
import { resolveAudioSource } from "./playback";

/** 草稿（记一笔/编辑弹窗）与已落库条目卡片 */
export type PlaybackScope = "draft" | "entry";

export type PlaybackStorePatch = {
  currentAudioId?: string | null;
  playbackEntryId?: string | null;
  playbackScope?: PlaybackScope | null;
  isPlaying?: boolean;
  playbackPosition?: number;
  duration?: number;
};

type SyncFn = (patch: PlaybackStorePatch) => void;

let syncToStore: SyncFn | null = null;

let player: ReturnType<typeof createAudioPlayer> | null = null;
let statusListener: ((status: AudioStatus) => void) | null = null;
/** 当前绑定到 player 的音频 id（与 store.currentAudioId 一致，便于 toggle） */
let boundAudioId: string | null = null;
let boundDurationSec = 0;
/** 原生层是否在走时间轴（play 之后 pause 之前） */
let isNativePlaying = false;

export function initAudioCoordinator(sync: SyncFn): void {
  syncToStore = sync;
}

function detachListener(): void {
  if (player && statusListener) {
    try {
      (player as { removeListener: (e: string, l: unknown) => void }).removeListener(
        "playbackStatusUpdate",
        statusListener,
      );
    } catch {
      // ignore
    }
  }
  statusListener = null;
}

function disposePlayer(): void {
  detachListener();
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // ignore
    }
    player = null;
  }
  boundAudioId = null;
  boundDurationSec = 0;
  isNativePlaying = false;
}

function applyStopped(): void {
  syncToStore?.({
    currentAudioId: null,
    playbackEntryId: null,
    playbackScope: null,
    isPlaying: false,
    playbackPosition: 0,
    duration: 0,
  });
}

async function resolvePlayableUri(audio: AudioData): Promise<string | null> {
  return resolveAudioSource(audio, async (u) => {
    const info = await getInfoAsync(u);
    return info.exists;
  });
}

export const audioCoordinator = {
  /**
   * 看板卡片：再次点击正在播的同一条 → 停止（与旧 EntryCard toggle 一致）
   */
  async playEntryAudio(
    entryId: string,
    audio: AudioData,
  ): Promise<{ ok: true } | { ok: false; reason: "no_uri" | "error" }> {
    try {
      if (boundAudioId === audio.id && isNativePlaying) {
        disposePlayer();
        applyStopped();
        return { ok: true };
      }

      const uri = await resolvePlayableUri(audio);
      if (!uri) {
        return { ok: false, reason: "no_uri" };
      }

      disposePlayer();

      const p = createAudioPlayer(uri);
      player = p;
      boundAudioId = audio.id;
      boundDurationSec = audio.duration;

      syncToStore?.({
        currentAudioId: audio.id,
        playbackEntryId: entryId,
        playbackScope: "entry",
        isPlaying: true,
        playbackPosition: 0,
        duration: audio.duration,
      });
      isNativePlaying = true;

      const listener = (status: AudioStatus) => {
        if (status.currentTime !== undefined) {
          const clamped = Math.min(status.currentTime, boundDurationSec);
          syncToStore?.({ playbackPosition: clamped });
        }
        if (status.didJustFinish) {
          disposePlayer();
          applyStopped();
        }
      };
      statusListener = listener;
      (p as { addListener: (e: string, l: (s: AudioStatus) => void) => void }).addListener(
        "playbackStatusUpdate",
        listener,
      );
      p.play();
      return { ok: true };
    } catch (e) {
      logger.warn("audioCoordinator", "playEntryAudio 失败", e);
      disposePlayer();
      applyStopped();
      return { ok: false, reason: "error" };
    }
  },

  /** 记一笔 / 编辑表单内试听 */
  async playDraftAudio(
    audio: AudioData,
  ): Promise<{ ok: true } | { ok: false; reason: "no_uri" | "error" }> {
    try {
      const uri = await resolvePlayableUri(audio);
      if (!uri) {
        return { ok: false, reason: "no_uri" };
      }

      disposePlayer();

      const p = createAudioPlayer(uri);
      player = p;
      boundAudioId = audio.id;
      boundDurationSec = audio.duration;

      syncToStore?.({
        currentAudioId: audio.id,
        playbackEntryId: null,
        playbackScope: "draft",
        isPlaying: true,
        playbackPosition: 0,
        duration: audio.duration,
      });
      isNativePlaying = true;

      const listener = (status: AudioStatus) => {
        if (status.currentTime !== undefined) {
          const clamped = Math.min(status.currentTime, boundDurationSec);
          syncToStore?.({ playbackPosition: clamped });
        }
        if (status.didJustFinish) {
          disposePlayer();
          applyStopped();
        }
      };
      statusListener = listener;
      (p as { addListener: (e: string, l: (s: AudioStatus) => void) => void }).addListener(
        "playbackStatusUpdate",
        listener,
      );
      p.play();
      return { ok: true };
    } catch (e) {
      logger.warn("audioCoordinator", "playDraftAudio 失败", e);
      disposePlayer();
      applyStopped();
      return { ok: false, reason: "error" };
    }
  },

  pause(): void {
    if (!player) return;
    try {
      player.pause();
    } catch {
      // ignore
    }
    isNativePlaying = false;
    syncToStore?.({ isPlaying: false });
  },

  stop(): void {
    disposePlayer();
    applyStopped();
  },
};
