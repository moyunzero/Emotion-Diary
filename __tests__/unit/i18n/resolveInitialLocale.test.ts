/**
 * I18N-01 + I18N-03: resolveInitialLocale 偏好与设备合并
 */

import { resolveInitialLocale } from "@/i18n/resolveInitialLocale";
import type { LocalePreference } from "@/services/localeSettings";

describe("resolveInitialLocale", () => {
  it("manual en-US beats zh device tag", () => {
    const preference: LocalePreference = {
      mode: "manual",
      locale: "en-US",
    };
    expect(resolveInitialLocale(preference, "zh-CN")).toBe("en-US");
  });

  it("system mode follows en device tag", () => {
    const preference: LocalePreference = { mode: "system" };
    expect(resolveInitialLocale(preference, "en-GB")).toBe("en-US");
  });

  it("system mode maps zh-Hant to zh-Hans", () => {
    const preference: LocalePreference = { mode: "system" };
    expect(resolveInitialLocale(preference, "zh-Hant")).toBe("zh-Hans");
  });
});
