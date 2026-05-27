import type { NextConfig } from 'next';
import { resolve } from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright'],
  turbopack: {
    root: resolve(import.meta.dirname),
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
};

export default nextConfig;
