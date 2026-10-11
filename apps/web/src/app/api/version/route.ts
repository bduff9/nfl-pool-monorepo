import { NextResponse } from "next/server";

import { APP_VERSION } from "@/lib/appVersion";

// Lets an open copy of the app find out that a newer deploy exists. No auth: it only returns the build's commit id.
export const GET = () => NextResponse.json({ version: APP_VERSION }, { headers: { "Cache-Control": "no-store" } });
