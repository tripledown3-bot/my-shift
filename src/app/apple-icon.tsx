import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2d5a3d 0%, #1f3f2a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 100, lineHeight: 1 }}>家</div>
        <div
          style={{
            fontSize: 24,
            marginTop: 6,
            letterSpacing: 4,
            opacity: 0.9,
          }}
        >
          シフト
        </div>
      </div>
    ),
    size
  );
}
