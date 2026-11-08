import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@pathtrip/api-client'],
};

export default nextConfig;
