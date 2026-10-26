/**
 * __DEV__ only — App Store Preview 演示数据（简体中文、可上镜）。
 * 禁止出现 Maestro / seed / UAT 等工程字样。
 */

import type { AppLocale } from "@/i18n/mapDeviceLocale";
import { setOnboardingMetaphorSeen } from "@/services/onboardingMetaphor";
import {
  saveLocalePreference,
  type LocalePreference,
} from "@/services/localeSettings";
import { getStorageKey, saveToStorage } from "@/store/modules/storage";
import { MoodLevel, Status, type MoodEntry } from "@/types";

export type AsoPreviewSeedOptions = {
  locale?: AppLocale;
  /** Active session user id; null → guest key */
  userId?: string | null;
};

function dayOffset(daysAgo: number, hour = 14): number {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

function priorYearSameDay(yearsAgo: number, hour = 10): number {
  const now = new Date();
  return new Date(
    now.getFullYear() - yearsAgo,
    now.getMonth(),
    now.getDate(),
    hour,
    0,
    0,
    0,
  ).getTime();
}

function entry(
  partial: Partial<MoodEntry> & Pick<MoodEntry, "id" | "timestamp" | "content">,
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content,
    deadline: partial.deadline ?? "week",
    people: partial.people ?? [],
    triggers: partial.triggers ?? [],
    status: partial.status ?? Status.ACTIVE,
    resolvedAt: partial.resolvedAt,
    deletedAt: partial.deletedAt,
  };
}

/**
 * 丰富、可上镜的中文演示日记。
 * 目标：气象站可翻阅、花园多花盆、人物时间线有多条轨迹、往年今日有内容。
 */
export function buildAsoPreviewEntries(now = new Date()): MoodEntry[] {
  void now;
  const y1 = priorYearSameDay(1);
  const y2 = priorYearSameDay(2);
  return [
    // —— 今天 / 近几日（首页列表上半）——
    entry({
      id: "aso-zh-friend-1",
      timestamp: dayOffset(0, 11),
      moodLevel: MoodLevel.ANNOYED,
      content: "和朋友约好了见面，心里其实有点忐忑，想把话说清楚。",
      people: ["朋友"],
      triggers: ["沟通"],
      deadline: "today",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-partner-1",
      timestamp: dayOffset(0, 19),
      moodLevel: MoodLevel.UPSET,
      content: "晚餐时语气有点冲，回家路上又后悔了，想找个温柔的方式说开。",
      people: ["伴侣"],
      triggers: ["亲密关系"],
      deadline: "today",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-colleague-1",
      timestamp: dayOffset(1, 16),
      moodLevel: MoodLevel.UPSET,
      content: "项目里意见不合，先记下来，周末再慢慢谈。",
      people: ["同事"],
      triggers: ["工作"],
      deadline: "week",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-family-1",
      timestamp: dayOffset(2, 21),
      moodLevel: MoodLevel.ANNOYED,
      content: "爸妈电话里叮嘱太多，心里堵了一下，但知道他们是关心。",
      people: ["家人"],
      triggers: ["家庭"],
      deadline: "self",
      status: Status.PROCESSING,
    }),
    entry({
      id: "aso-zh-friend-2",
      timestamp: dayOffset(3, 20),
      moodLevel: MoodLevel.ANGRY,
      content: "那晚语气有点冲，后来想通了，关系还是想好好呵护。",
      people: ["朋友"],
      triggers: ["误解"],
      deadline: "self",
      status: Status.RESOLVED,
      resolvedAt: dayOffset(2, 9),
    }),
    entry({
      id: "aso-zh-self-1",
      timestamp: dayOffset(4, 22),
      moodLevel: MoodLevel.ANNOYED,
      content: "今天天空还亮着，给自己留一点柔软，不急着证明什么。",
      people: [],
      triggers: ["自我"],
      deadline: "self",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-colleague-2",
      timestamp: dayOffset(5, 12),
      moodLevel: MoodLevel.UPSET,
      content: "会上被打断，先写下来，不急着当场回应。",
      people: ["同事"],
      triggers: ["边界"],
      deadline: "later",
      status: Status.PROCESSING,
    }),
    entry({
      id: "aso-zh-friend-3",
      timestamp: dayOffset(6, 18),
      moodLevel: MoodLevel.ANNOYED,
      content: "朋友临时取消了约定，失落了一会儿，给自己倒了杯热水。",
      people: ["朋友"],
      triggers: ["期待"],
      deadline: "self",
      status: Status.RESOLVED,
      resolvedAt: dayOffset(5, 10),
    }),
    entry({
      id: "aso-zh-partner-2",
      timestamp: dayOffset(7, 9),
      moodLevel: MoodLevel.ANGRY,
      content: "为家务分工吵了一架，冷静后决定一起列一张清单。",
      people: ["伴侣"],
      triggers: ["家务"],
      deadline: "week",
      status: Status.RESOLVED,
      resolvedAt: dayOffset(6, 20),
    }),
    entry({
      id: "aso-zh-colleague-3",
      timestamp: dayOffset(9, 15),
      moodLevel: MoodLevel.FURIOUS,
      content: "需求又改了一版，火气上来了，出去走了十分钟再回工位。",
      people: ["同事"],
      triggers: ["压力"],
      deadline: "later",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-family-2",
      timestamp: dayOffset(11, 20),
      moodLevel: MoodLevel.UPSET,
      content: "亲戚催婚的玩笑让人不舒服，下次想清楚怎么温和地挡回去。",
      people: ["家人"],
      triggers: ["边界"],
      deadline: "month",
      status: Status.ACTIVE,
    }),
    entry({
      id: "aso-zh-self-2",
      timestamp: dayOffset(13, 7),
      moodLevel: MoodLevel.ANNOYED,
      content: "早起心情毛毛的，写三行就好，不必一次想通所有事。",
      people: [],
      triggers: ["自我"],
      deadline: "self",
      status: Status.RESOLVED,
      resolvedAt: dayOffset(12, 21),
    }),
    // —— 往年今日（花园「往年今日」卡）——
    entry({
      id: "aso-zh-otd-1",
      timestamp: y1,
      moodLevel: MoodLevel.ANNOYED,
      content: "那年的今天，也是这样轻轻记下心情。",
      people: ["朋友"],
      triggers: ["回忆"],
      deadline: "self",
      status: Status.RESOLVED,
      resolvedAt: y1 + 86400000,
    }),
    entry({
      id: "aso-zh-otd-2",
      timestamp: y2,
      moodLevel: MoodLevel.UPSET,
      content: "两年前的自己，已经走过那片阴天了。",
      people: ["朋友"],
      triggers: ["成长"],
      deadline: "self",
      status: Status.RESOLVED,
      resolvedAt: y2 + 2 * 86400000,
    }),
  ];
}

async function setLocale(locale: AppLocale): Promise<void> {
  const preference: LocalePreference = { mode: "manual", locale };
  await saveLocalePreference(preference);
}

/**
 * 写入演示数据。录屏前请在路由层调用 LogBox.ignoreAllLogs(true) 去掉 Dev 黄条。
 */
export async function runAsoPreviewSeed(
  options: AsoPreviewSeedOptions = {},
): Promise<MoodEntry[]> {
  if (!__DEV__) {
    return [];
  }

  await setOnboardingMetaphorSeen(true);

  const locale = options.locale ?? "zh-Hans";
  await setLocale(locale);

  const entries = buildAsoPreviewEntries();
  const key = getStorageKey(options.userId ?? null);
  await saveToStorage(key, entries);
  return entries;
}
