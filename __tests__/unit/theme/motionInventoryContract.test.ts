/**
 * NIGHT-03 Wave 0 — decorative motion + theme transition RM gates (RED until Plan 05).
 * D-12, D-14: listed sites must reference reduceMotion / isReduceMotionEnabled.
 */

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "../../..");

type MotionSite = {
  label: string;
  file: string;
  mustGate?: RegExp;
};

const MOTION_SITES: MotionSite[] = [
  {
    label: "EntryCard weather breath",
    file: "components/EntryCard/EntryCard.tsx",
    mustGate: /reduceMotion|isReduceMotionEnabled/,
  },
  {
    label: "MoodForm LayoutAnimation",
    file: "components/MoodForm.tsx",
    mustGate: /if\s*\(\s*!reduceMotion\s*\)/,
  },
  {
    label: "PostSaveRitualOverlay",
    file: "components/rituals/PostSaveRitualOverlay.tsx",
    mustGate: /reduceMotion|isReduceMotionEnabled/,
  },
  {
    label: "AppButton press scale",
    file: "components/ui/AppButton.tsx",
    mustGate: /reduceMotion|isReduceMotionEnabled/,
  },
];

function readRepoFile(relPath: string): string {
  const abs = path.join(root, relPath);
  expect(fs.existsSync(abs)).toBe(true);
  return fs.readFileSync(abs, "utf8");
}

describe("motionInventoryContract (NIGHT-03 · D-12 D-14)", () => {
  it.each(MOTION_SITES)("$label references Reduce Motion gating", ({ file, mustGate }) => {
    const source = readRepoFile(file);
    expect(source).toMatch(mustGate ?? /reduceMotion|isReduceMotionEnabled/);
  });

  it("root theme transition crossfade respects Reduce Motion (Plan 03/05)", () => {
    const rootLayout = readRepoFile("app/_layout.tsx");
    expect(rootLayout).toMatch(
      /themeTransition|appearanceCrossfade|THEME_CROSSFADE_MS/,
    );
    expect(rootLayout).toMatch(/reduceMotion|isReduceMotionEnabled/);
  });
});
