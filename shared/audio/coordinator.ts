/**
 * 全局单一音频播放协调器（止血层）
 *
 * - 全应用最多一个 expo-audio 播放实例；新播放自动替换旧实例。
 * - 通过 initAudioCoordinator 注入的 Zustand set 同步 UI（currentAudioId / isPlaying / position 等）。
 * - 不 import store，避免循环依赖；由 useAppStore 创建时注册 sync。
 */

import {
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { getInfoAsync } from "expo-file-system";
import type { AudioData } from "../../types";
import { logger } from "../../utils/logger";
import { isLocalPlaybackSource, resolveAudioSource } from "./playback";

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
/** Play-time: path / legacy public URL → short-lived signed URL (D-06). */
export type AudioRemoteResolver = (stored: string) => Promise<string | null>;

let syncToStore: SyncFn | null = null;
let resolveRemote: AudioRemoteResolver | null = null;

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

/**
 * Inject play-time remote signer (from services/audioSync via store bootstrap).
 * Keeps shared/audio free of services imports.
 */
export function setAudioRemoteResolver(fn: AudioRemoteResolver | null): void {
  resolveRemote = fn;
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
  const source = await resolveAudioSource(audio, async (u) => {
    const info = await getInfoAsync(u);
    return info.exists;
  });
  if (!source) return null;
  // Local file hit — skip network sign (D-06 play-time only for remote/path)
  if (isLocalPlaybackSource(source, audio)) {
    return source;
  }
  if (!resolveRemote) {
    return source;
  }
  return resolveRemote(source);
}

/**
 * 播放前激活 AVAudioSession。
 *
 * 现象：冷路径直接进「关系时间线」点播无声；先在「情绪气象站」播过一次后再进时间线就正常。
 * 气象站首播会把会话拉到可出声状态；从 Insights 进时间线时 blur 会 forceCancel，
 * 但卡片 playEntryAudio 原先从不 setAudioMode，冷会话上 createAudioPlayer().play() 可能无声且不抛错。
 */
async function ensurePlaybackAudioMode(): Promise<boolean> {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      // 独占播放：比 mixWithOthers 更接近「气象站首播成功」后的可听会话
      interruptionMode: "doNotMix",
    });
    return true;
  } catch (e) {
    logger.warn("audioCoordinator", "setAudioModeAsync 播放模式失败", e);
    return false;
  }
}

/** 供栈页 focus 时预热（与 play 入口共用同一套模式） */
export async function preparePlaybackAudioMode(): Promise<void> {
  await ensurePlaybackAudioMode();
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

      const modeOk = await ensurePlaybackAudioMode();
      if (!modeOk) {
        return { ok: false, reason: "error" };
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

      const modeOk = await ensurePlaybackAudioMode();
      if (!modeOk) {
        return { ok: false, reason: "error" };
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
