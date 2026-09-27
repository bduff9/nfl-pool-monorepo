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

const mapCount = (dir) => {
  try {
    return readdirSync(dir).filter((file) => file.endsWith(".js.map")).length;
  } catch {
    return 0;
  }
};

// Normally the browser maps live in .next/static, but Vercel's build hooks process the Next
// dist dir before this script runs and may relocate them — probe the known locations.
const candidateStaticDirs = [
  path.join(appDir, ".next/static"),
  path.join(appDir, ".vercel/output/static/_next/static"),
  path.join(repoDir, ".vercel/output/static/_next/static"),
  "/vercel/output/static/_next/static",
];

const staticDir = candidateStaticDirs.find((dir) => mapCount(path.join(dir, "chunks")) > 0);

if (!apiKey || !release || !staticDir) {
  const chunkFiles = existsSync(canonicalChunksDir) ? readdirSync(canonicalChunksDir) : [];
  const distDirs = readdirSync(appDir)
    .filter((name) => name.startsWith(".next"))
    .join(", ");

  console.log(
    `Skipping LogRocket source map upload (LOGROCKET_TOKEN ${apiKey ? "set" : "missing"}, release ${release || "missing"}, maps at ${staticDir ?? "no known location"})`,
  );
  console.log(
    `Diagnostic: ${canonicalChunksDir} has ${chunkFiles.length} files (${mapCount(canonicalChunksDir)} maps); Next dist dirs in app: ${distDirs || "none"}`,
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
