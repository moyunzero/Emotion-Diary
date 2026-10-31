import { buildRelationshipPotA11yLabel } from '@/components/Insights/relationshipPotA11y';

describe('buildRelationshipPotA11yLabel', () => {
  it('combines displayName and status label only (D-20 — no healed count)', () => {
    expect(buildRelationshipPotA11yLabel('Alex', 'Growing')).toBe(
      'Alex, Growing',
    );
  });
});
