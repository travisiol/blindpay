import { ImageResponse } from "next/og";
import { markDataUri } from "@/lib/mark";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

/** The mark on the void. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060607",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri("#f0f2f5")} alt="" width={216} height={119} />
      </div>
    ),
    { ...size },
  );
}
