/**
 * NIGHT-01 Wave 0 — root shell theme contract (RED until Plans 03–05).
 * StatusBar + Tab bar must follow resolved light/night scheme (D-08, D-09).
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");
const rootLayoutPath = path.join(root, "app/_layout.tsx");
const tabsLayoutPath = path.join(root, "app/(tabs)/_layout.tsx");

describe("shellThemeContract (NIGHT-01 · D-08 D-09)", () => {
  it("root StatusBar derives barStyle from effective color scheme", () => {
    const source = fs.readFileSync(rootLayoutPath, "utf8");
    expect(source).toMatch(/useThemeStyles|effectiveColorScheme|resolvedScheme/);
    expect(source).not.toMatch(
      /const\s+statusBarStyle\s*=\s*['"]dark-content['"]\s*;/,
    );
    expect(source).toMatch(/light-content|dark-content/);
    expect(source).toMatch(/barStyle=\{[^}]+\}/);
  });

  it("tabs layout uses night tab wash rgba(39, 28, 34, 0.82) when themed", () => {
    const source = fs.readFileSync(tabsLayoutPath, "utf8");
    expect(source).toMatch(/useThemeStyles|getColors|COLORS_NIGHT|effectiveColorScheme/);
    expect(source).toMatch(/rgba\s*\(\s*39\s*,\s*28\s*,\s*34\s*,\s*0\.82\s*\)/);
    expect(source).toMatch(/tabBarBackground|TabBarBackground/);
    expect(source).toMatch(/borderTopColor|hairline/);
  });
});
