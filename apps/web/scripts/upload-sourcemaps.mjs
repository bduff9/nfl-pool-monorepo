import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const apiKey = process.env.LOGROCKET_TOKEN ?? "";
const staticDir = path.resolve(import.meta.dirname, "../.next/static");

let release = process.env.LOGROCKET_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";

if (!release) {
  release = (spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout ?? "").trim();
}

if (!apiKey || !release || !existsSync(staticDir)) {
  console.log("Skipping LogRocket source map upload (needs LOGROCKET_TOKEN, a release hash, and a completed build).");
} else {
  // Registering the release is best-effort: it already existing (or the artifact endpoint
  // creating it implicitly) is fine — only the upload itself fails the build.
  const created = spawnSync("logrocket", ["release", release, "--apikey", apiKey], { stdio: "inherit" });

  if (created.status !== 0) {
    console.log("LogRocket release creation failed (may already exist); continuing to upload.");
  }

  const result = spawnSync(
    "logrocket",
    ["upload", staticDir, "--apikey", apiKey, "--release", release, "--url-prefix", "~/_next/static/"],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(`LogRocket source map upload failed with exit code ${result.status}`);
  }
}
