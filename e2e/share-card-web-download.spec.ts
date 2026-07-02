import { test, expect } from "@playwright/test";
import { Deadline, MoodLevel, Status, type MoodEntry } from "../types";
import { GUEST_STORAGE_KEY } from "./helpers/storage";

/** 与 services/onboardingMetaphor.ts ONBOARDING_METAPHOR_SEEN_KEY 一致 */
const ONBOARDING_SEEN_KEY = "onboarding_metaphor_v1_seen";
/** 与 shared/share/privacyAck.ts REVIEW_EXPORT_PRIVACY_ACK_KEY 一致 */
const PRIVACY_ACK_KEY = "review_export_privacy_ack_v1";

/** Headless Playwright 无法稳定驱动 RN Web captureRef → anchor 下载；本地 `E2E_SHARE_WEB_DOWNLOAD=1 yarn web` 可开全量断言 */
const WEB_DOWNLOAD_E2E_ENABLED = process.env.E2E_SHARE_WEB_DOWNLOAD === "1";

function createWeekReviewEntry(): MoodEntry {
  const now = Date.now();
  return {
    id: "e2e-share-week-entry",
    timestamp: now - 3_600_000,
    moodLevel: MoodLevel.ANNOYED,
    content: "E2E 周回顾分享卡",
    deadline: Deadline.THIS_WEEK,
    people: [],
    triggers: [],
    status: Status.ACTIVE,
  };
}

function seedReviewExportWebState(page: import("@playwright/test").Page) {
  const entry = createWeekReviewEntry();
  return page.addInitScript(
    ({ guestKey, entriesPayload, onboardingKey, privacyKey }) => {
      localStorage.setItem(guestKey, entriesPayload);
      localStorage.setItem(onboardingKey, "true");
      localStorage.setItem(privacyKey, "true");
    },
    {
      guestKey: GUEST_STORAGE_KEY,
      entriesPayload: JSON.stringify([entry]),
      onboardingKey: ONBOARDING_SEEN_KEY,
      privacyKey: PRIVACY_ACK_KEY,
    },
  );
}

test.describe("周回顾分享卡 Web 下载（SHR-04）", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("review-export shows share card canvas and download CTA", async ({
    page,
  }) => {
    await seedReviewExportWebState(page);
    await page.goto("/review-export");

    await expect(page.getByTestId("share-card-canvas")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("share-card-save-button")).toBeVisible();
    await expect(page.getByTestId("share-card-snippet-toggle")).toBeVisible();
    await expect(page.getByTestId("share-card-snippet-input")).not.toBeVisible();
  });

  test("review-export save triggers xinqingmo-share PNG download", async ({
    page,
  }) => {
    test.skip(
      !WEB_DOWNLOAD_E2E_ENABLED,
      "Expo Web captureRef anchor download unreliable in Playwright headless — set E2E_SHARE_WEB_DOWNLOAD=1 with headed yarn web for full PNG gate",
    );

    await seedReviewExportWebState(page);
    await page.goto("/review-export");

    await expect(page.getByTestId("share-card-canvas")).toBeVisible({
      timeout: 30_000,
    });
    const saveButton = page.getByTestId("share-card-save-button");
    await expect(saveButton).toBeEnabled({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await saveButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^xinqingmo-share-.*\.png$/);
  });
});
