/** @type {import('next').NextConfig} */

const API_URL = 'http://fastapi:8000';

const nextConfig = {
  reactStrictMode: true,
  // output: 'export',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // match any path under /api and proxy to the FastAPI service
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;