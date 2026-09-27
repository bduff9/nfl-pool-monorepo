import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Invoked by absolute path so the script works regardless of how it's run (npm scripts put
// node_modules/.bin on PATH; direct node invocations don't).
const require = createRequire(import.meta.url);
const cliPath = path.join(path.dirname(require.resolve("logrocket-cli/package.json")), "bin/logrocket");

const apiKey = process.env.LOGROCKET_TOKEN ?? "";
const appDir = path.resolve(import.meta.dirname, "..");
const repoDir = path.resolve(appDir, "../..");
const canonicalChunksDir = path.join(appDir, ".next/static/chunks");

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

// Find *.js.map files written recently anywhere in the given roots. Vercel's Turbopack
// integration may stage browser assets outside .next/static, so let the filesystem answer.
const findRecentMaps = () => {
  const roots = [repoDir, "/vercel/output", "/tmp"].filter((root) => existsSync(root));
  const result = spawnSync(
    "find",
    [
      ...roots,
      "-name",
      "node_modules",
      "-prune",
      "-o",
      "-name",
      ".git",
      "-prune",
      "-o",
      "-name",
      "*.js.map",
      "-mmin",
      "-60",
      "-print",
    ],
    { encoding: "utf8" },
  );

  return (result.stdout ?? "").trim().split("\n").filter(Boolean);
};

// The uploaded keys are the glob-relative paths under the passed directory, and the served
// URLs are /_next/static/<...>, so a dir named "static" that directly contains "chunks" is
// the right upload root regardless of where the platform staged it.
const staticRootFor = (mapPath) => {
  const segments = mapPath.split(path.sep);
  const staticIndex = segments.lastIndexOf("static");

  if (staticIndex > 0 && hasJsMaps(path.join(segments.slice(0, staticIndex + 1).join(path.sep), "chunks"))) {
    return segments.slice(0, staticIndex + 1).join(path.sep);
  }

  return null;
};

const missing = [!apiKey && "LOGROCKET_TOKEN", !release && "a release hash"].filter(Boolean);

let staticDir =
  hasJsMaps(canonicalChunksDir) || hasJsMaps(path.dirname(canonicalChunksDir))
    ? path.dirname(canonicalChunksDir)
    : null;

if (!staticDir && apiKey) {
  const mapPaths = findRecentMaps();

  if (mapPaths.length > 0) {
    console.log(`Found ${mapPaths.length} recent .js.map files; sample: ${mapPaths.slice(0, 5).join(", ")}`);
    staticDir = mapPaths.map(staticRootFor).find(Boolean) ?? null;

    if (!staticDir) {
      console.log("None of them live under a static/chunks layout, so they cannot be matched to /_next/static URLs.");
    }
  } else {
    console.log("No .js.map files exist anywhere in the workspace at this point in the build.");
  }
}

if (!apiKey || !release || !staticDir) {
  const chunkFiles = existsSync(canonicalChunksDir) ? readdirSync(canonicalChunksDir) : [];

  console.log(
    `Skipping LogRocket source map upload (LOGROCKET_TOKEN ${apiKey ? "set" : "missing"}, release ${release || "missing"}, maps at ${staticDir ?? "no known location"})`,
  );
  console.log(
    `Diagnostic: ${canonicalChunksDir} has ${chunkFiles.length} files (${chunkFiles.filter((file) => file.endsWith(".js.map")).length} maps)`,
  );
} else {
  // Registering the release is best-effort: it already existing is fine — this upload is
  // observability only and must never fail the deployment, so failures are logged, not thrown.
  const created = spawnSync(process.execPath, [cliPath, "release", release, "--apikey", apiKey], { stdio: "inherit" });

  if (created.status !== 0) {
    console.log("LogRocket release creation failed (may already exist); continuing to upload.");
  }

  // The CLI resolves upload paths via path.join(process.cwd(), arg), which corrupts absolute
  // paths — it only accepts paths relative to the current directory.
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
