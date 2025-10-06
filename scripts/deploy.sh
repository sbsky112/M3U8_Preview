#!/bin/bash

# M3U8 视频预览平台 - 生产环境部署脚本

set -e

echo "🚀 开始部署 M3U8 视频预览平台..."

# 检查必要的环境变量
if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ 错误：请设置 NEXTAUTH_URL 环境变量"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ 错误：请设置 NEXTAUTH_SECRET 环境变量"
    exit 1
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p data
mkdir -p data/backups
mkdir -p public/uploads
mkdir -p ssl

# 设置权限
echo "🔐 设置目录权限..."
chmod 755 data
chmod 755 data/backups
chmod 755 public/uploads
chmod 700 ssl

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down || true

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ 服务启动成功！"
    echo "🌐 应用地址: $NEXTAUTH_URL"
else
    echo "❌ 服务启动失败，请检查日志："
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# 显示服务状态
echo "📊 当前服务状态："
docker-compose -f docker-compose.prod.yml ps

echo "🎉 部署完成！"