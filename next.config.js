/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: true,
  output: 'standalone', // 启用 standalone 模式用于 Docker 部署
  // 禁用 API 路由的静态生成
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // 确保所有 API 路由都是动态的
  generateStaticParams: false,
  // 禁用静态生成
  trailingSlash: false,
  // 配置动态路由
  async rewrites() {
    return [];
  },
  // 确保所有页面都是动态的
  async generateBuildId() {
    return `build-${Date.now()}`;
  },
}

module.exports = nextConfig
