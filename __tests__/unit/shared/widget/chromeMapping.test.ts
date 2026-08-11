/**
 * Wave 0 — PLT-01 Soft Stack chrome mapping (cleared vs status; privacy forbid)
 */

import {
  mapSnapshotToChrome,
  WIDGET_GROWTH_STAGE_TITLES,
  WIDGET_SNAPSHOT_FORBIDDEN_KEYS,
  WIDGET_WEATHER_ICON_KEYS,
  type WidgetSnapshot,
} from '@/shared/widget';

const ENTRY_COUNT_PROPERTY = 'entryCountActive';

function makeValidSnapshot(
  overrides: Partial<WidgetSnapshot> = {},
): WidgetSnapshot {
  return {
    schemaVersion: 1,
    updatedAt: 1_700_000_000_000,
    weatherBucket: 'cloudy',
    growthStage: 'seed',
    entryCountActive: 0,
    ...overrides,
  };
}

function assertNoForbidOrCountKeys(chrome: object): void {
  const keys = Object.keys(chrome);
  for (const forbidden of WIDGET_SNAPSHOT_FORBIDDEN_KEYS) {
    expect(keys).not.toContain(forbidden);
  }
  expect(keys).not.toContain(ENTRY_COUNT_PROPERTY);
  const json = JSON.stringify(chrome);
  expect(json).not.toMatch(/"entryCountActive"/);
  for (const forbidden of WIDGET_SNAPSHOT_FORBIDDEN_KEYS) {
    expect(json).not.toMatch(new RegExp(`"${forbidden}"`));
  }
}

describe('mapSnapshotToChrome', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['non-object string', 'not-json'],
    ['array', []],
    ['missing weatherBucket', { schemaVersion: 1, updatedAt: 1, growthStage: 'seed', entryCountActive: 0 }],
    ['invalid weatherBucket', makeValidSnapshot({ weatherBucket: 'foggy' as never })],
    ['invalid growthStage', makeValidSnapshot({ growthStage: 'tree' as never })],
    ['NaN updatedAt', makeValidSnapshot({ updatedAt: Number.NaN })],
    ['Infinity updatedAt', makeValidSnapshot({ updatedAt: Number.POSITIVE_INFINITY })],
    ['negative updatedAt', makeValidSnapshot({ updatedAt: -1 })],
    ['NaN entryCountActive', makeValidSnapshot({ entryCountActive: Number.NaN })],
    ['Infinity entryCountActive', makeValidSnapshot({ entryCountActive: Number.POSITIVE_INFINITY })],
    ['negative entryCountActive', makeValidSnapshot({ entryCountActive: -1 })],
    ['non-integer entryCountActive', makeValidSnapshot({ entryCountActive: 1.5 })],
  ])('returns cleared Soft Stack for %s (D-10/D-11)', (_label, input) => {
    const chrome = mapSnapshotToChrome(input);
    expect(chrome.mode).toBe('cleared');
    if (chrome.mode !== 'cleared') {
      throw new Error('expected cleared');
    }
    expect(chrome).not.toHaveProperty('weatherIconKey');
    expect(chrome).not.toHaveProperty('growthStageTitleZh');
    expect(chrome).not.toHaveProperty('growthStageTitleEn');
    expect(chrome.ctaZh).toBe('打开心晴');
    expect(chrome.ctaEn).toBe('Open Xinqing');
    assertNoForbidOrCountKeys(chrome);
  });

  it('maps empty-garden valid snapshot to quiet status Soft Stack (D-09)', () => {
    const chrome = mapSnapshotToChrome(
      makeValidSnapshot({
        weatherBucket: 'cloudy',
        growthStage: 'seed',
        entryCountActive: 0,
      }),
    );
    expect(chrome.mode).toBe('status');
    if (chrome.mode !== 'status') {
      throw new Error('expected status');
    }
    expect(chrome.isEmptyGarden).toBe(true);
    expect(chrome.weatherIconKey).toBe(WIDGET_WEATHER_ICON_KEYS.cloudy.sf);
    expect(chrome.weatherMaterialKey).toBe(
      WIDGET_WEATHER_ICON_KEYS.cloudy.material,
    );
    expect(chrome.growthStageTitleZh).toBe(WIDGET_GROWTH_STAGE_TITLES.seed.zh);
    expect(chrome.growthStageTitleEn).toBe(WIDGET_GROWTH_STAGE_TITLES.seed.en);
    expect(chrome.growthStageTitleZh).toBe('种子');
    expect(chrome.growthStageTitleEn).toBe('Seed');
    expect(chrome.brand).toBe('心晴');
    assertNoForbidOrCountKeys(chrome);
  });

  it('maps rainy + bloom to matching Soft Stack status chrome (D-01/D-02/D-03)', () => {
    const chrome = mapSnapshotToChrome(
      makeValidSnapshot({
        weatherBucket: 'rainy',
        growthStage: 'bloom',
        entryCountActive: 12,
      }),
    );
    expect(chrome.mode).toBe('status');
    if (chrome.mode !== 'status') {
      throw new Error('expected status');
    }
    expect(chrome.isEmptyGarden).toBe(false);
    expect(chrome.weatherIconKey).toBe(WIDGET_WEATHER_ICON_KEYS.rainy.sf);
    expect(chrome.weatherMaterialKey).toBe(
      WIDGET_WEATHER_ICON_KEYS.rainy.material,
    );
    expect(chrome.growthStageTitleZh).toBe('开花');
    expect(chrome.growthStageTitleEn).toBe('Bloom');
    expect(chrome.brand).toBe('心晴');
    assertNoForbidOrCountKeys(chrome);
  });

  it('never exposes forbid-list or active-entry count on status chrome (D-04/D-05)', () => {
    const chrome = mapSnapshotToChrome(
      makeValidSnapshot({ entryCountActive: 99 }),
    );
    assertNoForbidOrCountKeys(chrome);
    expect(chrome).not.toHaveProperty(ENTRY_COUNT_PROPERTY);
  });
});

describe('WIDGET_WEATHER_ICON_KEYS / WIDGET_GROWTH_STAGE_TITLES', () => {
  it('locks UI-SPEC SF Symbol + Material weather keys', () => {
    expect(WIDGET_WEATHER_ICON_KEYS.sunny).toEqual({
      sf: 'sun.max.fill',
      material: 'wb_sunny',
    });
    expect(WIDGET_WEATHER_ICON_KEYS.cloudy).toEqual({
      sf: 'cloud.fill',
      material: 'cloud',
    });
    expect(WIDGET_WEATHER_ICON_KEYS.rainy).toEqual({
      sf: 'cloud.rain.fill',
      material: 'umbrella',
    });
    expect(WIDGET_WEATHER_ICON_KEYS.stormy).toEqual({
      sf: 'cloud.bolt.fill',
      material: 'thunderstorm',
    });
  });

  it('locks Insights growth stage bilingual titles', () => {
    expect(WIDGET_GROWTH_STAGE_TITLES).toEqual({
      seed: { zh: '种子', en: 'Seed' },
      sprout: { zh: '发芽', en: 'Sprout' },
      seedling: { zh: '幼苗', en: 'Seedling' },
      bud: { zh: '花苞', en: 'Bud' },
      bloom: { zh: '开花', en: 'Bloom' },
    });
  });
});
