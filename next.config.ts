import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["yjs","pdf-parse"],
  //  typescript: {
  //       // !! WARN !!
  //       // Dangerously allow production builds to successfully complete even if
  //       // your project has type errors. 
  //       // !! WARN !!
  //       ignoreBuildErrors: true,
  //     },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "silent-goose-685.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "pub-ea88a79c86c64be79203c8b58477289d.r2.dev",
      },

    ],
  },
};

export default nextConfig;
