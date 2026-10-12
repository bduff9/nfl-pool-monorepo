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
import PullToRefresh from "@/components/PullToRefresh/PullToRefresh.client";
import ServiceWorkerManager from "@/components/ServiceWorkerManager/ServiceWorkerManager.client";
import { env } from "@/lib/env";
import { splashScreens } from "@/lib/splashScreens";

const roboto = Roboto({
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  weight: ["400", "700"],
});
const appTitle = "NFL Confidence Pool";
const appDescription = "A confidence pool for the NFL regular season";
const siteName = "A Site With No Name";
const ogImage = `${env.NEXT_PUBLIC_SITE_URL}/bkgd-pitch.png`;
const twitterAccount = "@Duffmaster33";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    // Shown while the installed app starts, instead of a blank white screen
    startupImage: splashScreens.map(({ media, url }) => ({ media, url })),
    // The app draws under a transparent status bar (padded by --safe-top), instead of iOS adding its own opaque bar
    // over the top of the page, which also dimmed whatever sat in the first 44pt under it
    statusBarStyle: "black-translucent",
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
  // Next only emits the unprefixed mobile-web-app-capable; iOS's launch screens are tied to Apple's own tag
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  openGraph: {
    description: appDescription,
    images: ogImage,
    siteName: siteName,
    title: appTitle,
    type: "website",
    url: env.NEXT_PUBLIC_SITE_URL,
  },
  other: { "apple-mobile-web-app-capable": "yes" },
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
  // "cover" lets the app draw into the iOS safe areas (home indicator) so they can be padded explicitly via env(),
  // and "resizes-content" shrinks the layout when the on-screen keyboard opens instead of covering inputs.
  interactiveWidget: "resizes-content",
  // Two media-scoped metas are required: iOS 26 standalone web apps fall back to a blue
  // system tint when a single theme-color is paired with the apple status-bar-style meta.
  // The color matches the top of bkgd-pitch.png (near-black) so the status bar blends with
  // the app top in both themes — the background image is theme-independent.
  themeColor: [
    { color: "#0f0f0f", media: "(prefers-color-scheme: light)" },
    { color: "#0f0f0f", media: "(prefers-color-scheme: dark)" },
  ],
  viewportFit: "cover",
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

      <body className="h-full bg-background bg-[url('/bkgd-pitch.png')] bg-no-repeat bg-fixed bg-top bg-cover">
        <Providers>
          <Suspense fallback={null}>
            <LogRocketGate />
          </Suspense>
          <OfflineBanner />
          <Suspense fallback={null}>
            <PullToRefresh />
          </Suspense>
          <ServiceWorkerManager />
          <SidebarProvider>
            <SidebarOpenSync />
            <AuthenticatedNavPresenceProvider>
              <Suspense fallback={null}>
                <AuthenticatedNavigation />
              </Suspense>
              <main className="w-full relative grid grid-cols-1 min-h-dvh pt-(--safe-top)">
                <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
              </main>
            </AuthenticatedNavPresenceProvider>
          </SidebarProvider>
          {/* z-[60] keeps the toaster a stacking context above fixed chrome (PickActionsBar z-49) and Radix portals (z-50), which the view-transition-name context would otherwise pin at z-0 */}
          <div className="relative z-[60]" style={{ viewTransitionName: "app-toaster" }}>
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
