import { SidebarProvider } from "@nfl-pool-monorepo/ui/components/sidebar";
import { Toaster } from "@nfl-pool-monorepo/ui/components/sonner";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import { type FC, Suspense } from "react";
import { PiFootballDuotone } from "react-icons/pi";
import "server-only";

import "./globals.css";

import SidebarOpenSync from "@/components/AppSidebar/SidebarOpenSync.client";
import AuthenticatedNavigation from "@/components/AuthenticatedNavigation/AuthenticatedNavigation";
import { AuthenticatedNavPresenceProvider } from "@/components/AuthenticatedNavigation/AuthenticatedNavPresence.client";
import LogRocketGate from "@/components/LogRocketBoot/LogRocketGate";
import OfflineBanner from "@/components/OfflineBanner/OfflineBanner";
import Providers from "@/components/Providers/providers";
import { env } from "@/lib/env";

const roboto = Roboto({
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  weight: ["400", "700"],
});
const appTitle = "NFL Confidence Pool";
const appDescription = "A confidence pool for the NFL regular season";
const appColor = "#8c8c8c";
const siteName = "A Site With No Name";
const ogImage = `${env.NEXT_PUBLIC_SITE_URL}/bkgd-pitch.png`;
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
      { sizes: "60x60", url: "/apple-touch-icon-iphone-60x60.png" },
      { sizes: "76x76", url: "/apple-touch-icon-iphone-76x76.png" },
      { sizes: "120x120", url: "/apple-touch-icon-iphone-retina-120x120.png" },
      { sizes: "152x152", url: "/apple-touch-icon-iphone-retina-152x152.png" },
    ],
    icon: [
      { sizes: "16x16", url: "/favicon-16x16.png" },
      { sizes: "32x32", url: "/favicon-32x32.png" },
    ],
    other: {
      rel: "mask-icon",
      url: "/safari-pinned-tab.svg",
    },
    shortcut: "/favicon.ico",
  },
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  openGraph: {
    description: appDescription,
    images: ogImage,
    siteName: siteName,
    title: appTitle,
    type: "website",
    url: env.NEXT_PUBLIC_SITE_URL,
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
    site: env.NEXT_PUBLIC_SITE_URL,
    title: appTitle,
  },
};

export const viewport: Viewport = {
  themeColor: appColor,
};

const PageLoadingFallback: FC = () => (
  <div className="flex h-full w-full items-center justify-center py-24">
    <PiFootballDuotone aria-hidden="true" className="size-10 animate-spin text-primary" />
    <span className="sr-only">Loading&hellip;</span>
  </div>
);

const RootLayout: FC<LayoutProps<"/">> = ({ children }) => {
  return (
    <html className={cn("h-full", roboto.className)} lang="en" suppressHydrationWarning>
      <head>
        {env.NEXT_PUBLIC_ENV === "production" && (
          <Script
            data-cf-beacon='{"token": "7948b9354d734d69b6866cecb098731f", "spa": true}'
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
          />
        )}
        {env.NEXT_PUBLIC_ENV === "preview" && (
          <Script
            data-cf-beacon='{"token": "4b2c9a4eecaa4b7d85552ebc8b355c8b", "spa": true}'
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
          />
        )}
      </head>

      <body className="h-full bg-black bg-[url('/bkgd-pitch.png')] bg-no-repeat bg-fixed bg-top bg-cover">
        <Providers>
          <Suspense fallback={null}>
            <LogRocketGate />
          </Suspense>
          <div style={{ viewTransitionName: "offline-banner" }}>
            <OfflineBanner />
          </div>
          <SidebarProvider>
            <SidebarOpenSync />
            <AuthenticatedNavPresenceProvider>
              <Suspense fallback={null}>
                <AuthenticatedNavigation />
              </Suspense>
              <main className="w-full relative">
                <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
              </main>
            </AuthenticatedNavPresenceProvider>
          </SidebarProvider>
          <div style={{ viewTransitionName: "app-toaster" }}>
            <Toaster richColors />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default RootLayout;
