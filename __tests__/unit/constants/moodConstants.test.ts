import fs from "fs";
import path from "path";

describe("mood constants (no hardcoded Chinese labels)", () => {
  const constantsPath = path.join(process.cwd(), "constants.ts");
  const source = fs.readFileSync(constantsPath, "utf8");

  it("exports PEOPLE_KEYS and TRIGGER_KEYS", () => {
    expect(source).toMatch(/export const PEOPLE_KEYS/);
    expect(source).toMatch(/export const TRIGGER_KEYS/);
    expect(source).not.toMatch(/export const PEOPLE_OPTIONS/);
    expect(source).not.toMatch(/export const TRIGGER_OPTIONS/);
    expect(source).not.toMatch(/MOOD_DESCRIPTIONS/);
  });

  it("mood and deadline config blocks contain no CJK characters", () => {
    const moodStart = source.indexOf("export const MOOD_CONFIG");
    const triggerKeysEnd = source.indexOf("] as const;", source.indexOf("export const TRIGGER_KEYS"));
    expect(moodStart).toBeGreaterThanOrEqual(0);
    expect(triggerKeysEnd).toBeGreaterThan(moodStart);
    const block = source.slice(moodStart, triggerKeysEnd + "] as const;".length);
    expect(block).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
