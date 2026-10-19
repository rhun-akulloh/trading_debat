import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a small self-contained server (.next/standalone) — used by the Docker image.
  output: "standalone",
  images: {
    // Uploaded product photos live in Vercel Blob or Google Cloud Storage.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
