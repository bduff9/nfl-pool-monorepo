import { promises as fs } from "node:fs";
import path from "node:path";

import { getRandomInteger } from "@nfl-pool-monorepo/utils/numbers";
import { type NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/loaders/sessions";

export const GET = async (_req: NextRequest, _ctx: RouteContext<"/api/error">) => {
  const { session } = await getCurrentSession();
  const imagesDirectory = path.join(process.cwd(), "public", "500");
  const imageNames = await fs.readdir(imagesDirectory);
  const images = imageNames.map((image) => `/500/${image}`);
  const image = images[getRandomInteger(0, images.length)] ?? "";

  return NextResponse.json({ image, isLoggedIn: !!session });
};
