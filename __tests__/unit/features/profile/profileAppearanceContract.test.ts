/**
 * NIGHT-01 Wave 0 — Profile appearance section contract (RED until Plan 03).
 * UI-SPEC Copywriting: 外观三档; forbid gamification strings (D-02, D-03).
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../../..");
const profileFeaturesDir = path.join(root, "features/profile");
const zhProfilePath = path.join(root, "locales/zh-Hans/profile.json");
const enProfilePath = path.join(root, "locales/en-US/profile.json");

const FORBIDDEN_GAMIFICATION = [
  "解锁夜间",
  "Pro 深色",
  "限时主题",
  "打卡换皮肤",
  "连续使用解锁",
];

function findAppearanceSectionSource(): string {
  const componentsDir = path.join(profileFeaturesDir, "components");
  const names = fs.readdirSync(componentsDir);
  const match = names.find((name) =>
    /ProfileAppearanceSection|AppearanceSection/i.test(name),
  );
  if (!match) {
    return "";
  }
  return fs.readFileSync(path.join(componentsDir, match), "utf8");
}

describe("profileAppearanceContract (NIGHT-01 · D-02 D-03)", () => {
  it("ships ProfileAppearanceSection wired like ProfileLanguageSection", () => {
    const source = findAppearanceSectionSource();
    expect(source.length).toBeGreaterThan(0);
    expect(source).toMatch(/ProfileSectionHeader|GroupedSettingsCard/);
    expect(source).toMatch(/useTranslation\s*\(\s*['"]profile['"]\s*\)/);
  });

  it("locale keys cover 外观 / 跟随系统 / 粉纸浅色 / 粉墨深色", () => {
    const zh = JSON.parse(fs.readFileSync(zhProfilePath, "utf8")) as {
      appearance?: {
        sectionTitle?: string;
        options?: Record<string, string>;
      };
    };
    const en = JSON.parse(fs.readFileSync(enProfilePath, "utf8")) as {
      appearance?: {
        sectionTitle?: string;
        options?: Record<string, string>;
      };
    };

    expect(zh.appearance?.sectionTitle).toBe("外观");
    expect(zh.appearance?.options?.followSystem).toBe("跟随系统");
    expect(zh.appearance?.options?.light).toBe("粉纸浅色");
    expect(zh.appearance?.options?.night).toBe("粉墨深色");

    expect(en.appearance?.sectionTitle).toBe("Appearance");
    expect(en.appearance?.options?.followSystem).toMatch(/Match system/i);
    expect(en.appearance?.options?.light).toMatch(/Pink paper/i);
    expect(en.appearance?.options?.night).toMatch(/Pink ink/i);
  });

  it("forbids gamification copy in appearance sources and profile locales", () => {
    const source = findAppearanceSectionSource();
    const localeBlob = [
      fs.readFileSync(zhProfilePath, "utf8"),
      fs.readFileSync(enProfilePath, "utf8"),
      source,
    ].join("\n");

    for (const phrase of FORBIDDEN_GAMIFICATION) {
      expect(localeBlob).not.toContain(phrase);
    }
  });
});
