import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.wordmark,
    short_name: siteConfig.wordmark,
    description: "Get paid in stock tokens without showing your wallet.",
    start_url: "/",
    display: "standalone",
    background_color: "#060607",
    theme_color: "#060607",
    icons: [
      { src: "/icon", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
