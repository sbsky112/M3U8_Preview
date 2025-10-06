# GitHub Actions 部署指南

本指南详细说明如何使用 GitHub Actions 自动化构建和部署 M3U8 视频预览平台。

## 概述

项目已配置完整的 CI/CD 流水线，支持：
- 🔨 自动构建 Docker 镜像
- 📦 推送到 GitHub Container Registry
- 🚀 自动部署到生产服务器
- 🏷️ 多版本标签管理
- 🔄 缓存优化加速构建

## 工作流文件详解

### `.github/workflows/docker.yml`

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main, master ]        # 主分支推送时触发
    tags: [ 'v*' ]                   # 版本标签时触发
  pull_request:
    branches: [ main, master ]        # PR 到主分支时触发

env:
  REGISTRY: ghcr.io                  # GitHub Container Registry
  IMAGE_NAME: ${{ github.repository }} # 镜像名称

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write                # 推送镜像权限

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch        # 分支标签
          type=ref,event=pr           # PR 标签
          type=semver,pattern={{version}}     # 完整版本号
          type=semver,pattern={{major}}.{{minor}}  # 主次版本
          type=semver,pattern={{major}}         # 主版本
          type=sha,prefix={{branch}}-           # 分支+提交哈希
          type=raw,value=latest,enable={{is_default_branch}}  # 最新版本

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha          # 从 GitHub Actions 缓存恢复
        cache-to: type=gha,mode=max   # 保存到 GitHub Actions 缓存

  # 可选的自动部署步骤
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/m3u8_preview_mysql/M3U8_Preview
          git pull origin main
          docker-compose -f docker-compose.prod.yml down
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
          docker system prune -f
```

## 快速开始

### 1. 启用 GitHub Actions

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 如果是第一次使用，点击 "I understand my workflows, go ahead and enable them"

### 2. 配置仓库权限

确保仓库有正确的权限设置：

1. 进入 Settings → Actions → General
2. 在 "Workflow permissions" 下选择：
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 3. 触发自动构建

推送代码到主分支即可触发构建：

```bash
# 推送到主分支
git push origin main

# 或者创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

## 镜像标签说明

工作流会自动生成多种标签：

### 分支标签
- `ghcr.io/username/repo:main` - main 分支最新代码
- `ghcr.io/username/repo:master` - master 分支最新代码

### 版本标签
- `ghcr.io/username/repo:v1.2.3` - 完整版本号
- `ghcr.io/username/repo:v1.2` - 主次版本
- `ghcr.io/username/repo:v1` - 主版本

### 其他标签
- `ghcr.io/username/repo:latest` - 默认分支最新代码
- `ghcr.io/username/repo:main-a1b2c3d` - 分支+提交哈希
- `ghcr.io/username/repo:pr-123` - Pull Request 镜像

## 生产环境部署

### 方式一：使用自动化镜像（推荐）

1. **更新 docker-compose.prod.yml：**
   ```yaml
   services:
     app:
       image: ghcr.io/yourusername/yourrepository:main
       restart: unless-stopped
       environment:
         - NODE_ENV=production
         - DATABASE_URL=file:/app/data/app.db
         - NEXTAUTH_URL=${NEXTAUTH_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
       volumes:
         - ./data:/app/data
         - ./public/uploads:/app/public/uploads
   ```

2. **部署命令：**
   ```bash
   # 拉取最新镜像
   docker-compose -f docker-compose.prod.yml pull

   # 重启服务
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 方式二：自动部署（需配置 SSH）

#### 配置服务器端

1. **生成 SSH 密钥：**
   ```bash
   # 在本地或服务器上生成密钥
   ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

   # 这会生成：
   # ~/.ssh/github_actions_key     (私钥)
   # ~/.ssh/github_actions_key.pub (公钥)
   ```

2. **配置服务器授权：**
   ```bash
   # 将公钥添加到 authorized_keys
   cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

   # 设置正确的权限
   chmod 600 ~/.ssh/github_actions_key
   chmod 600 ~/.ssh/github_actions_key.pub
   chmod 700 ~/.ssh
   ```

3. **测试 SSH 连接：**
   ```bash
   ssh -i ~/.ssh/github_actions_key user@your-server
   ```

#### 配置 GitHub Secrets

1. 进入 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"，添加：

   | Secret 名称 | 描述 | 示例值 |
   |------------|------|--------|
   | `SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` 或 `example.com` |
   | `SERVER_USERNAME` | SSH 用户名 | `root` 或 `ubuntu` |
   | `SERVER_SSH_KEY` | SSH 私钥内容 | 完整的私钥文件内容 |

   **注意：** `SERVER_SSH_KEY` 应包含完整的私钥内容，包括：
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ...私钥内容...
   -----END OPENSSH PRIVATE KEY-----
   ```

#### 自动部署流程

配置完成后，每次推送到主分支时会自动执行：

1. 构建 Docker 镜像
2. 推送到 GitHub Container Registry
3. SSH 连接到服务器
4. 拉取最新代码
5. 更新并重启服务
6. 清理未使用的 Docker 资源

## 监控和故障排除

### 查看构建状态

1. 进入 GitHub 仓库的 Actions 页面
2. 查看工作流运行历史
3. 点击具体的运行查看详细日志

### 常见问题

#### 1. 构建失败

**可能原因：**
- Dockerfile 语法错误
- 依赖项安装失败
- 构建超时

**解决方法：**
- 检查构建日志中的错误信息
- 本地测试 `docker build -t test .`
- 优化 Dockerfile，减少层数

#### 2. 镜像推送失败

**可能原因：**
- 权限不足
- 镜像太大
- 网络问题

**解决方法：**
- 确认仓库有写入权限
- 检查 GitHub Actions 权限设置
- 考虑使用多阶段构建减小镜像大小

#### 3. SSH 部署失败

**可能原因：**
- SSH 密钥配置错误
- 服务器连接失败
- 脚本执行错误

**解决方法：**
- 验证 SSH 密钥格式
- 测试服务器连通性
- 检查服务器上的脚本权限

### 调试技巧

#### 1. 本地模拟构建

```bash
# 构建镜像
docker build -t test-build .

# 测试运行
docker run -p 3000:3000 test-build
```

#### 2. 查看 GitHub Actions 缓存

```bash
# 查看缓存大小
gh api repos/:owner/:repo/actions/cache/list

# 删除缓存（如果需要）
gh api -X DELETE repos/:owner/:repo/actions/caches/:cache_id
```

#### 3. 手动触发工作流

```bash
# 创建测试分支
git checkout -b test-build
git push origin test-build

# 或者创建测试标签
git tag test-v1.0.0
git push origin test-v1.0.0
```

## 最佳实践

### 1. 版本管理

- 使用语义化版本标签（如 v1.0.0）
- 重要发布时创建 Git 标签
- 保留多个版本标签用于回滚

### 2. 安全考虑

- 定期轮换 SSH 密钥
- 限制 GitHub Actions 权限
- 使用最小权限原则

### 3. 性能优化

- 利用 Docker 层缓存
- 使用多阶段构建
- 适当设置 GitHub Actions 超时

### 4. 监控告警

- 设置构建失败通知
- 监控部署成功率
- 定期检查镜像大小

## 示例部署脚本

以下是完整的生产环境部署脚本示例：

```bash
#!/bin/bash
# deploy.sh - 生产环境部署脚本

set -e

echo "🚀 开始部署 M3U8 视频预览平台..."

# 配置变量
IMAGE_NAME="ghcr.io/yourusername/yourrepository"
TAG="main"
CONTAINER_NAME="m3u8_preview_app"

# 拉取最新镜像
echo "📦 拉取最新镜像..."
docker pull $IMAGE_NAME:$TAG

# 停止现有容器
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down || true

# 启动新服务
echo "🔄 启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 执行健康检查..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ 部署成功！"
else
    echo "❌ 健康检查失败"
    exit 1
fi

# 清理旧镜像
echo "🧹 清理未使用的镜像..."
docker image prune -f

echo "🎉 部署完成！"
```

## 总结

通过 GitHub Actions，我们实现了：

1. ✅ 移除了 Vercel 自动部署
2. ✅ 添加了 Docker 镜像自动构建
3. ✅ 配置了 GitHub Container Registry 推送
4. ✅ 支持多版本标签管理
5. ✅ 可选的自动部署到生产服务器
6. ✅ 完整的监控和故障排除方案

这个 CI/CD 流水线大大简化了部署流程，提高了开发效率和部署可靠性。