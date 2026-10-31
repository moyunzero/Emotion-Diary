/**
 * G-26-2 D — EntryCard meta/action contrast + tab inactive on night wash (D-05, D-09, D-18).
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

describe("metaContrastContract (G-26-2 D · D-18)", () => {
  it("EntryCardActions tints lucide icons via useThemeStyles, not module COLORS", () => {
    const source = readRepoFile("components/EntryCard/EntryCardActions.tsx");
    expect(source).toMatch(/useThemeStyles/);
    expect(source).not.toMatch(/from\s+["']@\/constants\/colors["']/);
    expect(source).not.toMatch(/color=\{COLORS\./);
    expect(source).toMatch(/colors\.primaryDark/);
    expect(source).toMatch(/colors\.mood\.icon\.level4/);
    expect(source).toMatch(/colors\.mood\.icon\.level5/);
    expect(source).toMatch(/colors\.text\.secondary/);
  });

  it("EntryCard list timestamp meta uses text.secondary for card readability", () => {
    const source = readRepoFile("styles/components/EntryCard.styles.ts");
    expect(source).toMatch(/dateText:\s*\{[^}]*color:\s*colors\.text\.secondary/s);
  });
});
