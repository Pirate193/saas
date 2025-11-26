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
    ],
  },
};

export default nextConfig;
