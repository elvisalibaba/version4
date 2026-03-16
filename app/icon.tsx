import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

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
          background:
            "radial-gradient(circle at top right, rgba(255,190,159,0.28), transparent 24%), linear-gradient(135deg, #18120d 0%, #24180f 52%, #472c1d 100%)",
          color: "#fff6ef",
          fontSize: 210,
          fontWeight: 800,
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.08em",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 400,
            height: 400,
            borderRadius: 120,
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,240,231,0.18)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.22) inset",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          }}
        >
          HB
        </div>
      </div>
    ),
    size,
  );
}
