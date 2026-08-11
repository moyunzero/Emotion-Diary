/**
 * Burned EntryCard exposes deleteAsh accessibility action + expanded state.
 */

import fs from 'fs';
import path from 'path';

describe('EntryCard burned ash a11y', () => {
  it('wires deleteAsh accessibility action and expanded state on burned card', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../../components/EntryCard/EntryCard.tsx'),
      'utf8',
    );
    expect(source).toContain('entryCard.deleteAshAction');
    expect(source).toContain('accessibilityActions');
    expect(source).toContain('onAccessibilityAction');
    expect(source).toContain('actionName === "deleteAsh"');
    expect(source).toContain('accessibilityState={{ expanded: isExpanded }}');
    expect(source).toContain('accessibilityRole="button"');
  });

  it('locales define deleteAshAction in zh-Hans and en-US', () => {
    const zh = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../../../locales/zh-Hans/dashboard.json'),
        'utf8',
      ),
    );
    const en = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../../../locales/en-US/dashboard.json'),
        'utf8',
      ),
    );
    expect(zh.entryCard.deleteAshAction).toBeTruthy();
    expect(en.entryCard.deleteAshAction).toBeTruthy();
  });
});
