/**
 * Wave 0 RED — EntryCard mood wash + burned soft shadow (PRIM-05 / D-23..D-26)
 * List badge must not paint mood.level* intensity face; burnedContainer no soft shadow.
 * Source-scan contracts against current tree (fails until Plan 09). No RN StyleSheet import.
 */

import fs from "fs";
import path from "path";
import { COLORS } from "@/constants/colors";

const entryCardSource = fs.readFileSync(
  path.join(__dirname, "../../../../components/EntryCard/EntryCard.tsx"),
  "utf8",
);
const recycleBinEntryCardSource = fs.readFileSync(
  path.join(
    __dirname,
    "../../../../components/entries/RecycleBinEntryCard.tsx",
  ),
  "utf8",
);
const entryCardStylesSource = fs.readFileSync(
  path.join(__dirname, "../../../../styles/components/EntryCard.styles.ts"),
  "utf8",
);

function burnedContainerBlock(source: string): string {
  const match = source.match(/burnedContainer:\s*\{([\s\S]*?)\n\s*\},/);
  expect(match).toBeTruthy();
  return match?.[1] ?? "";
}

describe("EntryCard mood wash + burned shadow (PRIM-05)", () => {
  it("list badge path must not paint mood intensity face from level ladder", () => {
    // PRIM-05 / D-24: list badge = icon + name; no mood.level* wash via getMoodColor.
    expect(entryCardSource).not.toMatch(
      /backgroundColor:\s*getMoodColor\(\)/,
    );
    expect(entryCardSource).not.toMatch(
      /backgroundColor:\s*COLORS\.mood\.level\d/,
    );
    expect(recycleBinEntryCardSource).not.toMatch(
      /backgroundColor:\s*getMoodBadgeColor\(/,
    );
    expect(recycleBinEntryCardSource).not.toMatch(
      /COLORS\.mood\.level\d/,
    );
  });

  it("burnedContainer must not carry soft shadow props", () => {
    const block = burnedContainerBlock(entryCardStylesSource);
    expect(block).not.toMatch(/shadowOpacity\s*:/);
    expect(block).not.toMatch(/shadowRadius\s*:/);
    expect(block).not.toMatch(/elevation\s*:/);
  });

  it("COLORS.mood.level* tokens remain available (D-26 keep)", () => {
    expect(COLORS.mood.level1).toBeTruthy();
    expect(COLORS.mood.level5).toBeTruthy();
  });
});
