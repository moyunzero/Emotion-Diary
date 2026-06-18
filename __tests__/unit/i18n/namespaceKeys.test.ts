/**
 * INS-03, INS-04, SYS-01, SYS-02, SYS-05 — bilingual key parity gate for six namespaces
 */

import zhCommon from "@/locales/zh-Hans/common.json";
import enCommon from "@/locales/en-US/common.json";
import zhProfile from "@/locales/zh-Hans/profile.json";
import enProfile from "@/locales/en-US/profile.json";
import zhSync from "@/locales/zh-Hans/sync.json";
import enSync from "@/locales/en-US/sync.json";
import zhAuth from "@/locales/zh-Hans/auth.json";
import enAuth from "@/locales/en-US/auth.json";
import zhRetention from "@/locales/zh-Hans/retention.json";
import enRetention from "@/locales/en-US/retention.json";
import zhRecycle from "@/locales/zh-Hans/recycle.json";
import enRecycle from "@/locales/en-US/recycle.json";
import zhDashboard from "@/locales/zh-Hans/dashboard.json";
import enDashboard from "@/locales/en-US/dashboard.json";
import zhInsights from "@/locales/zh-Hans/insights.json";
import enInsights from "@/locales/en-US/insights.json";
import zhSystem from "@/locales/zh-Hans/system.json";
import enSystem from "@/locales/en-US/system.json";
import zhMood from "@/locales/zh-Hans/mood.json";
import enMood from "@/locales/en-US/mood.json";
import zhRecord from "@/locales/zh-Hans/record.json";
import enRecord from "@/locales/en-US/record.json";
import zhReview from "@/locales/zh-Hans/review.json";
import enReview from "@/locales/en-US/review.json";
import zhTabs from "@/locales/zh-Hans/tabs.json";
import enTabs from "@/locales/en-US/tabs.json";

function collectLeafPaths(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      paths.push(
        ...collectLeafPaths(value as Record<string, unknown>, path),
      );
    } else {
      paths.push(path);
    }
  }
  return paths;
}

const NAMESPACE_PAIRS: Array<{
  name: string;
  zh: Record<string, unknown>;
  en: Record<string, unknown>;
}> = [
  { name: "common", zh: zhCommon, en: enCommon },
  { name: "profile", zh: zhProfile, en: enProfile },
  { name: "sync", zh: zhSync, en: enSync },
  { name: "auth", zh: zhAuth, en: enAuth },
  { name: "retention", zh: zhRetention, en: enRetention },
  { name: "recycle", zh: zhRecycle, en: enRecycle },
  { name: "tabs", zh: zhTabs, en: enTabs },
  { name: "review", zh: zhReview, en: enReview },
  { name: "mood", zh: zhMood, en: enMood },
  { name: "record", zh: zhRecord, en: enRecord },
  { name: "dashboard", zh: zhDashboard, en: enDashboard },
  { name: "insights", zh: zhInsights, en: enInsights },
  { name: "system", zh: zhSystem, en: enSystem },
];

describe("namespace key parity (zh-Hans vs en-US)", () => {
  for (const { name, zh, en } of NAMESPACE_PAIRS) {
    it(`${name} namespace has matching leaf key paths`, () => {
      const zhPaths = collectLeafPaths(zh).sort();
      const enPaths = collectLeafPaths(en).sort();
      expect(enPaths).toEqual(zhPaths);
    });
  }
});
