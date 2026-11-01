/**
 * NIGHT-02 / G-26-1 C — on-screen Insights use getInsightsColors(active palette).
 * D-06 allowlist: share/export capture keeps light INSIGHTS_COLORS alias.
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

const INSIGHTS_COLORS_IMPORT =
  /import\s*\{[^}]*\bINSIGHTS_COLORS\b[^}]*\}\s*from/;

/** D-06 — export/capture paths stay on light alias */
const D06_ALLOWLIST = [
  "components/share/ShareCardWeekContent.tsx",
  "components/share/ShareCardShell.tsx",
  "components/ReviewExport/ReviewExportScreen.tsx",
  "components/Insights/constants.ts",
] as const;

/** G-26-1 C — on-screen Insights / deferred / person timeline */
const ON_SCREEN_DENY = [
  "components/Insights/RelationshipGarden.tsx",
  "components/Insights/GardenHeader.tsx",
  "components/Insights/GardenFooter.tsx",
  "components/Insights/EmptyGarden.tsx",
  "components/Insights/HealingProgress.tsx",
  "components/Insights/EmotionReleaseArchive.tsx",
  "components/Insights/TriggerInsight.tsx",
  "components/Insights/PrescriptionCard.tsx",
  "components/Insights/InsightsDeferredSections.tsx",
  "components/Insights/EmotionForecastSection.tsx",
  "components/Insights/CareCountLine.tsx",
  "components/onThisDay/OnThisDayInsightsCard.tsx",
  "features/personTimeline/PersonTimelineScreen.tsx",
  "components/ai/EmotionPodcast.tsx",
] as const;

function basename(rel: string): string {
  return path.basename(rel, path.extname(rel));
}

describe("insightsOnScreenThemeContract (NIGHT-02 · G-26-1 C · D-05 D-06)", () => {
  describe("D-06 allowlist retains INSIGHTS_COLORS", () => {
    it.each(D06_ALLOWLIST)("%s may import INSIGHTS_COLORS", (relPath) => {
      const source = readRepoFile(relPath);
      expect(source).toMatch(/\bINSIGHTS_COLORS\b/);
    });
  });

  describe.each(ON_SCREEN_DENY)("%s", (relPath) => {
    const name = basename(relPath);

    it(`${name} uses useThemeStyles, not INSIGHTS_COLORS`, () => {
      const source = readRepoFile(relPath);
      expect(source).toMatch(/useThemeStyles/);
      expect(source).not.toMatch(INSIGHTS_COLORS_IMPORT);
      // Insights palette helpers optional for CareCountLine / EmotionPodcast / Forecast
      if (
        !relPath.includes("CareCountLine") &&
        !relPath.includes("EmotionPodcast") &&
        !relPath.includes("EmotionForecastSection")
      ) {
        expect(source).toMatch(/getInsightsColors/);
      }
      // Nested light leak: no static COLORS import for StyleSheet chrome
      if (
        relPath.includes("EmotionPodcast") ||
        relPath.includes("EmotionForecastSection") ||
        relPath.includes("CareCountLine")
      ) {
        expect(source).not.toMatch(
          /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*['"]@?\/?.*constants\/colors/,
        );
      }
    });
  });

  it("constants.ts exports light alias via getInsightsColors(COLORS_LIGHT)", () => {
    const source = readRepoFile("components/Insights/constants.ts");
    expect(source).toMatch(
      /export const INSIGHTS_COLORS[^=]*=\s*getInsightsColors\(COLORS_LIGHT\)/,
    );
  });
});
