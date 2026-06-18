import { PEOPLE_KEYS, TRIGGER_KEYS } from "../constants";
import { i18n } from "./index";

const PEOPLE_KEY_SET = new Set<string>(PEOPLE_KEYS);
const TRIGGER_KEY_SET = new Set<string>(TRIGGER_KEYS);

const LEGACY_PEOPLE_ZH: Record<string, (typeof PEOPLE_KEYS)[number]> = {
  男朋友: "boyfriend",
  女朋友: "girlfriend",
  老公: "husband",
  老婆: "wife",
  朋友: "friend",
  其他: "other",
};

const LEGACY_TRIGGER_ZH: Record<string, (typeof TRIGGER_KEYS)[number]> = {
  工作: "work",
  学习: "study",
  家庭: "family",
  朋友: "friends",
  沟通: "communication",
  信任: "trust",
  隐私: "privacy",
  其他: "other",
};

function resolvePresetKey(
  raw: string,
  keySet: Set<string>,
  legacyMap: Record<string, string>,
): string | null {
  if (keySet.has(raw)) {
    return raw;
  }
  return legacyMap[raw] ?? null;
}

export function resolvePeopleLabel(raw: string): string {
  const key = resolvePresetKey(raw, PEOPLE_KEY_SET, LEGACY_PEOPLE_ZH);
  if (key) {
    return i18n.t(`presets.people.${key}` as "presets.people.boyfriend", {
      ns: "record",
    });
  }
  return raw;
}

export function resolveTriggerLabel(raw: string): string {
  const key = resolvePresetKey(raw, TRIGGER_KEY_SET, LEGACY_TRIGGER_ZH);
  if (key) {
    return i18n.t(`presets.triggers.${key}` as "presets.triggers.work", {
      ns: "record",
    });
  }
  return raw;
}

export function resolveTriggerAdvice(raw: string): string {
  const key = resolvePresetKey(raw, TRIGGER_KEY_SET, LEGACY_TRIGGER_ZH);
  const adviceKey = (key ?? "other") as (typeof TRIGGER_KEYS)[number];
  return i18n.t(
    `triggers.advice.${adviceKey}` as `triggers.advice.${(typeof TRIGGER_KEYS)[number]}`,
    { ns: "insights" },
  );
}
