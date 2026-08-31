import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

import { gotoApp, hasE2EUser, sidebarRoot, skipWithoutE2EUser, waitForDashboard } from "./auth";

test.describe("authenticated instant navigation", () => {
  // biome-ignore lint/suspicious/noSkippedTests: local/CI without E2E_EMAIL and E2E_PASSWORD should still run logged-out Instant Nav tests
  test.skip(!hasE2EUser, skipWithoutE2EUser);

  test("dashboard heading is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/?week=1");
        await expect(
          page
            .getByTestId("route-loading")
            .or(page.getByRole("heading", { name: "Week 1 Rank" }))
            .first(),
        ).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );

    await waitForDashboard(page, 1);
  });

  test("dashboard to scoreboard is instant", async ({ page }) => {
    await gotoApp(page, "/?week=1");
    await waitForDashboard(page, 1);
    const nav = await sidebarRoot(page);

    await instant(page, async () => {
      await nav.getByRole("link", { name: "NFL Scoreboard" }).click();
    });

    await expect(page).toHaveURL(/\/scoreboard/, { timeout: 20_000 });
    await expect(page.getByRole("img").first()).toBeVisible({ timeout: 20_000 });
  });

  test("week next keeps Instant Nav and updates the URL", async ({ page }) => {
    await gotoApp(page, "/scoreboard?week=1");
    await expect(page.getByRole("img").first()).toBeVisible({ timeout: 20_000 });
    const nav = await sidebarRoot(page);

    await instant(page, async () => {
      await nav.getByRole("link", { name: "Next week" }).click();
    });

    await expect(page).toHaveURL(/week=2/, { timeout: 20_000 });
  });

  test("make picks is instant from the dashboard", async ({ page }) => {
    await gotoApp(page, "/?week=2");
    await waitForDashboard(page, 2);

    const makePicks = page.getByRole("link", { name: "Make my picks" });

    await expect(makePicks).toBeVisible();

    await instant(page, async () => {
      await makePicks.click();
    });

    await expect(page).toHaveURL(/\/picks\/set/, { timeout: 20_000 });
    await expect(page).toHaveURL(/week=2/);
    await expect(page.getByRole("columnheader", { name: "Game" })).toBeVisible({ timeout: 20_000 });
  });

  test("view my picks shell is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/picks/view?week=1");
        await expect(page.getByTestId("route-loading")).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );

    await expect(page.getByRole("img").first()).toBeVisible({ timeout: 20_000 });
  });

  test("help from the sidebar is instant", async ({ page }) => {
    await gotoApp(page, "/?week=1");
    await waitForDashboard(page, 1);
    const nav = await sidebarRoot(page);

    await instant(page, async () => {
      await nav.getByRole("link", { name: "Help" }).click();
      await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
    });

    await expect(page).toHaveURL(/\/support/, { timeout: 20_000 });
    await expect(page.getByRole("searchbox", { name: "Search the help page" })).toBeVisible({ timeout: 20_000 });
  });

  test("admin users shell is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/admin/users");
        await expect(page.getByTestId("route-loading")).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );

    await expect(page.getByText(/\d+ Users?/)).toBeVisible({ timeout: 20_000 });
  });

  test("edit account shell is available on an initial load", async ({ baseURL, page }) => {
    await instant(
      page,
      async () => {
        await gotoApp(page, "/users/edit");
        await expect(page.getByTestId("route-loading")).toBeVisible();
      },
      { baseURL: baseURL ?? "http://localhost:3000" },
    );

    await expect(page.getByPlaceholder("First name")).toBeVisible({ timeout: 20_000 });
  });

  test("weekly standings with no MV data redirect home", async ({ page }) => {
    await gotoApp(page, "/weekly?week=1");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000, waitUntil: "commit" });
    await waitForDashboard(page, 1);
  });

  test("overall standings with no MV data redirect home", async ({ page }) => {
    await gotoApp(page, "/overall");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000, waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: /Rank/ }).first()).toBeVisible({ timeout: 20_000 });
  });
});
