import "i18next";
import type zhAi from "../locales/zh-Hans/ai.json";
import type zhAuth from "../locales/zh-Hans/auth.json";
import type zhCommon from "../locales/zh-Hans/common.json";
import type zhDashboard from "../locales/zh-Hans/dashboard.json";
import type zhInsights from "../locales/zh-Hans/insights.json";
import type zhMood from "../locales/zh-Hans/mood.json";
import type zhSystem from "../locales/zh-Hans/system.json";
import type zhProfile from "../locales/zh-Hans/profile.json";
import type zhRecord from "../locales/zh-Hans/record.json";
import type zhRecycle from "../locales/zh-Hans/recycle.json";
import type zhRetention from "../locales/zh-Hans/retention.json";
import type zhReview from "../locales/zh-Hans/review.json";
import type zhSync from "../locales/zh-Hans/sync.json";
import type zhTabs from "../locales/zh-Hans/tabs.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
      profile: typeof zhProfile;
      sync: typeof zhSync;
      auth: typeof zhAuth;
      retention: typeof zhRetention;
      recycle: typeof zhRecycle;
      tabs: typeof zhTabs;
      review: typeof zhReview;
      mood: typeof zhMood;
      record: typeof zhRecord;
      dashboard: typeof zhDashboard;
      insights: typeof zhInsights;
      system: typeof zhSystem;
      ai: typeof zhAi;
    };
  }
}
