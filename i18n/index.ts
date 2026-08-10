import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import enAi from "../locales/en-US/ai.json";
import enOnboarding from "../locales/en-US/onboarding.json";
import enRituals from "../locales/en-US/rituals.json";
import enAuth from "../locales/en-US/auth.json";
import enCommon from "../locales/en-US/common.json";
import enDashboard from "../locales/en-US/dashboard.json";
import enInsights from "../locales/en-US/insights.json";
import enMood from "../locales/en-US/mood.json";
import enSystem from "../locales/en-US/system.json";
import enProfile from "../locales/en-US/profile.json";
import enRecord from "../locales/en-US/record.json";
import enRecycle from "../locales/en-US/recycle.json";
import enRetention from "../locales/en-US/retention.json";
import enReview from "../locales/en-US/review.json";
import enShare from "../locales/en-US/share.json";
import enSync from "../locales/en-US/sync.json";
import enTabs from "../locales/en-US/tabs.json";
import enPersonTimeline from "../locales/en-US/personTimeline.json";
import enOnThisDay from "../locales/en-US/onThisDay.json";
import zhAi from "../locales/zh-Hans/ai.json";
import zhOnboarding from "../locales/zh-Hans/onboarding.json";
import zhRituals from "../locales/zh-Hans/rituals.json";
import zhAuth from "../locales/zh-Hans/auth.json";
import zhCommon from "../locales/zh-Hans/common.json";
import zhDashboard from "../locales/zh-Hans/dashboard.json";
import zhInsights from "../locales/zh-Hans/insights.json";
import zhMood from "../locales/zh-Hans/mood.json";
import zhSystem from "../locales/zh-Hans/system.json";
import zhProfile from "../locales/zh-Hans/profile.json";
import zhRecord from "../locales/zh-Hans/record.json";
import zhRecycle from "../locales/zh-Hans/recycle.json";
import zhRetention from "../locales/zh-Hans/retention.json";
import zhReview from "../locales/zh-Hans/review.json";
import zhShare from "../locales/zh-Hans/share.json";
import zhSync from "../locales/zh-Hans/sync.json";
import zhTabs from "../locales/zh-Hans/tabs.json";
import zhPersonTimeline from "../locales/zh-Hans/personTimeline.json";
import zhOnThisDay from "../locales/zh-Hans/onThisDay.json";
import type { AppLocale } from "./mapDeviceLocale";
import { resolveInitialLocale } from "./resolveInitialLocale";
import {
  loadLocalePreference,
  type LocalePreference,
} from "../services/localeSettings";

export { i18n };

export async function changeAppLanguage(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export type InitI18nResult = {
  effectiveLocale: AppLocale;
  preference: LocalePreference;
};

/**
 * 冷启动 i18n：读持久化偏好 → 解析 effective locale → init/changeLanguage。
 */
export async function initI18n(): Promise<InitI18nResult> {
  const preference = await loadLocalePreference();
  const deviceTag =
    Localization.getLocales()[0]?.languageTag ?? "zh-Hans";
  const effectiveLocale = resolveInitialLocale(preference, deviceTag);

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        "zh-Hans": {
          common: zhCommon,
          profile: zhProfile,
          sync: zhSync,
          auth: zhAuth,
          retention: zhRetention,
          recycle: zhRecycle,
          personTimeline: zhPersonTimeline,
          onThisDay: zhOnThisDay,
          tabs: zhTabs,
          review: zhReview,
          share: zhShare,
          mood: zhMood,
          record: zhRecord,
          dashboard: zhDashboard,
          insights: zhInsights,
          system: zhSystem,
          ai: zhAi,
          onboarding: zhOnboarding,
          rituals: zhRituals,
        },
        "en-US": {
          common: enCommon,
          profile: enProfile,
          sync: enSync,
          auth: enAuth,
          retention: enRetention,
          recycle: enRecycle,
          personTimeline: enPersonTimeline,
          onThisDay: enOnThisDay,
          tabs: enTabs,
          review: enReview,
          share: enShare,
          mood: enMood,
          record: enRecord,
          dashboard: enDashboard,
          insights: enInsights,
          system: enSystem,
          ai: enAi,
          onboarding: enOnboarding,
          rituals: enRituals,
        },
      },
      lng: effectiveLocale,
      fallbackLng: "zh-Hans",
      supportedLngs: ["zh-Hans", "en-US"],
      defaultNS: "common",
      ns: [
        "common",
        "profile",
        "sync",
        "auth",
        "retention",
        "recycle",
        "personTimeline",
        "onThisDay",
        "tabs",
        "review",
        "share",
        "mood",
        "record",
        "dashboard",
        "insights",
        "system",
        "ai",
        "onboarding",
        "rituals",
      ],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      returnNull: false,
    });
  } else {
    await i18n.changeLanguage(effectiveLocale);
  }

  return { effectiveLocale, preference };
}
