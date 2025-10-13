import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 确保React版本一致性
    reactCompiler: false,
  },
  // 确保开发和生产环境的一致性
  swcMinify: true,
  // 禁用React严格模式以避免开发/生产版本冲突
  reactStrictMode: false,
};

export default nextConfig;
