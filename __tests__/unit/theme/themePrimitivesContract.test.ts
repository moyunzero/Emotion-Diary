/**
 * NIGHT-01 / G-26-1 B — AppChip, AppSegmentedControl, AppButton use hook palette.
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

/** Module-level StyleSheet.create that references COLORS (light-locked). */
const MODULE_LEVEL_COLORS_STYLES =
  /(?:^|\n)\s*const\s+styles\s*=\s*StyleSheet\.create\([\s\S]*?\bCOLORS\./;

describe("themePrimitivesContract (NIGHT-01 · G-26-1 B)", () => {
  describe("AppChip", () => {
    it("builds styles from useThemeStyles colors via useMemo", () => {
      const source = readRepoFile("components/ui/AppChip.tsx");
      expect(source).toMatch(/useThemeStyles/);
      expect(source).toMatch(/useMemo/);
      expect(source).toMatch(/StyleSheet\.create/);
      expect(source).not.toMatch(MODULE_LEVEL_COLORS_STYLES);
      expect(source).not.toMatch(
        /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*["']@\/constants\/colors["']/,
      );
    });
  });

  describe("AppSegmentedControl", () => {
    it("builds track/segment styles from hook colors via useMemo", () => {
      const source = readRepoFile("components/ui/AppSegmentedControl.tsx");
      expect(source).toMatch(/useThemeStyles/);
      expect(source).toMatch(/useMemo/);
      expect(source).toMatch(/StyleSheet\.create/);
      expect(source).not.toMatch(MODULE_LEVEL_COLORS_STYLES);
      expect(source).not.toMatch(
        /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*["']@\/constants\/colors["']/,
      );
    });
  });

  describe("AppButton", () => {
    it("variant faces and StyleSheet derive from hook colors via useMemo", () => {
      const source = readRepoFile("components/ui/AppButton.tsx");
      expect(source).toMatch(/useThemeStyles/);
      expect(source).toMatch(/useMemo/);
      expect(source).toMatch(/StyleSheet\.create/);
      expect(source).not.toMatch(/const\s+VARIANT_FACE[\s\S]*?\bCOLORS\./);
      expect(source).not.toMatch(MODULE_LEVEL_COLORS_STYLES);
      expect(source).not.toMatch(
        /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*["']@\/constants\/colors["']/,
      );
      expect(source).toMatch(/useReduceMotion/);
    });
  });
});
