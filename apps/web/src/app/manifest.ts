import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => {
  return {
    background_color: "#0f0f0f",
    categories: ["sports", "games"],
    description: "A confidence pool for the NFL regular season",
    display: "standalone",
    icons: [
      {
        purpose: "maskable",
        sizes: "192x192",
        src: "/icon-maskable-192x192.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icon-maskable-512x512.png",
        type: "image/png",
      },
      {
        purpose: "monochrome",
        sizes: "512x512",
        src: "/icon-monochrome-512x512.png",
        type: "image/png",
      },
      {
        sizes: "192x192",
        src: "/icon-192x192.png",
        type: "image/png",
      },
      {
        sizes: "256x256",
        src: "/icon-256x256.png",
        type: "image/png",
      },
      {
        sizes: "384x384",
        src: "/icon-384x384.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icon-512x512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "en",
    name: "NFL Confidence Pool",
    scope: "/",
    short_name: "NFL CP",
    shortcuts: [
      { name: "Make Picks", short_name: "Picks", url: "/picks/set" },
      { name: "View My Picks", short_name: "My Picks", url: "/picks/view" },
      { name: "Make Survivor Pick", short_name: "Survivor", url: "/survivor/set" },
      { name: "Scoreboard", short_name: "Scoreboard", url: "/scoreboard" },
    ],
    start_url: "/",
    theme_color: "#0f0f0f",
  };
};

export default manifest;
