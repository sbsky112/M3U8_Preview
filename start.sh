#!/bin/bash

echo "M3U8 视频预览平台 - 快速启动脚本 (SQLite版本)"
echo "=================================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误：未安装 Docker，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误：未安装 Docker Compose，请先安装 Docker Compose"
    exit 1
fi

# 初始化数据目录
echo "正在初始化数据目录..."
./scripts/init-data-dirs.sh

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "正在创建 .env 文件..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "已从 .env.example 创建 .env 文件"

        # 生成随机密钥
        if command -v openssl &> /dev/null; then
            SECRET=$(openssl rand -base64 32)
            sed -i "s/your-generated-secret-here/$SECRET/" .env
            echo "已生成随机 NEXTAUTH_SECRET"
        fi
    else
        echo "错误：未找到 .env.example 文件"
        exit 1
    fi
fi

echo "正在构建并启动 Docker 容器..."
docker-compose up -d --build

# 等待容器启动
echo "等待应用启动..."
sleep 10

# 检查容器状态
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ 应用启动成功！"
    echo ""
    echo "访问地址：http://localhost:3000"
    echo "默认管理员账号：admin"
    echo "默认管理员密码：admin123"
    echo ""
    echo "备份管理页面：http://localhost:3000/admin/backup"
    echo ""
    echo "常用命令："
    echo "  查看日志：docker-compose logs -f"
    echo "  停止应用：docker-compose down"
    echo "  重启应用：docker-compose restart"
    echo ""
else
    echo ""
    echo "❌ 应用启动失败，请检查日志："
    echo "docker-compose logs"
fi