import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {source: '/terms', destination: '/regulamin', permanent: true},
      {source: '/policy', destination: '/rodo', permanent: true},
      {source: '/polityka-prywatnosci', destination: '/rodo', permanent: true},
    ];
  },
  serverExternalPackages: ['postgres', '@electric-sql/pglite'],
  // Recompile styles from source; persisted compiler output served stale CSS.
  experimental: {
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
