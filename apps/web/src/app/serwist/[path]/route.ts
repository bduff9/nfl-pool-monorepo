import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { createSerwistRoute } from "@serwist/turbopack";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Public files the pages need offline. Their URLs are not hashed, so the revision is a hash of the file itself: a
// deploy only re-downloads the ones that actually changed.
const PUBLIC_FILES = [
  "/offline.html",
  "/bkgd-pitch.png",
  "/football.png",
  "/icon-192x192.png",
  ...readdirSync(path.join(PUBLIC_DIR, "NFLLogos")).map((file) => `/NFLLogos/${file}`),
];

const publicEntries = PUBLIC_FILES.map((url) => ({
  revision: createHash("md5")
    .update(readFileSync(path.join(PUBLIC_DIR, url)))
    .digest("hex"),
  url,
}));

// Serves the service worker at /serwist/sw.js. Turbopack has no webpack-plugin hook, so this route bundles
// src/sw.ts at build time and fills in the precache list of hashed build files. Same setup as ServiceIQPro.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: publicEntries,
  // The hashed build files only; the public files above are listed explicitly so everything else under public/ stays out
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,apng,png,avif,jpg,jpeg,jfif,pjpeg,pjp,gif,svg,webp,json,webmanifest}",
  ],
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
});
