import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { getRandomInteger } from "@/lib/numbers";
import { getCurrentSession } from "@/server/loaders/sessions";

export const GET = async () => {
  const { session } = await getCurrentSession();
  const imagesDirectory = path.join(process.cwd(), "public", "500");
  const imageNames = await fs.readdir(imagesDirectory);
  const images = imageNames.map((image) => `/500/${image}`);
  const image = images[getRandomInteger(0, images.length)] ?? "";

  return NextResponse.json({ image, isLoggedIn: !!session });
};
