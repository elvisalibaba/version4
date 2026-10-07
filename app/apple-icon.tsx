import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top right, rgba(248,198,207,0.28), transparent 24%), linear-gradient(135deg, #0b1f3a 0%, #820b1f 52%, #820b1f 100%)",
          color: "#f8fafc",
          fontSize: 76,
          fontWeight: 800,
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.08em",
          borderRadius: 42,
        }}
      >
        HB
      </div>
    ),
    size,
  );
}
