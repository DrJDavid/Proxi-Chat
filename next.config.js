/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Add rule for .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    // Exclude sharp from being bundled on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        sharp: false,
      }
    }

    // Exclude scripts directory from the build
    config.module.rules.push({
      test: /scripts\/.+/,
      loader: 'ignore-loader',
    });

    return config
  },
}

module.exports = nextConfig 