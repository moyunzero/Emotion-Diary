import enMood from "../locales/en-US/mood.json";
import zhMood from "../locales/zh-Hans/mood.json";
import { i18n } from "./index";
import { Deadline, MoodLevel } from "../types";

const DEADLINE_KEY_BY_VALUE: Record<string, string> = {
  [Deadline.TODAY]: "today",
  [Deadline.THIS_WEEK]: "week",
  [Deadline.THIS_MONTH]: "month",
  [Deadline.LATER]: "later",
  [Deadline.SELF_DIGEST]: "self",
};

const DEADLINE_KEYS = new Set(Object.values(DEADLINE_KEY_BY_VALUE));

function buildDeadlineLabelToKey(
  deadlines: Record<string, { label: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, { label }] of Object.entries(deadlines)) {
    out[label] = key;
  }
  return out;
}

const LEGACY_DEADLINE_ZH = buildDeadlineLabelToKey(zhMood.deadline);
const LEGACY_DEADLINE_EN = buildDeadlineLabelToKey(enMood.deadline);

function resolveDeadlineKey(deadline: string): string | null {
  const direct = DEADLINE_KEY_BY_VALUE[deadline];
  if (direct) {
    return direct;
  }
  if (DEADLINE_KEYS.has(deadline)) {
    return deadline;
  }
  return (
    LEGACY_DEADLINE_ZH[deadline] ??
    LEGACY_DEADLINE_EN[deadline] ??
    null
  );
}

export function getMoodLabel(level: MoodLevel): string {
  return i18n.t(`level.${level}.label`, { ns: "mood" });
}

export function getMoodDescription(level: MoodLevel): string {
  return i18n.t(`level.${level}.description`, { ns: "mood" });
}

export function getDeadlineLabel(deadline: Deadline | string): string {
  const key = resolveDeadlineKey(deadline);
  if (key) {
    return i18n.t(`deadline.${key}.label` as "deadline.today.label", {
      ns: "mood",
    });
  }
  return deadline;
}
