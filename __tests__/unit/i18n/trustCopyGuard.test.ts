/**
 * TRUST-04 / TRUST-05 — ban guilt/scoring default copy in product locales
 */

import zhDashboard from "@/locales/zh-Hans/dashboard.json";
import enDashboard from "@/locales/en-US/dashboard.json";
import zhInsights from "@/locales/zh-Hans/insights.json";
import enInsights from "@/locales/en-US/insights.json";
import zhAi from "@/locales/zh-Hans/ai.json";
import enAi from "@/locales/en-US/ai.json";
import zhReview from "@/locales/zh-Hans/review.json";
import enReview from "@/locales/en-US/review.json";
import zhRetention from "@/locales/zh-Hans/retention.json";
import enRetention from "@/locales/en-US/retention.json";

const ZH_BANNED = [
  "解决率",
  "该浇水啦",
  "需要浇水",
  "需浇水",
  "高风险",
  "中风险",
  "低风险",
  "提前做好准备",
  "回来浇浇水",
] as const;

const EN_BANNED = [
  "resolution rate",
  "resolution trend",
  "needs water",
  "needs watering",
  "needs a little water",
  "high risk",
  "high-risk",
  "medium risk",
  "low risk",
  "plan ahead",
  "give it a little water",
  "water your inner garden",
] as const;

function collectLeafStrings(
  obj: Record<string, unknown>,
  prefix = "",
): Array<[string, string]> {
  const leaves: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      leaves.push(
        ...collectLeafStrings(value as Record<string, unknown>, path),
      );
    } else if (typeof value === "string") {
      leaves.push([path, value]);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "string") {
          leaves.push([`${path}[${index}]`, item]);
        } else if (item !== null && typeof item === "object") {
          leaves.push(
            ...collectLeafStrings(
              item as Record<string, unknown>,
              `${path}[${index}]`,
            ),
          );
        }
      });
    }
  }
  return leaves;
}

function findBannedHits(
  namespace: string,
  tree: Record<string, unknown>,
  banned: readonly string[],
  caseInsensitive: boolean,
): string[] {
  const hits: string[] = [];
  for (const [keyPath, value] of collectLeafStrings(tree)) {
    const haystack = caseInsensitive ? value.toLowerCase() : value;
    for (const phrase of banned) {
      const needle = caseInsensitive ? phrase.toLowerCase() : phrase;
      if (haystack.includes(needle)) {
        hits.push(`${namespace}.${keyPath}`);
        break;
      }
    }
  }
  return hits;
}

const NAMESPACES: Array<{
  name: string;
  zh: Record<string, unknown>;
  en: Record<string, unknown>;
}> = [
  { name: "dashboard", zh: zhDashboard, en: enDashboard },
  { name: "insights", zh: zhInsights, en: enInsights },
  { name: "ai", zh: zhAi, en: enAi },
  { name: "review", zh: zhReview, en: enReview },
  { name: "retention", zh: zhRetention, en: enRetention },
];

describe("trustCopyGuard — banned guilt/scoring phrases", () => {
  it("zh-Hans dashboard/insights/ai/review/retention have no banned substrings", () => {
    const hits = NAMESPACES.flatMap(({ name, zh }) =>
      findBannedHits(name, zh, ZH_BANNED, false),
    );
    expect(hits).toEqual([]);
  });

  it("en-US dashboard/insights/ai/review/retention have no banned substrings", () => {
    const hits = NAMESPACES.flatMap(({ name, en }) =>
      findBannedHits(name, en, EN_BANNED, true),
    );
    expect(hits).toEqual([]);
  });
});
