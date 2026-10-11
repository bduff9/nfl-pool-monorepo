// Regenerates public/splash/*.png, the iOS launch screens shown while the installed app starts. Run from apps/web with
// `node scripts/generate-splash-screens.mjs` after changing the icon or this list, and keep src/lib/splashScreens.ts
// in sync. sharp is borrowed from Next's own dependency so it doesn't need to be listed here.
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { splashScreens } from "../src/lib/splashScreens.ts";

const sharp = createRequire(import.meta.url)(
  createRequire(import.meta.url).resolve("sharp", {
    paths: [path.dirname(createRequire(import.meta.url).resolve("next/package.json"))],
  }),
);

// The icon's own background, so the artwork melts into the screen
const BACKGROUND = { b: 10, g: 8, r: 7 };
const LOGO_SHARE_OF_SHORT_SIDE = 0.4;

await mkdir("public/splash", { recursive: true });

await Promise.all(
  splashScreens.map(async ({ height, name, width }) => {
    const logoSize = Math.round(Math.min(width, height) * LOGO_SHARE_OF_SHORT_SIDE);
    const logo = await sharp("public/icon-512x512.png").resize(logoSize, logoSize).toBuffer();

    await sharp({ create: { background: BACKGROUND, channels: 3, height, width } })
      .composite([{ input: logo, left: Math.round((width - logoSize) / 2), top: Math.round((height - logoSize) / 2) }])
      .png({ compressionLevel: 9, palette: true, quality: 95 })
      .toFile(`public/splash/${name}.png`);
  }),
);

console.log(`Wrote ${splashScreens.length} launch screens to public/splash`);
