import { promises as fs } from "node:fs";
import path from "node:path";

import { getRandomInteger } from "@nfl-pool-monorepo/utils/numbers";

export const getRandomPublicImage = async (folder: string): Promise<string> => {
  const imagesDirectory = path.join(process.cwd(), "public", folder);
  const imageNames = await fs.readdir(imagesDirectory);
  const images = imageNames.map((image) => `/${folder}/${image}`);

  return images[getRandomInteger(0, images.length)] ?? "";
};
