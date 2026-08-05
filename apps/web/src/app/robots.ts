import type { MetadataRoute } from "next";
import "server-only";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    disallow: "/",
    userAgent: "*",
  },
});

export default robots;
