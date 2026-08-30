import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import { type FC, Suspense, ViewTransition } from "react";
import { PiFootballDuotone } from "react-icons/pi";
import "server-only";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import { Toaster } from "@nfl-pool-monorepo/ui/components/sonner";
import { cookies } from "next/headers";

import AppSidebar from "@/components/AppSidebar/AppSidebar";
import { CommandMenu } from "@/components/CommandMenu/CommandMenu";
import OfflineBanner from "@/components/OfflineBanner/OfflineBanner";
import Providers from "@/components/Providers/providers";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/server/loaders/sessions";

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

// This app is fully auth-gated - every route already reads cookies() to check the session,
// so there's no static shell to produce. Opt the whole app out of Cache Components' static-shell
// requirement rather than restructuring every route to carve out a cookie-free shell.
export const instant = false;

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

const RootLayout: FC<LayoutProps<"/">> = async ({ children }) => {
  const { user } = await getCurrentSession();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <ViewTransition>
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
          <Providers user={user}>
            <OfflineBanner />
            {user ? (
              <SidebarProvider defaultOpen={defaultOpen}>
                <Suspense fallback={null}>
                  <CommandMenu user={user} />
                </Suspense>
                <Suspense
                  fallback={
                    <Sidebar>
                      <SidebarHeader>
                        <SidebarMenu>
                          <SidebarMenuSkeleton className="mb-8" />
                        </SidebarMenu>
                      </SidebarHeader>
                      <SidebarContent>
                        {Array.from({ length: 5 }).map((_, index) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: We have no other data besides index
                          <SidebarGroup key={index}>
                            <SidebarGroupContent>
                              <SidebarMenu>
                                <SidebarMenuItem>
                                  <SidebarMenuSkeleton />
                                </SidebarMenuItem>
                              </SidebarMenu>
                            </SidebarGroupContent>
                          </SidebarGroup>
                        ))}
                      </SidebarContent>

                      <SidebarFooter>
                        <SidebarMenu>
                          <SidebarMenuItem>
                            <SidebarMenuSkeleton showIcon />
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarFooter>
                    </Sidebar>
                  }
                >
                  <AppSidebar user={user} />
                </Suspense>
                <main className="w-full relative">
                  <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
                </main>
              </SidebarProvider>
            ) : (
              <Suspense fallback={<PageLoadingFallback />}>
                <div className="min-h-full relative">{children}</div>
              </Suspense>
            )}
            <Toaster richColors />
          </Providers>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ViewTransition>
  );
};

export default RootLayout;
