import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/TopBar";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Preloader } from "@/components/Preloader";
import { siteConfig, xHandle } from "@/lib/site-config";

const title = `${siteConfig.wordmark}: ${siteConfig.tagline.toLowerCase()}`;

// Fonts load from a runtime <link> rather than next/font/google, which
// downloads and self-hosts at BUILD time and so needs outbound access from
// wherever `next build` runs.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: title,
    template: `%s · ${siteConfig.wordmark}`,
  },
  description: siteConfig.seoDescription,
  openGraph: {
    type: "website",
    siteName: siteConfig.wordmark,
    url: siteConfig.url,
    title: siteConfig.tagline,
    description: siteConfig.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.tagline,
    description: siteConfig.seoDescription,
    ...(xHandle ? { site: xHandle, creator: xHandle } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: "#060607",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Preloader />
          <div className="stage-shell">
            <SceneBackdrop />
            <TopBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
