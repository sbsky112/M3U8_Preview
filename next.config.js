/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: true,
  output: 'standalone', // 启用 standalone 模式用于 Docker 部署
}

module.exports = nextConfig
