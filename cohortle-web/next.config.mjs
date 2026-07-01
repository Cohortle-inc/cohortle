/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow external images for programme thumbnails on the discover page
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Disable WebSocket connections in production to prevent localhost:8081 errors
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: undefined,
    // Disable HMR and fast refresh in production
    reactStrictMode: true,
  }),
  experimental: {
    // EMERGENCY: Completely disable all experimental features that might cause Server Action issues
    // serverActions are enabled by default in Next.js 14.2.31, but we need to ensure no conflicts
    // Optimize package imports - tree-shake large libraries
    optimizePackageImports: ['react-icons', 'framer-motion', '@headlessui/react', 'date-fns'],
    // Disable problematic features that might cause Server Action issues
    serverComponentsExternalPackages: [],
    // Force disable any caching that might interfere
    forceSwcTransforms: true,
  },
  // Force new build ID to prevent cache issues - AGGRESSIVE CACHE BUSTING
  generateBuildId: async () => {
    // Use timestamp + random + process ID to ensure absolutely unique builds
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const processId = process.pid || Math.floor(Math.random() * 10000);
    return `build-${timestamp}-${random}-${processId}`;
  },
  // Compiler optimizations
  compiler: {
    // Remove console logs in production (except errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Disable WebSocket connections in production builds
    if (!dev && !isServer) {
      // Remove any development WebSocket connections
      config.plugins = config.plugins || [];
      
      // Ensure no development WebSocket code is included
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent WebSocket connections in production
        'webpack-hot-middleware/client': false,
        'webpack/hot/dev-server': false,
      };
    }

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks for better caching
            default: false,
            vendors: false,
            // React and React-DOM in one chunk
            react: {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            // React Query in separate chunk
            reactQuery: {
              name: 'react-query',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },
            // UI libraries in separate chunk
            ui: {
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/](@headlessui|@heroicons|framer-motion)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Utilities in separate chunk
            utils: {
              name: 'utils-vendor',
              test: /[\\/]node_modules[\\/](axios|date-fns|clsx|dompurify)[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // Common code shared across pages
            common: {
              name: 'common',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // Add headers to prevent aggressive caching of JS chunks - EMERGENCY CACHE BUSTING
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Prevent caching of dynamic pages (dashboard, profile, convener pages)
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/convener/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/profile/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/programmes/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/lessons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
