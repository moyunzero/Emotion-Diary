/**
 * Wave 0 RED — post-save ritual contract (FLOW-03 / D-13..D-17)
 * Overlay ≠ RitualConfirmOverlay confirm/cancel chrome; fixed kept-safe
 * copy keys; tap-any / auto ≤1s. Source-scan; GREEN when PostSaveRitualOverlay lands.
 */

import fs from 'fs';
import path from 'path';

const ritualsDir = path.join(__dirname, '../../../../components/rituals');
const postSavePath = path.join(ritualsDir, 'PostSaveRitualOverlay.tsx');
const ritualConfirmSource = fs.readFileSync(
  path.join(ritualsDir, 'RitualConfirmOverlay.tsx'),
  'utf8',
);

describe('postSaveRitualContract (FLOW-03 / D-13..D-17)', () => {
  it('ships PostSaveRitualOverlay distinct from RitualConfirmOverlay', () => {
    expect(fs.existsSync(postSavePath)).toBe(true);
    const source = fs.readFileSync(postSavePath, 'utf8');

    expect(source).toMatch(/export default function PostSaveRitualOverlay|export function PostSaveRitualOverlay/);
    // Must not reuse resolve/burn confirm/cancel chrome
    expect(source).not.toMatch(/RitualConfirmOverlay/);
    expect(source).not.toMatch(/testID=\{`\$\{testIdPrefix\}-confirm`\}/);
    expect(source).not.toMatch(/keyPrefix:\s*['"]resolve\.confirm['"]/);
    expect(source).not.toMatch(/variant:\s*['"](?:resolve|burn)['"]/);
    expect(source).not.toMatch(/confirmButton|cancelButton/);
    // Anti-analog: RitualConfirmOverlay keeps confirm/cancel — post-save must not copy that API
    expect(ritualConfirmSource).toMatch(/confirmButton/);
    expect(ritualConfirmSource).toMatch(/cancelButton/);
  });

  it('uses fixed kept-safe copy keys (no weather pool / skip button)', () => {
    expect(fs.existsSync(postSavePath)).toBe(true);
    const source = fs.readFileSync(postSavePath, 'utf8');
    const hasFixedCopy =
      /postSave\.keptSafe|rituals\.postSave\.keptSafe|这一刻收好了|This moment is kept safe/.test(
        source,
      );
    expect(hasFixedCopy).toBe(true);
    expect(source).not.toMatch(/generateForecast|weatherStation|cardPool|drawCard/);
    expect(source).not.toMatch(/跳过|skipButton|onSkip/);
  });

  it('encodes tap-anywhere dismiss and auto-dismiss ≤1s', () => {
    expect(fs.existsSync(postSavePath)).toBe(true);
    const source = fs.readFileSync(postSavePath, 'utf8');
    expect(source).toMatch(/onPress|Pressable|TouchableWithoutFeedback/);
    const hasAutoDismiss =
      /900|1000|AUTO_DISMISS|autoDismissMs|autoDismiss/.test(source) &&
      !/autoDismissMs\s*[:=]\s*(?:[2-9]\d{3,}|\d{5,})/.test(source);
    expect(hasAutoDismiss).toBe(true);
  });
});
