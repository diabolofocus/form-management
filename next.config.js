/** @type {import('next').NextConfig} */
const nextConfig = {
  // Point Next.js to the src directory
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Set the base path for the pages
  basePath: '/dashboard',
  // Configure the output directory for the build
  distDir: 'build',
  // Enable React strict mode
  reactStrictMode: true,
  // Configure webpack to handle the src directory
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    return config;
  },
  // Add any other Next.js configuration options here
};

module.exports = nextConfig;
