const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Only if you want to skip TS errors temporarily
  },
  // other configs...
};

export default nextConfig;
