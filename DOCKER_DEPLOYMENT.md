# Docker 部署指南 (SQLite版本)

本文档提供了使用 Docker 部署 M3U8 视频预览平台的完整指南，使用轻量化 SQLite 数据库，无需外部数据库服务。

## 前提条件

- 已安装 Docker
- 已安装 Docker Compose

## 版本特性

✅ **轻量化部署**：使用 SQLite 数据库，无需外部数据库服务
✅ **内置备份功能**：支持网站数据备份和恢复
✅ **数据持久化**：数据库和上传文件自动持久化
✅ **健康检查**：自动监控应用状态

## 快速开始

### 1. 生成密钥

首先生成一个 NextAuth 需要的密钥：

```bash
# Windows
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Mac/Linux
openssl rand -base64 32
```

### 2. 创建环境变量文件

创建 `.env` 文件（或修改 `.env.example`）：

```bash
# SQLite 数据库连接（使用默认值即可）
DATABASE_URL="file:./data/app.db"
BACKUP_DATABASE_URL="file:./data/app_backup.db"

# 应用端口配置（可选，默认为 3000）
APP_PORT=3000

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=your-generated-secret-here
```

**重要说明：**
- 使用 SQLite 数据库，无需外部数据库服务
- 数据库文件会自动创建并持久化到 `./data` 目录
- 备份文件会存储在 `./data/backups` 目录
- `APP_PORT` 用于指定应用在主机上监听的端口（默认为 3000）
- `NEXTAUTH_URL` 会自动根据 `APP_PORT` 设置

### 3. 创建数据目录

创建数据目录用于存储SQLite数据库和备份文件：

```bash
# 创建数据目录
mkdir -p data/backups
mkdir -p public/uploads
```

### 4. 启动服务

```bash
# 构建并启动应用
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 5. 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)（或您在 `APP_PORT` 中设置的端口）

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 服务说明

### Next.js 应用 (SQLite版本)

- 容器名：`m3u8_app`
- 端口：`3000`（映射到主机）
- 数据库：内置 SQLite 数据库
- 数据持久化：自动挂载 `./data` 目录
- 文件上传：自动挂载 `./public/uploads` 目录
- 自动运行数据库迁移和初始化
- 自动创建默认管理员账号
- 内置健康检查机制

**数据持久化说明：**
- 数据库文件：`./data/app.db`
- 备份文件：`./data/backups/`
- 上传文件：`./public/uploads/`

## 备份和恢复功能

### 创建备份

管理员可以通过API创建备份：

```bash
# 创建数据库备份
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"includeFiles": false}'

# 创建完整备份（包含文件）
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"fullBackup": true}'
```

### 查看备份列表

```bash
curl http://localhost:3000/api/backup
```

### 恢复备份

```bash
# 从备份恢复
curl -X POST http://localhost:3000/api/restore \
  -H "Content-Type: application/json" \
  -d '{"backupPath": "./data/backups/backup_2024-01-01.db", "includeFiles": false}'
```

## 自定义配置

### 数据库连接配置

SQLite 数据库配置（通常使用默认值即可）：

```bash
# 主数据库
DATABASE_URL="file:./data/app.db"

# 备份数据库
BACKUP_DATABASE_URL="file:./data/app_backup.db"
```

### 修改应用配置

在 `.env` 文件中修改应用环境变量：

```bash
NEXTAUTH_URL=http://your-domain.com  # 生产环境需要修改
NEXTAUTH_SECRET=your-secret-key
```

### 修改端口映射

有两种方式修改应用端口：

**方式一：使用环境变量（推荐）**

在 `.env` 文件中设置 `APP_PORT`：

```bash
APP_PORT=8080  # 应用将在主机的 8080 端口上运行
```

**方式二：直接编辑 docker-compose.yml**

```yaml
ports:
  - "8080:3000"  # 将主机的 8080 端口映射到容器的 3000 端口
```

**注意：** 使用环境变量方式更灵活，并且会自动更新 `NEXTAUTH_URL` 配置。

## 故障排除

### SQLite 数据库问题

如果应用无法启动或数据库有问题：

1. **检查应用容器状态**：
   ```bash
   docker compose ps
   ```

2. **查看应用日志**：
   ```bash
   docker compose logs app
   ```

3. **检查数据库文件权限**：
   ```bash
   ls -la ./data/
   ```

4. **重新初始化数据库**：
   ```bash
   # 停止容器
   docker compose down

   # 删除数据库文件（谨慎操作）
   rm ./data/app.db

   # 重新启动容器
   docker compose up -d --build
   ```

### 权限问题

如果遇到文件权限问题：

1. **修复数据目录权限**：
   ```bash
   sudo chown -R $USER:$USER ./data
   chmod -R 755 ./data
   ```

2. **修复上传目录权限**：
   ```bash
   sudo chown -R $USER:$USER ./public/uploads
   chmod -R 755 ./public/uploads
   ```

### 端口冲突

如果端口被占用，修改 `docker-compose.yml` 中的端口映射。

### 备份相关错误

如果备份功能遇到问题：

1. **检查备份目录权限**：
   ```bash
   ls -la ./data/backups/
   ```

2. **手动创建备份**：
   ```bash
   # 进入容器
   docker compose exec app sh

   # 创建备份
   cp /app/data/app.db /app/data/backups/manual_backup.db
   ```

## 生产环境部署

### 安全建议

1. 使用强密码作为 `NEXTAUTH_SECRET`
2. 设置正确的 `NEXTAUTH_URL` 为实际域名
3. 考虑使用 HTTPS
4. 定期备份 SQLite 数据库文件

### 性能优化

1. 配置适当的资源限制
2. 定期清理旧备份文件
3. 监控数据库文件大小

### 备份策略

SQLite 数据库备份建议：

1. **自动备份**：通过应用内的备份功能定期创建备份
2. **手动备份**：定期复制 `./data/app.db` 文件到安全位置
3. **远程备份**：将备份文件上传到云存储或其他安全位置

```bash
# 创建定时备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp "./data/app.db" "$BACKUP_DIR/auto_backup_$TIMESTAMP.db"
# 保留最近10个备份
cd "$BACKUP_DIR" && ls -t | tail -n +11 | xargs -r rm
EOF

chmod +x backup.sh

# 添加到 crontab（每天凌晨2点备份）
# 0 2 * * * /path/to/your/project/backup.sh
```

## 更新应用

更新应用版本：

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build
```

## 常见问题

### Q: 如何重置管理员密码？

A: 删除数据库中的管理员记录，然后重启容器：

```bash
# 连接到您的数据库并删除管理员记录
# 然后重启应用
docker compose restart app
```

系统会重新创建默认管理员账号。

### Q: 如何修改数据库模式？

A: 修改 `prisma/schema.prisma` 后，重新构建容器：

```bash
docker compose up -d --build
```

### Q: 如何查看数据库内容？

A: 使用 Prisma Studio：

```bash
docker compose exec app npx prisma studio --hostname 0.0.0.0
```

然后访问 [http://localhost:5555](http://localhost:5555)

### Q: 如何连接到云数据库服务？

A: 在 `.env` 文件中设置云数据库提供的连接字符串：

```bash
# 例如 AWS RDS PostgreSQL
DATABASE_URL="postgresql://username:password@your-rds-instance.region.rds.amazonaws.com:5432/dbname?schema=public"

# 例如 Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
```

### Q: 如何修改应用端口？

A: 有两种方式修改应用端口：

**方式一：使用环境变量（推荐）**

在 `.env` 文件中设置：
```bash
APP_PORT=8080
```

**方式二：直接编辑 docker-compose.yml**

修改端口映射：
```yaml
ports:
  - "8080:3000"
```

**注意：** 使用环境变量方式会自动更新 `NEXTAUTH_URL`，推荐使用这种方式。

### Q: 如何在同一台服务器上运行多个实例？

A: 为每个实例设置不同的端口：

```bash
# 实例 1
APP_PORT=3000

# 实例 2
APP_PORT=3001

# 实例 3
APP_PORT=3002
```

确保每个实例使用不同的数据库或数据库 schema。