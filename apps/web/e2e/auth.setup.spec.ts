import { mkdir } from "node:fs/promises";
import path from "node:path";

import { test as setup } from "@playwright/test";

import { AUTH_FILE, hasE2EUser, loginAsE2EUser, skipWithoutE2EUser } from "./auth";

setup("authenticate", async ({ page }) => {
  setup.setTimeout(120_000);
  await mkdir(path.dirname(AUTH_FILE), { recursive: true });

  if (!hasE2EUser) {
    await page.context().storageState({ path: AUTH_FILE });
    setup.skip(true, skipWithoutE2EUser);
    return;
  }

  await loginAsE2EUser(page);
  await page.context().storageState({ path: AUTH_FILE });
});
