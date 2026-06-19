import { PEOPLE_KEYS, TRIGGER_KEYS } from "../constants";
import enRecord from "../locales/en-US/record.json";
import zhRecord from "../locales/zh-Hans/record.json";
import { i18n } from "./index";
import type { AppLocale } from "./mapDeviceLocale";

const PEOPLE_KEY_SET = new Set<string>(PEOPLE_KEYS);
const TRIGGER_KEY_SET = new Set<string>(TRIGGER_KEYS);

function buildLabelToKeyMap(
  presets: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, label] of Object.entries(presets)) {
    out[label] = key;
  }
  return out;
}

const LEGACY_PEOPLE_ZH = buildLabelToKeyMap(
  zhRecord.presets.people,
) as Record<string, (typeof PEOPLE_KEYS)[number]>;
const LEGACY_PEOPLE_EN = buildLabelToKeyMap(
  enRecord.presets.people,
) as Record<string, (typeof PEOPLE_KEYS)[number]>;
const LEGACY_TRIGGER_ZH = buildLabelToKeyMap(
  zhRecord.presets.triggers,
) as Record<string, (typeof TRIGGER_KEYS)[number]>;
const LEGACY_TRIGGER_EN = buildLabelToKeyMap(
  enRecord.presets.triggers,
) as Record<string, (typeof TRIGGER_KEYS)[number]>;

function resolvePresetKey(
  raw: string,
  keySet: Set<string>,
  legacyZh: Record<string, string>,
  legacyEn: Record<string, string>,
): string | null {
  if (keySet.has(raw)) {
    return raw;
  }
  return legacyZh[raw] ?? legacyEn[raw] ?? null;
}

export function resolvePeopleLabel(raw: string): string {
  const key = resolvePresetKey(
    raw,
    PEOPLE_KEY_SET,
    LEGACY_PEOPLE_ZH,
    LEGACY_PEOPLE_EN,
  );
  if (key) {
    return i18n.t(`presets.people.${key}` as "presets.people.boyfriend", {
      ns: "record",
    });
  }
  return raw;
}

export function resolveTriggerLabel(raw: string, locale?: AppLocale): string {
  const key = resolvePresetKey(
    raw,
    TRIGGER_KEY_SET,
    LEGACY_TRIGGER_ZH,
    LEGACY_TRIGGER_EN,
  );
  if (key) {
    const tk = `presets.triggers.${key}` as "presets.triggers.work";
    return locale
      ? i18n.getFixedT(locale, "record")(tk)
      : i18n.t(tk, { ns: "record" });
  }
  return raw;
}

function resolveTriggerKey(raw: string): (typeof TRIGGER_KEYS)[number] | null {
  return resolvePresetKey(
    raw,
    TRIGGER_KEY_SET,
    LEGACY_TRIGGER_ZH,
    LEGACY_TRIGGER_EN,
  ) as (typeof TRIGGER_KEYS)[number] | null;
}

export function resolveTriggerAdvice(raw: string, locale?: AppLocale): string {
  const key = resolveTriggerKey(raw);
  const adviceKey = (key ?? "other") as (typeof TRIGGER_KEYS)[number];
  const tk =
    `triggers.advice.${adviceKey}` as `triggers.advice.${(typeof TRIGGER_KEYS)[number]}`;
  return locale
    ? i18n.getFixedT(locale, "insights")(tk)
    : i18n.t(tk, { ns: "insights" });
}

/** Compact advice for cards and action-loop UI (INS-02 / adviceShort). */
export function resolveTriggerAdviceShort(raw: string): string {
  const key = resolveTriggerKey(raw);
  const adviceKey = (key ?? "other") as (typeof TRIGGER_KEYS)[number];
  return i18n.t(
    `triggers.adviceShort.${adviceKey}` as `triggers.adviceShort.${(typeof TRIGGER_KEYS)[number]}`,
    { ns: "insights" },
  );
}
