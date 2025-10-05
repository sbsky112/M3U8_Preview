# Docker 部署指南

本文档提供了使用 Docker 部署 M3U8 视频预览平台的完整指南，使用外部 PostgreSQL 数据库。

## 前提条件

- 已安装 Docker
- 已安装 Docker Compose
- 已有可用的 PostgreSQL 数据库（外部）

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
# 外部 PostgreSQL 数据库连接

# 使用主机网络模式，直接连接主机上的数据库
DATABASE_URL="postgresql://video:jZixWkjHLW2cLwnN@localhost:5432/video?schema=public"

# 如果 PostgreSQL 运行在其他服务器上，使用实际 IP 或域名：
# DATABASE_URL="postgresql://video:jZixWkjHLW2cLwnN@server-ip:5432/video?schema=public"

# 应用端口配置（可选，默认为 3000）
APP_PORT=3000

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=your-generated-secret-here
```

**重要：**
- 当前配置使用主机网络模式，容器直接使用主机的网络栈
- 可以使用 `localhost` 连接主机上的数据库，避免权限问题
- `APP_PORT` 是可选的，用于指定应用在主机上监听的端口（默认为 3000）
- `NEXTAUTH_URL` 会自动根据 `APP_PORT` 设置，通常不需要手动修改

### 3. 初始化数据库权限（可选）

如果遇到数据库权限问题，可以运行以下脚本初始化权限：

```bash
# 确保已设置 DATABASE_URL 环境变量
# 运行数据库权限初始化脚本
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

或者手动在 PostgreSQL 中设置权限：

```sql
-- 以 postgres 用户登录
psql -U postgres -d video

-- 授予权限
GRANT CREATE ON SCHEMA public TO video;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO video;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO video;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO video;
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

### Next.js 应用

- 容器名：`m3u8_app`
- 端口：`3000`
- 网络：使用主机网络模式 (host)
- 自动运行数据库迁移和初始化
- 自动创建默认管理员账号
- 连接到外部 PostgreSQL 数据库

**注意**：使用主机网络模式可以让容器直接访问主机上的数据库，避免权限问题。

## 自定义配置

### 数据库连接配置

在 `.env` 文件中设置您的数据库连接：

```bash
# 格式：postgresql://用户名:密码@主机:端口/数据库名?schema=public
DATABASE_URL="postgresql://myuser:mypassword@db.example.com:5432/myapp?schema=public"
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

### 数据库连接问题

如果应用无法连接到外部数据库，检查：

1. 应用容器是否正常运行：
   ```bash
   docker compose ps
   ```

2. 查看应用日志：
   ```bash
   docker compose logs app
   ```

3. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确

4. 确保外部数据库可以从 Docker 容器访问：
   ```bash
   # 测试数据库连接
   docker compose exec app npx prisma db pull
   ```

### 数据库权限问题

如果遇到 `permission denied for schema public` 或 `ERROR: permission denied for schema public` 错误：

1. **检查数据库用户权限**：
  - 确保数据库用户具有创建表的权限
  - 使用具有足够权限的用户（如 postgres 超级用户）进行初始化

2. **手动授予权限**：
  ```sql
  -- 以 postgres 用户登录 PostgreSQL
  psql -U postgres -d video
  
  -- 授予权限
  GRANT CREATE ON SCHEMA public TO video;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO video;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO video;
  
  -- 设置默认权限
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO video;
  ```

3. **使用超级用户初始化**：
  - 临时使用 postgres 超级用户进行初始化
  - 初始化完成后可以切换回普通用户

4. **检查数据库所有者**：
  ```sql
  -- 检查数据库所有者
  SELECT datname, datdba, (SELECT rolname FROM pg_roles WHERE oid = datdba) AS owner
  FROM pg_database WHERE datname = 'video';
  
  -- 如果需要，更改数据库所有者
  ALTER DATABASE video OWNER TO video;
  ```

### 端口冲突

如果端口被占用，修改 `docker-compose.yml` 中的端口映射。

### 网络连接问题

如果 Docker 容器无法访问外部数据库：

1. 检查防火墙设置
2. 确保数据库允许来自 Docker 网络的连接
3. 验证数据库主机名和端口是否正确

#### 连接主机上的 PostgreSQL

使用主机网络模式连接主机上的 PostgreSQL：

1. **优势**：
   - 容器直接使用主机的网络栈
   - 可以使用 `localhost` 连接主机上的数据库
   - 避免了网络权限问题，特别适合宝塔面板等环境

2. **配置说明**：
   - 使用 `network_mode: host` 配置
   - 数据库连接使用 `localhost` 而不是特殊主机名
   - 适用于宝塔面板等环境创建的数据库用户

3. **测试连接**：
   ```bash
   # 在容器内测试连接
   docker compose exec app npx prisma db pull
   ```

4. **注意事项**：
   - 容器将直接绑定到主机的端口
   - 确保主机上的端口没有被其他服务占用
   - 适用于单主机部署场景

## 生产环境部署

### 安全建议

1. 使用强密码作为 `NEXTAUTH_SECRET`
2. 设置正确的 `NEXTAUTH_URL` 为实际域名
3. 考虑使用 HTTPS
4. 确保外部数据库连接使用 SSL

### 性能优化

1. 配置适当的资源限制
2. 优化外部 PostgreSQL 配置
3. 考虑使用连接池

### 备份策略

定期备份外部 PostgreSQL 数据（请参考您的数据库提供商的文档）。

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