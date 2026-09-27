import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  env: {
    // Inlined at build time and must match the --release passed by scripts/upload-sourcemaps.mjs
    // so LogRocket can apply the uploaded source maps to this deployment's stack traces.
    NEXT_PUBLIC_LOGROCKET_RELEASE: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
  partialPrefetching: true,
  productionBrowserSourceMaps: true,
  reactCompiler: true,
  experimental: {
    // Only for the "instant()" Playwright helper running against a production build in CI —
    // must stay off in every deployed environment (production, preview), not just prod.
    exposeTestingApiInProductionBuild: process.env.CI === "true",
    turbopackRustReactCompiler: true,
    useOffline: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
  typedRoutes: true,
};

export default nextConfig;
