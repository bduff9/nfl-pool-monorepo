// One-off generator for public/icon-monochrome-512x512.png, the monochrome icon Android 13+ uses to theme the launcher
// icon. It keeps the bright lines of public/icon-512x512.png as a solid white silhouette on a transparent background:
// greyscale luminance becomes the alpha channel, so the dark background is transparent, the glow fades out and the
// lines stay opaque. Run from apps/web with `node scripts/generate-monochrome-icon.mjs`. sharp is borrowed from Next's
// own dependency so it doesn't need to be listed here.
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [path.dirname(require.resolve("next/package.json"))] }));

const SOURCE = "public/icon-512x512.png";
const OUTPUT = "public/icon-monochrome-512x512.png";

// Luminance at or below LOW is fully transparent and at or above HIGH fully opaque, so the faint glow drops out and the
// lines are solid
const LOW = 40;
const HIGH = 140;

const toAlpha = (luminance) => Math.round(255 * Math.min(1, Math.max(0, (luminance - LOW) / (HIGH - LOW))));

// Greyscale leaves one byte of luminance per pixel
const { data, info } = await sharp(SOURCE).greyscale().removeAlpha().raw().toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
const pixels = Buffer.alloc(pixelCount * 4);

for (let p = 0; p < pixelCount; p++) {
  pixels[p * 4] = 255;
  pixels[p * 4 + 1] = 255;
  pixels[p * 4 + 2] = 255;
  pixels[p * 4 + 3] = toAlpha(data[p]);
}

// Android masks the themed icon to a circle and only guarantees the middle two-thirds (the adaptive icon safe zone), so
// the artwork is trimmed and shrunk to fit inside that circle
const SAFE_SIZE = 280;

const trimmed = await sharp(pixels, { raw: { channels: 4, height: info.height, width: info.width } })
  .trim()
  .resize(SAFE_SIZE, SAFE_SIZE, { background: { alpha: 0, b: 0, g: 0, r: 0 }, fit: "contain" })
  .png()
  .toBuffer();
const padding = (info.width - SAFE_SIZE) / 2;

await sharp(trimmed)
  .extend({ background: { alpha: 0, b: 0, g: 0, r: 0 }, bottom: padding, left: padding, right: padding, top: padding })
  .png({ compressionLevel: 9, effort: 10, palette: false })
  .toFile(OUTPUT);
