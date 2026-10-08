import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

/** Icône de l'application : la marque blanche sur le bleu du logo. */
export default async function Icon() {
  const mark = await readFile(join(process.cwd(), "public/brand/icon-white.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  const markHeight = Math.round(size.height * 0.62);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#506AFF",
        }}
      >
        <img src={src} alt="" height={markHeight} width={Math.round(markHeight * (484 / 658))} />
      </div>
    ),
    size,
  );
}
