/**
 * Wave 0 RED — AI closing no resolution-rate inject (FLOW-06 / D-27)
 * Closing prompts/fallbacks must not inject resolutionRatePct / 和解占比
 * rate lines. Source-scan forecast + locale; GREEN in later review plan.
 */

import fs from 'fs';
import path from 'path';

const forecastSource = fs.readFileSync(
  path.join(__dirname, '../../../../utils/ai/forecast.ts'),
  'utf8',
);
const zhAiSource = fs.readFileSync(
  path.join(__dirname, '../../../../locales/zh-Hans/ai.json'),
  'utf8',
);
const enAiSource = fs.readFileSync(
  path.join(__dirname, '../../../../locales/en-US/ai.json'),
  'utf8',
);

describe('closingNoResolutionRate (FLOW-06 / D-27)', () => {
  it('forecast closing builders do not inject resolutionRatePct rate lines', () => {
    // Closing helpers only — keep podcast/prescription out of this contract
    const closingFallbackFn = forecastSource.slice(
      forecastSource.indexOf('export function getDefaultReviewExportClosingLine'),
    );
    const closingPromptRegion = forecastSource.slice(
      forecastSource.indexOf('export async function generateReviewExportClosingLine'),
    );
    const closingSlice = `${closingFallbackFn.slice(0, 900)}\n${closingPromptRegion.slice(0, 1400)}`;

    expect(closingSlice).not.toMatch(/resolutionRatePct/);
    expect(closingSlice).not.toMatch(/rateText|rateLine/);
    expect(closingSlice).not.toMatch(/fallbacks\.closing\.rate|prompts\.closing\.rate/);
  });

  it('closing locale strings do not carry 和解占比 / resolve-rate guilt KPI', () => {
    const zhClosing = JSON.parse(zhAiSource) as {
      prompts?: { closing?: Record<string, string> };
      fallbacks?: { closing?: Record<string, string> };
    };
    const enClosing = JSON.parse(enAiSource) as {
      prompts?: { closing?: Record<string, string> };
      fallbacks?: { closing?: Record<string, string> };
    };

    const zhPrompt = zhClosing.prompts?.closing ?? {};
    const zhFallback = zhClosing.fallbacks?.closing ?? {};
    const enPrompt = enClosing.prompts?.closing ?? {};
    const enFallback = enClosing.fallbacks?.closing ?? {};

    expect(zhPrompt.rateWithValue ?? zhPrompt.rateNoData).toBeUndefined();
    expect(zhFallback.rateWithValue ?? zhFallback.rateNoData).toBeUndefined();
    expect(enPrompt.rateWithValue ?? enPrompt.rateNoData).toBeUndefined();
    expect(enFallback.rateWithValue ?? enFallback.rateNoData).toBeUndefined();

    const zhBlob = JSON.stringify({ ...zhPrompt, ...zhFallback });
    const enBlob = JSON.stringify({ ...enPrompt, ...enFallback });
    expect(zhBlob).not.toMatch(/和解占比/);
    expect(enBlob).not.toMatch(/Share marked resolved|resolveRate|resolution rate/i);
    expect(zhBlob).not.toMatch(/\{\{rateLine\}\}|\{\{rateText\}\}/);
    expect(enBlob).not.toMatch(/\{\{rateLine\}\}|\{\{rateText\}\}/);
  });
});
