import { test, expect } from "@playwright/test";

/** 与 services/onboardingMetaphor.ts ONBOARDING_METAPHOR_SEEN_KEY 一致 */
const ONBOARDING_SEEN_KEY = "onboarding_metaphor_v1_seen";

test.describe("首次理解路径（Expo Web smoke）", () => {
  test("fresh storage shows onboarding modal via testID", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("onboarding-modal-root")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("onboarding-skip-button")).toBeVisible();
  });

  test("seen flag suppresses auto-show", async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, "true");
    }, ONBOARDING_SEEN_KEY);
    await page.goto("/");
    await expect(page.getByTestId("dashboard-header")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("onboarding-modal-root")).not.toBeVisible();
  });
});
