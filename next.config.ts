import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['postgres', '@electric-sql/pglite'],
  // Recompile styles from source; persisted compiler output served stale CSS.
  experimental: {
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
