import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRandomPublicImage } from "./randomImage";

describe("getRandomPublicImage", () => {
  let root = "";

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "random-image-"));
    vi.spyOn(process, "cwd").mockReturnValue(root);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(root, { force: true, recursive: true });
  });

  it("returns a public path for a file in the folder", async () => {
    mkdirSync(path.join(root, "public", "404"), { recursive: true });
    writeFileSync(path.join(root, "public", "404", "a.png"), "");

    await expect(getRandomPublicImage("404")).resolves.toBe("/404/a.png");
  });

  it("returns an empty string when the folder has no images", async () => {
    mkdirSync(path.join(root, "public", "500"), { recursive: true });

    await expect(getRandomPublicImage("500")).resolves.toBe("");
  });
});
