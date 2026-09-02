import { ImageResponse } from "next/og";
import { markDataUri } from "@/lib/mark";
import { siteConfig } from "@/lib/site-config";

export const alt = `An eye with a four-point spark for a pupil watching over a night desert, above the words: ${siteConfig.tagline.toLowerCase()}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          background: "#060607",
          backgroundImage:
            "radial-gradient(120% 80% at 50% 8%, rgba(29,243,55,0.10), transparent 60%), radial-gradient(90% 50% at 30% 100%, rgba(29,243,55,0.07), transparent 65%)",
          color: "#e8eaed",
          fontFamily: "sans-serif",
          padding: 64,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri("#f0f2f5")} alt="" width={520} height={286} />
        <div
          style={{
            display: "flex",
            fontSize: 58,
            letterSpacing: -1.5,
            textAlign: "center",
          }}
        >
          {siteConfig.tagline}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#7ee31f",
          }}
        >
          {siteConfig.name}
        </div>
      </div>
    ),
    { ...size },
  );
}
