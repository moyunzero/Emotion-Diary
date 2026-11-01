/**
 * NIGHT-01 / G-26-1 A — settings grouped card uses active palette (D-05).
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

describe("settingsThemeContract (NIGHT-01 · G-26-1 A · D-05)", () => {
  it("createSettingsStyles accepts ColorPalette and groupedCard uses colors.background.primary", () => {
    const source = readRepoFile("components/settings/settings.styles.ts");
    expect(source).toMatch(/ColorPalette/);
    expect(source).toMatch(
      /export function createSettingsStyles\([^)]*colors:\s*ColorPalette/,
    );
    expect(source).toMatch(/backgroundColor:\s*colors\.background\.primary/);
    expect(source).not.toMatch(/\bCOLORS\./);
  });

  it("GroupedSettingsCard passes useThemeStyles colors into createSettingsStyles", () => {
    const source = readRepoFile("components/settings/GroupedSettingsCard.tsx");
    expect(source).toMatch(/useThemeStyles/);
    expect(source).toMatch(/createSettingsStyles\([^)]*colors/);
  });

  it("ScreenFootnote passes hook colors into createSettingsStyles", () => {
    const source = readRepoFile("components/settings/ScreenFootnote.tsx");
    expect(source).toMatch(/useThemeStyles/);
    expect(source).toMatch(/createSettingsStyles\([^)]*colors/);
  });

  it("ProfileDataSecuritySection passes colors into createSettingsStyles", () => {
    const source = readRepoFile(
      "features/profile/components/ProfileDataSecuritySection.tsx",
    );
    expect(source).toMatch(/createSettingsStyles\([^)]*colors/);
  });
});
