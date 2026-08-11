import { buildRelationshipPotA11yLabel } from '@/components/Insights/relationshipPotA11y';

describe('buildRelationshipPotA11yLabel', () => {
  it('combines displayName, status label, and healed count', () => {
    expect(
      buildRelationshipPotA11yLabel('Alex', 'Growing', '2/5 healed'),
    ).toBe('Alex, Growing, 2/5 healed');
  });
});
