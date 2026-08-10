/**
 * Wave 0 RED — shared/garden/growthStage
 * SC-4 thresholds: seed / sprout(0.2) / seedling(0.4) / bud(0.6) / bloom(0.8)
 */

import { growthStageFromRate } from '../../../../shared/garden/growthStage';

describe('growthStageFromRate', () => {
  it('null / undefined / 0 → seed', () => {
    expect(growthStageFromRate(null)).toBe('seed');
    expect(growthStageFromRate(undefined)).toBe('seed');
    expect(growthStageFromRate(0)).toBe('seed');
  });

  it('boundaries: ≥0.2 sprout, ≥0.4 seedling, ≥0.6 bud, ≥0.8 bloom', () => {
    expect(growthStageFromRate(0.2)).toBe('sprout');
    expect(growthStageFromRate(0.4)).toBe('seedling');
    expect(growthStageFromRate(0.6)).toBe('bud');
    expect(growthStageFromRate(0.8)).toBe('bloom');
    expect(growthStageFromRate(1)).toBe('bloom');
  });

  it('just-below each threshold maps to previous stage', () => {
    expect(growthStageFromRate(0.199)).toBe('seed');
    expect(growthStageFromRate(0.399)).toBe('sprout');
    expect(growthStageFromRate(0.599)).toBe('seedling');
    expect(growthStageFromRate(0.799)).toBe('bud');
  });
});
