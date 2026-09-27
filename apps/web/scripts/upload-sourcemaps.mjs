import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Invoked by absolute path so the script works regardless of how it's run (npm scripts put
// node_modules/.bin on PATH; direct node invocations don't).
const require = createRequire(import.meta.url);
const cliPath = path.join(path.dirname(require.resolve("logrocket-cli/package.json")), "bin/logrocket");

const apiKey = process.env.LOGROCKET_TOKEN ?? "";
const staticDir = path.resolve(import.meta.dirname, "../.next/static/chunks");

let release = process.env.LOGROCKET_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";

if (!release) {
  release = (spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout ?? "").trim();
}

const hasJsMaps = () => {
  try {
    return readdirSync(staticDir).some((file) => file.endsWith(".js.map"));
  } catch {
    return false;
  }
};

const missing = [
  !apiKey && "LOGROCKET_TOKEN",
  !release && "a release hash",
  !hasJsMaps() && "built source maps in .next/static/chunks",
].filter(Boolean);

if (missing.length > 0) {
  console.log(`Skipping LogRocket source map upload (missing: ${missing.join(", ")})`);
} else {
  // Registering the release is best-effort: it already existing is fine — this upload is
  // observability only and must never fail the deployment, so failures are logged, not thrown.
  const created = spawnSync(process.execPath, [cliPath, "release", release, "--apikey", apiKey], { stdio: "inherit" });

  if (created.status !== 0) {
    console.log("LogRocket release creation failed (may already exist); continuing to upload.");
  }

  // The CLI resolves upload paths via path.join(process.cwd(), arg), which corrupts absolute
  // paths — it only accepts paths relative to the current directory.
  const uploadArg = path.relative(process.cwd(), path.dirname(staticDir));

  const result = spawnSync(
    process.execPath,
    [cliPath, "upload", uploadArg, "--apikey", apiKey, "--release", release, "--url-prefix", "~/_next/static/"],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.error(
      `LogRocket source map upload failed with exit code ${result.status}; deployment continuing without updated maps.`,
    );
  }
}
