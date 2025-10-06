#!/bin/bash

# GitHub Actions 快速配置脚本

set -e

echo "🚀 配置 GitHub Actions 自动部署..."

# 检查是否已配置 Git 远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "❌ 错误：未找到 Git 远程仓库"
    echo "请先配置远程仓库："
    echo "git remote add origin https://github.com/username/yourrepository.git"
    exit 1
fi

# 获取仓库信息
REPO_URL=$(git remote get-url origin)
echo "📁 当前仓库：$REPO_URL"

# 提取仓库名称
if [[ $REPO_URL =~ github\.com[/:](.+)\.git$ ]]; then
    REPO_NAME="${BASH_REMATCH[1]}"
    echo "📦 仓库名称：$REPO_NAME"

    # 更新 docker-compose.prod.yml 中的镜像名称
    if [ -f "docker-compose.prod.yml" ]; then
        sed -i "s|ghcr.io/\${{github.repository}}:latest|ghcr.io/$REPO_NAME:main|g" docker-compose.prod.yml
        echo "✅ 已更新 docker-compose.prod.yml 中的镜像名称"
    fi
else
    echo "⚠️  警告：无法自动解析仓库名称，请手动更新配置文件"
fi

# 检查 GitHub Actions 工作流文件
if [ -f ".github/workflows/docker.yml" ]; then
    echo "✅ GitHub Actions 工作流文件已存在"
else
    echo "❌ 错误：未找到 GitHub Actions 工作流文件"
    exit 1
fi

# 生成 SSH 密钥配置说明
echo ""
echo "🔐 SSH 密钥配置说明："
echo "1. 生成 SSH 密钥对："
echo "   ssh-keygen -t rsa -b 4096 -C 'github-actions' -f ~/.ssh/github_actions_key"
echo ""
echo "2. 在服务器上配置公钥："
echo "   cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/github_actions_key"
echo "   chmod 700 ~/.ssh"
echo ""
echo "3. 在 GitHub 仓库中配置 Secrets："
echo "   - 进入 Settings → Secrets and variables → Actions"
echo "   - 添加以下 Secrets："
echo "     * SERVER_HOST: 服务器地址"
echo "     * SERVER_USERNAME: SSH 用户名"
echo "     * SERVER_SSH_KEY: 私钥文件内容"
echo ""

# 创建示例环境变量文件
if [ ! -f ".env.example" ]; then
    echo "📝 创建环境变量示例文件..."
    cat > .env.example << EOF
# 生产环境配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-generated-secret-here

# 数据库配置
DATABASE_URL="file:./data/app.db"
BACKUP_DATABASE_URL="file:./data/app_backup.db"

# 应用端口
APP_PORT=3000
EOF
    echo "✅ 已创建 .env.example 文件"
fi

# 验证文件权限
echo "🔐 设置文件权限..."
chmod +x scripts/deploy.sh
chmod +x scripts/setup-github-actions.sh

echo ""
echo "📋 下一步操作："
echo "1. 推送代码到 GitHub 以触发首次构建："
echo "   git add ."
echo "   git commit -m '配置 GitHub Actions 自动部署'"
echo "   git push origin main"
echo ""
echo "2. 在 GitHub 仓库页面查看 Actions 运行状态"
echo "3. 配置服务器 SSH 密钥（如果需要自动部署）"
echo "4. 在 GitHub 仓库设置中配置 Secrets"
echo ""

# 显示当前的配置文件内容
echo "📄 当前配置文件："
echo ""
echo "=== .github/workflows/docker.yml ==="
if [ -f ".github/workflows/docker.yml" ]; then
    head -20 .github/workflows/docker.yml
    echo "..."
fi
echo ""
echo "=== docker-compose.prod.yml ==="
if [ -f "docker-compose.prod.yml" ]; then
    head -15 docker-compose.prod.yml
    echo "..."
fi

echo ""
echo "🎉 GitHub Actions 配置完成！"
echo ""
echo "📖 详细文档："
echo "- GitHub Actions 部署指南: GITHUB_ACTIONS_DEPLOYMENT.md"
echo "- Docker 部署指南: DOCKER_DEPLOYMENT.md"