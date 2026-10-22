import type { MetadataRoute } from "next";

// Makes the site installable as a home-screen app (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Study Tracker",
    short_name: "Study",
    description: "Stay on track for your exams",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
