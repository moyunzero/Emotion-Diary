/**
 * Wave 0 — buildOnThisDaySections (REL-05 / D-02)
 * Presentation flatten only; does not re-filter soft-delete / MM-DD.
 * Fixtures use local Date(y, mIndex, d, …) — do not mutate process.env.TZ
 */

import { buildOnThisDaySections } from '../../../../shared/entries/onThisDaySections';
import type { MoodEntry } from '../../../../types';
import { Status } from '../../../../types';

const base = (overrides: Partial<MoodEntry> = {}): MoodEntry => ({
  id: 'e1',
  timestamp: 1,
  moodLevel: 2,
  content: '',
  deadline: 'later',
  people: [],
  triggers: [],
  status: Status.ACTIVE,
  ...overrides,
});

describe('buildOnThisDaySections', () => {
  it('returns empty array for empty input', () => {
    expect(buildOnThisDaySections([])).toEqual([]);
  });

  it('emits one year header then entries in same newest-first order for a single year', () => {
    const newer = base({
      id: 'a',
      timestamp: new Date(2024, 7, 10, 14, 0, 0, 0).getTime(),
    });
    const older = base({
      id: 'b',
      timestamp: new Date(2024, 7, 10, 9, 0, 0, 0).getTime(),
    });
    const rows = [newer, older];

    expect(buildOnThisDaySections(rows)).toEqual([
      { type: 'year', year: 2024 },
      { type: 'entry', entry: newer },
      { type: 'entry', entry: older },
    ]);
  });

  it('emits a year header when local calendar year changes; preserves entry order', () => {
    const y2024 = base({
      id: 'y2024',
      timestamp: new Date(2024, 7, 10, 12, 0, 0, 0).getTime(),
    });
    const y2023a = base({
      id: 'y2023a',
      timestamp: new Date(2023, 7, 10, 15, 0, 0, 0).getTime(),
    });
    const y2023b = base({
      id: 'y2023b',
      timestamp: new Date(2023, 7, 10, 8, 0, 0, 0).getTime(),
    });
    const y2022 = base({
      id: 'y2022',
      timestamp: new Date(2022, 7, 10, 10, 0, 0, 0).getTime(),
    });
    const rows = [y2024, y2023a, y2023b, y2022];

    expect(buildOnThisDaySections(rows)).toEqual([
      { type: 'year', year: 2024 },
      { type: 'entry', entry: y2024 },
      { type: 'year', year: 2023 },
      { type: 'entry', entry: y2023a },
      { type: 'entry', entry: y2023b },
      { type: 'year', year: 2022 },
      { type: 'entry', entry: y2022 },
    ]);
  });

  it('does not drop or add entries relative to input length (presentation only)', () => {
    const rows = [
      base({ id: '1', timestamp: new Date(2024, 0, 1, 12, 0, 0, 0).getTime() }),
      base({ id: '2', timestamp: new Date(2023, 0, 1, 12, 0, 0, 0).getTime() }),
      base({ id: '3', timestamp: new Date(2023, 5, 1, 12, 0, 0, 0).getTime() }),
    ];
    const items = buildOnThisDaySections(rows);
    const entryItems = items.filter((i) => i.type === 'entry');
    expect(entryItems).toHaveLength(rows.length);
    expect(entryItems.map((i) => (i.type === 'entry' ? i.entry.id : ''))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });
});
