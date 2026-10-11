// Regenerates public/splash/*.png, the iOS launch screens shown while the installed app starts, by rendering
// scripts/splash-source.svg (a 390x844 design) at every device size in src/lib/splashScreens.ts. Run from apps/web with
// `node --experimental-strip-types scripts/generate-splash-screens.mjs`. sharp is borrowed from Next's own dependency
// so it doesn't need to be listed here.
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { splashScreens } from "../src/lib/splashScreens.ts";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [path.dirname(require.resolve("next/package.json"))] }));

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const BACKGROUND = "#07080a";

const source = await readFile("scripts/splash-source.svg", "utf8");
const design = source.slice(source.indexOf(">") + 1, source.lastIndexOf("</svg>"));

// The whole design stays visible and centered; a screen of a different shape shows more of the dark background (and
// the field, which runs past the design's edges) around it
const render = ({ height, width }) => {
  const isWiderThanDesign = width / height > DESIGN_WIDTH / DESIGN_HEIGHT;
  const viewHeight = isWiderThanDesign ? DESIGN_HEIGHT : (DESIGN_WIDTH * height) / width;
  const viewWidth = isWiderThanDesign ? (DESIGN_HEIGHT * width) / height : DESIGN_WIDTH;
  const viewBox = `${(DESIGN_WIDTH - viewWidth) / 2} ${(DESIGN_HEIGHT - viewHeight) / 2} ${viewWidth} ${viewHeight}`;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">` +
      `<rect x="-4000" y="-4000" width="8000" height="8000" fill="${BACKGROUND}"/>${design}</svg>`,
  );
};

await mkdir("public/splash", { recursive: true });

await Promise.all(
  splashScreens.map(({ height, name, width }) =>
    sharp(render({ height, width }))
      .png({ compressionLevel: 9, effort: 10, palette: true, quality: 90 })
      .toFile(`public/splash/${name}.png`),
  ),
);

console.log(`Wrote ${splashScreens.length} launch screens to public/splash`);
