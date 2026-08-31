import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

import { gotoApp } from "./auth";

test.describe("instant navigation shells", () => {
  test("login heading is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/auth/login");
        await expect(page.getByRole("heading", { name: /NFL Confidence Pool/ })).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );
  });

  test("support rules heading is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/support");
        await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );
  });

  test("support to login is instant for a logged-out visitor", async ({ page }) => {
    await gotoApp(page, "/support");
    await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();

    const loginLink = page.getByRole("link", { name: /back to login/i });

    await expect(loginLink).toBeVisible();

    await instant(page, async () => {
      await loginLink.click();
      await expect(page.getByRole("heading", { name: /NFL Confidence Pool/ })).toBeVisible();
    });

    await page.waitForURL((url) => url.pathname === "/auth/login", { timeout: 20_000, waitUntil: "commit" });
  });

  test("login register toggle is instant", async ({ page }) => {
    await gotoApp(page, "/auth/login");
    await expect(page.getByRole("heading", { name: /NFL Confidence Pool/ })).toBeVisible();

    await instant(page, async () => {
      await page.getByRole("link", { name: /register here/i }).click();
      await expect(page.getByRole("heading", { name: /NFL Confidence Pool/ })).toBeVisible();
    });

    await page.waitForURL((url) => url.searchParams.get("register") === "Y", { timeout: 20_000, waitUntil: "commit" });
    await expect(page.getByRole("link", { name: /login here/i })).toBeVisible();
  });

  test("logged-out support does not show a sidebar trigger", async ({ page }) => {
    await gotoApp(page, "/support");
    await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Toggle Sidebar" })).toHaveCount(0);
  });

  test("unauthenticated picks set redirects to login", async ({ page }) => {
    await gotoApp(page, "/picks/set");
    await page.waitForURL((url) => url.pathname === "/auth/login", { timeout: 20_000, waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: /NFL Confidence Pool/ })).toBeVisible();
  });
});
