import type { MetadataRoute } from "next";

type WebAppManifest = MetadataRoute.Manifest & {
  id?: string;
  display_override?: Array<"standalone" | "minimal-ui" | "fullscreen" | "browser" | "window-controls-overlay">;
  launch_handler?: {
    client_mode?: "auto" | "focus-existing" | "navigate-existing" | "navigate-new";
  };
  prefer_related_applications?: boolean;
};

export default function manifest(): WebAppManifest {
  return {
    id: "/home",
    name: "Holistique Books",
    short_name: "Holistique",
    description: "Lisez vos livres sur Holistique Books dans une experience installee, rapide et optimisee pour Android.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f7f3ee",
    theme_color: "#17130f",
    categories: ["books", "education", "lifestyle"],
    lang: "fr",
    dir: "ltr",
    prefer_related_applications: false,
    launch_handler: {
      client_mode: "navigate-existing",
    },
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Accueil",
        short_name: "Accueil",
        description: "Ouvrir la page d accueil Holistique Books",
        url: "/home",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Librairie",
        short_name: "Librairie",
        description: "Parcourir les livres disponibles",
        url: "/books",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mon espace",
        short_name: "Espace",
        description: "Ouvrir votre espace lecteur ou auteur",
        url: "/dashboard",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
