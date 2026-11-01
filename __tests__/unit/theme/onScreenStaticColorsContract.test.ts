/**
 * G-26 night sweep — on-screen modules must not use static COLORS chrome.
 * D-06 share/export allowlist unchanged (see insightsOnScreenThemeContract).
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

const STATIC_COLORS_IMPORT =
  /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*['"]@?\/?.*constants\/colors/;

const MODULE_TOP_CARD_CHROME =
  /^(?:const|let)\s+\w+\s*=\s*COLORS\.(?:background\.(?:primary|page|gradientStart)|surface)\b/m;

/** Style factories must accept active palette */
const STYLE_FACTORY_DENY = [
  "features/recycleBin/recycleBin.styles.ts",
  "features/onThisDay/onThisDay.styles.ts",
  "features/personTimeline/personTimeline.styles.ts",
  "components/retention/retention.styles.ts",
] as const;

/** Screens / cards must wire useThemeStyles → factory(colors) */
const SCREEN_DENY = [
  "features/recycleBin/RecycleBinScreen.tsx",
  "components/entries/RecycleBinEntryCard.tsx",
  "features/onThisDay/OnThisDayScreen.tsx",
  "components/onThisDay/OnThisDayPersonSlot.tsx",
  "features/personTimeline/PersonTimelineScreen.tsx",
  "components/retention/RevisitBanner.tsx",
  "components/retention/WeeklyReviewBanner.tsx",
  "components/rituals/RitualConfirmOverlay.tsx",
  "components/CompanionDaysCard.tsx",
] as const;

describe("onScreenStaticColorsContract (G-26 · night sweep)", () => {
  describe.each(STYLE_FACTORY_DENY)("%s", (relPath) => {
    it("accepts ColorPalette and avoids bare COLORS in factory body", () => {
      const source = readRepoFile(relPath);
      expect(source).toMatch(/ColorPalette/);
      expect(source).toMatch(/colors:\s*ColorPalette/);
      expect(source).not.toMatch(/\bCOLORS\./);
      expect(source).not.toMatch(MODULE_TOP_CARD_CHROME);
    });
  });

  describe.each(SCREEN_DENY)("%s", (relPath) => {
    it("uses useThemeStyles and passes colors into style factory", () => {
      const source = readRepoFile(relPath);
      expect(source).toMatch(/useThemeStyles/);
      expect(source).not.toMatch(STATIC_COLORS_IMPORT);
      if (relPath.endsWith("RecycleBinEntryCard.tsx")) {
        expect(source).toMatch(/createRecycleBinEntryCardStyles\([^)]*colors/);
      }
      if (relPath.includes("recycleBin/RecycleBinScreen")) {
        expect(source).toMatch(/createRecycleBinStyles\([^)]*colors/);
      }
      if (relPath.includes("onThisDay/OnThisDayScreen")) {
        expect(source).toMatch(/createOnThisDayStyles\([^)]*colors/);
      }
      if (relPath.includes("PersonTimelineScreen")) {
        expect(source).toMatch(/createPersonTimelineStyles\([^)]*colors/);
      }
      if (relPath.includes("RevisitBanner")) {
        expect(source).toMatch(/createRevisitBannerStyles\([^)]*colors/);
      }
      if (relPath.includes("WeeklyReviewBanner")) {
        expect(source).toMatch(/createWeeklyReviewBannerStyles\([^)]*colors/);
      }
      if (relPath.includes("RitualConfirmOverlay")) {
        expect(source).toMatch(/createRitualConfirmOverlayStyles\([^)]*colors/);
      }
      if (relPath.includes("CompanionDaysCard")) {
        expect(source).toMatch(/createCompanionDaysCardStyles\([^)]*colors/);
      }
      if (relPath.includes("OnThisDayPersonSlot")) {
        expect(source).toMatch(/createOnThisDayPersonSlotStyles\([^)]*colors/);
      }
    });
  });

  it("stackScreenHeader uses ColorPalette param, not module COLORS", () => {
    const source = readRepoFile("styles/stackScreenHeader.ts");
    expect(source).toMatch(/colors:\s*ColorPalette/);
    expect(source).not.toMatch(/\bCOLORS\b/);
  });
});
