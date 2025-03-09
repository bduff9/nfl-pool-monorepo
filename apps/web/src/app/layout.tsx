import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import { type FC, type ReactNode, Suspense } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";

import Providers from "@/components/Providers/providers";
import Sidebar from "@/components/Sidebar/Sidebar";
import SidebarLoader from "@/components/Sidebar/SidebarLoader";
import { NEXT_PUBLIC_ENV, NEXT_PUBLIC_SITE_URL } from "@/lib/constants";
import { getCurrentSession } from "@/server/loaders/sessions";
import { Toaster } from "@nfl-pool-monorepo/ui/components/sonner";

const roboto = Roboto({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const appTitle = "NFL Confidence Pool";
const appDescription = "A confidence pool for the NFL regular season";
const appColor = "#8c8c8c";
const siteName = "A Site With No Name";
const ogImage = `${NEXT_PUBLIC_SITE_URL}/bkgd-pitch.png`;
const twitterAccount = "@Duffmaster33";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appTitle,
  },
  applicationName: appTitle,
  description: appDescription,
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      "/apple-touch-icon.png",
      { url: "/apple-touch-icon-iphone-60x60.png", sizes: "60x60" },
      { url: "/apple-touch-icon-iphone-76x76.png", sizes: "76x76" },
      { url: "/apple-touch-icon-iphone-retina-120x120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-iphone-retina-152x152.png", sizes: "152x152" },
    ],
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16" },
      { url: "/favicon-32x32.png", sizes: "32x32" },
    ],
    other: {
      rel: "mask-icon",
      url: "/safari-pinned-tab.svg",
    },
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  metadataBase: new URL(NEXT_PUBLIC_SITE_URL),
  openGraph: {
    description: appDescription,
    images: ogImage,
    siteName: siteName,
    title: appTitle,
    type: "website",
    url: NEXT_PUBLIC_SITE_URL,
  },
  title: {
    default: appTitle,
    template: `%s | ${appTitle}`,
  },
  twitter: {
    card: "summary",
    creator: twitterAccount,
    description: appDescription,
    images: ogImage,
    site: NEXT_PUBLIC_SITE_URL,
    title: appTitle,
  },
};

export const viewport: Viewport = {
  themeColor: appColor,
};

type Props = {
  children: ReactNode;
};

const RootLayout: FC<Props> = async ({ children }) => {
  const { user } = await getCurrentSession();

  return (
    <html className={cn(roboto.className)} lang="en">
      <body className="bg-black bg-[url('/bkgd-pitch.png')] bg-no-repeat bg-fixed bg-top bg-cover">
        {NEXT_PUBLIC_ENV === "production" && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "7948b9354d734d69b6866cecb098731f", "spa": true}'
          />
        )}
        {NEXT_PUBLIC_ENV === "preview" && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "4b2c9a4eecaa4b7d85552ebc8b355c8b", "spa": true}'
          />
        )}
        <Providers>
          <div className="w-full mx-auto px-3 min-h-screen h-screen">
            <div className="flex flex-wrap -mx-3 h-full pt-0 md:pt-4">
              {user ? (
                <>
                  <Suspense fallback={<SidebarLoader />}>
                    <Sidebar user={user} />
                  </Suspense>
                  <div className="h-full shrink-0 grow sm:w-[75%] sm:ml-auto print:ml-0 lg:w-[83.33333%] lg:ml-[16.66667%] relative">
                    <Suspense>{children}</Suspense>
                  </div>
                </>
              ) : (
                <Suspense>
                  <div className="h-full shrink-0 grow relative">{children}</div>
                </Suspense>
              )}
            </div>
          </div>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
