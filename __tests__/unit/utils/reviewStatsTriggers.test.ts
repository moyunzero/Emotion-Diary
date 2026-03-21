import { Deadline, MoodLevel, Status } from '../../../types';
import {
  aggregateTriggerCounts,
  getTopTriggersWithAdvice,
} from '../../../utils/reviewStatsTriggers';

const entry = (
  id: string,
  ts: number,
  triggers: string[],
): import('../../../types').MoodEntry => ({
  id,
  timestamp: ts,
  moodLevel: MoodLevel.ANNOYED,
  content: '',
  deadline: Deadline.TODAY,
  people: [],
  triggers,
  status: Status.ACTIVE,
});

describe('reviewStatsTriggers', () => {
  const start = new Date(2025, 0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(2025, 11, 31, 23, 59, 59, 999).getTime();

  it('aggregates trigger counts like TriggerInsight', () => {
    const entries = [
      entry('a', start + 1, ['工作', '学习']),
      entry('b', start + 2, ['工作']),
    ];
    const counts = aggregateTriggerCounts(entries, start, end);
    const work = counts.find((c) => c.name === '工作');
    expect(work?.count).toBe(2);
  });

  it('attaches advice from TRIGGER_ADVICE with 其他 fallback', () => {
    const entries = [entry('a', start + 1, ['仅出现在此测试的标签名'] )];
    const top = getTopTriggersWithAdvice(entries, start, end, 3);
    expect(top[0].advice).toBeTruthy();
    expect(top[0].advice).toContain('情绪');
  });
});
