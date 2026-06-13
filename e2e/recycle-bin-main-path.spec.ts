import { test, expect } from "@playwright/test";
import {
  E2E_ENTRY_CONTENT,
  createSoftDeletedEntry,
} from "./fixtures/entries";
import { GUEST_STORAGE_KEY } from "./helpers/storage";

const E2E_SEED_FLAG = "__e2e_guest_seeded__";

function seedGuestEntries(page: import("@playwright/test").Page, entries: unknown[]) {
  return page.addInitScript(
    ({ key, payload, flag }) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      localStorage.setItem(key, payload);
    },
    {
      key: GUEST_STORAGE_KEY,
      payload: JSON.stringify(entries),
      flag: E2E_SEED_FLAG,
    },
  );
}

test.describe("回收站主路径（Expo Web）", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("Profile → 回收站 → 可见软删条目", async ({ page }) => {
    await seedGuestEntries(page, [createSoftDeletedEntry()]);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible();
    await page.getByText("回收站", { exact: true }).click();
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toBeVisible();
  });

  test("回收站 → 恢复 → 主列表可见", async ({ page }) => {
    await seedGuestEntries(page, [createSoftDeletedEntry()]);
    await page.goto("/recycle-bin");
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toBeVisible();
    await page.getByRole("button", { name: "恢复这条记录" }).click();
    await page.waitForFunction(
      ({ key, id }) => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const entries = JSON.parse(raw) as { id: string; deletedAt?: number }[];
        const entry = entries.find((e) => e.id === id);
        return Boolean(entry && entry.deletedAt == null);
      },
      { key: GUEST_STORAGE_KEY, id: "e2e-recycle-entry-001" },
      { timeout: 10_000 },
    );

    await page.goto("/");
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toBeVisible();

    await page.goto("/recycle-bin");
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toHaveCount(0);
  });

  test("回收站 → 永久删除 → 条目消失", async ({ page }) => {
    await seedGuestEntries(page, [createSoftDeletedEntry()]);
    await page.goto("/recycle-bin");
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toBeVisible();
    await page.getByRole("button", { name: "永久删除这条记录" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText(E2E_ENTRY_CONTENT)).toHaveCount(0);
  });
});
