import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow building without errors on unused vars during migration
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
}

export default nextConfig
