import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Invoked by absolute path so the script works regardless of how it's run (npm scripts put
// node_modules/.bin on PATH; direct node invocations don't).
const require = createRequire(import.meta.url);
const cliPath = path.join(path.dirname(require.resolve("logrocket-cli/package.json")), "bin/logrocket");

const apiKey = process.env.LOGROCKET_TOKEN ?? "";
const appDir = path.resolve(import.meta.dirname, "..");

let release = process.env.LOGROCKET_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";

if (!release) {
  release = (spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout ?? "").trim();
}

const hasJsMaps = (dir) => {
  try {
    return readdirSync(dir).some((file) => file.endsWith(".js.map"));
  } catch {
    return false;
  }
};

// Locally the browser assets live in .next/static, but Vercel's Turbopack integration
// processes the Next dist dir as part of onBuildComplete and may have relocated it by the
// time this script runs — so locate whichever "static" dir holds the generated maps.
const findStaticDir = () => {
  const preferred = path.join(appDir, ".next/static");

  if (hasJsMaps(path.join(preferred, "chunks"))) {
    return preferred;
  }

  let found;
  const walk = (dir, depth) => {
    if (found || depth > 4) {
      return;
    }

    let entries;

    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (
        found ||
        !entry.isDirectory() ||
        entry.name === "node_modules" ||
        entry.name.startsWith(".git") ||
        entry.name === ".turbo"
      ) {
        continue;
      }

      const full = path.join(dir, entry.name);

      if (entry.name === "static" && hasJsMaps(path.join(full, "chunks"))) {
        found = full;
      } else {
        walk(full, depth + 1);
      }
    }
  };

  walk(appDir, 0);

  if (!found) {
    walk(path.resolve(appDir, "../.."), 0);
  }

  return found;
};

const missing = [!apiKey && "LOGROCKET_TOKEN", !release && "a release hash"].filter(Boolean);

const staticDir = findStaticDir();

if (!staticDir) {
  missing.push("a built static dir containing .js.map files");
}

if (missing.length > 0) {
  console.log(`Skipping LogRocket source map upload (missing: ${missing.join(", ")})`);
} else {
  if (staticDir !== path.join(appDir, ".next/static")) {
    console.log(`Next dist dir was relocated by the build platform; uploading maps from ${staticDir}`);
  }

  // Registering the release is best-effort: it already existing (or the artifact endpoint
  // creating it implicitly) is fine — this upload is observability only and must never
  // fail the deployment, so failures are logged, not thrown.
  const created = spawnSync(process.execPath, [cliPath, "release", release, "--apikey", apiKey], { stdio: "inherit" });

  if (created.status !== 0) {
    console.log("LogRocket release creation failed (may already exist); continuing to upload.");
  }

  // The CLI resolves upload paths against process.cwd() with path.join, which corrupts
  // absolute paths — it only accepts paths relative to the current directory.
  const uploadArg = path.relative(process.cwd(), staticDir);

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
