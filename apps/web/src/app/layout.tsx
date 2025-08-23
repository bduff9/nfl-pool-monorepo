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
  SidebarTrigger,
} from "@nfl-pool-monorepo/ui/components/sidebar";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import { type FC, Suspense } from "react";
import "server-only";

import "./globals.css";

import { Toaster } from "@nfl-pool-monorepo/ui/components/sonner";
import { cookies } from "next/headers";

import AppSidebar from "@/components/AppSidebar/AppSidebar";
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

const RootLayout: FC<LayoutProps<"/">> = async ({ children }) => {
  const { user } = await getCurrentSession();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html className={cn("h-full", roboto.className)} lang="en">
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

      <body className="h-full bg-black bg-[url('/bkgd-pitch.png')] bg-no-repeat bg-fixed bg-top bg-cover dark">
        <Providers user={user}>
          {user ? (
            <SidebarProvider defaultOpen={defaultOpen}>
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
                <SidebarTrigger className="text-black" />
                <Suspense>{children}</Suspense>
              </main>
            </SidebarProvider>
          ) : (
            <Suspense>
              <div className="h-full shrink-0 grow relative">{children}</div>
            </Suspense>
          )}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
