import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "komunikasi-app",
    name: "Komunikasi",
    short_name: "Komunikasi",
    description: "Platform pesan instan modern untuk kolaborasi tim.",
    icons: [
      {
        src: "/api/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: "#A855F7",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait",
  };
}
