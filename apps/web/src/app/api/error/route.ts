import { type NextRequest, NextResponse } from "next/server";

import { getRandomPublicImage } from "@/app/randomImage";
import { getCurrentSession } from "@/server/loaders/sessions";

export const GET = async (_req: NextRequest, _ctx: RouteContext<"/api/error">) => {
  const { session } = await getCurrentSession();
  const image = await getRandomPublicImage("500");

  return NextResponse.json({ image, isLoggedIn: !!session });
};
