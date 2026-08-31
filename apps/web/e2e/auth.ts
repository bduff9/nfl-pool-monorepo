import path from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";

export const AUTH_FILE = path.join(process.cwd(), "e2e/.auth/user.json");

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
export const hasE2EUser = Boolean(e2eEmail && e2ePassword);

export const skipWithoutE2EUser = "Set E2E_EMAIL and E2E_PASSWORD to run authenticated Instant Nav tests";

export const gotoApp = async (
  page: Page,
  url: string,
  waitUntil: "commit" | "domcontentloaded" | "load" = "domcontentloaded",
): Promise<void> => {
  await page.goto(url, { waitUntil });
};

export const loginAsE2EUser = async (page: Page): Promise<void> => {
  if (!e2eEmail || !e2ePassword) {
    throw new Error(skipWithoutE2EUser);
  }

  await gotoApp(page, "/auth/login", "load");
  await expect(page.getByRole("button", { exact: true, name: "Login" })).toBeEnabled();
  await page.getByRole("textbox", { name: "Email address" }).fill(e2eEmail);
  await page.getByRole("textbox", { name: "Password" }).fill(e2ePassword);
  await page.getByRole("button", { exact: true, name: "Login" }).click();
  await expect(page).not.toHaveURL(/[?&]password=/);
  await page.waitForURL((url) => url.pathname !== "/auth/login", { timeout: 60_000, waitUntil: "commit" });
};

const visibleRole = (page: Page, role: "button" | "link", name: string | RegExp): Locator =>
  page.getByRole(role, { name }).filter({ visible: true });

const openSidebarIfNeeded = async (page: Page): Promise<void> => {
  const scoreboardLink = visibleRole(page, "link", "NFL Scoreboard");
  const toggle = visibleRole(page, "button", "Toggle Sidebar");

  await expect(scoreboardLink.or(toggle).first()).toBeVisible({ timeout: 20_000 });

  if (await scoreboardLink.isVisible()) {
    return;
  }

  await toggle.click();
  await expect(scoreboardLink).toBeVisible();
};

export const sidebarRoot = async (page: Page): Promise<Locator> => {
  await openSidebarIfNeeded(page);

  const sheet = page.getByRole("dialog", { name: "Sidebar" });

  if (await sheet.isVisible()) {
    return sheet;
  }

  return page.getByRole("navigation");
};

export const waitForDashboard = async (page: Page, week = 1): Promise<void> => {
  await expect(page.getByRole("heading", { name: `Week ${week} Rank` })).toBeVisible({ timeout: 20_000 });
};
