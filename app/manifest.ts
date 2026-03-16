import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Holistique Books",
    short_name: "Holistique",
    description: "Lisez vos livres uniquement sur Holistique Books, sur le web ou dans l application.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f3ee",
    theme_color: "#17130f",
    categories: ["books", "education", "lifestyle"],
    lang: "fr",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
