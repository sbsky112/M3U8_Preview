# Vercel 部署指南

## 问题解决：404 NOT_FOUND

如果您在 Vercel 部署后遇到 `404: NOT_FOUND` 错误，请按照以下步骤操作。

## 🔧 快速修复

### 1. 修改环境变量（最重要！）

在 Vercel 项目设置中，修改 `NEXTAUTH_URL`：

❌ **错误配置：**
```
NEXTAUTH_URL=http://localhost:3000
```

✅ **正确配置：**
```
NEXTAUTH_URL=https://your-project-name.vercel.app
```

或者使用你的自定义域名：
```
NEXTAUTH_URL=https://your-custom-domain.com
```

### 2. 设置所有必需的环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```bash
# 数据库连接
DATABASE_URL=postgres://username:password@host:5432/database?sslmode=require

# NextAuth 配置（重要！）
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# Node 环境
NODE_ENV=production
```

### 3. 重新部署

修改环境变量后，触发重新部署：

1. 在 Vercel Dashboard 中点击 "Redeploy"
2. 或推送新的 commit 到 GitHub

## 📋 完整部署步骤

### 前提条件

- GitHub/GitLab/Bitbucket 账号
- Vercel 账号
- PostgreSQL 数据库（推荐 Vercel Postgres、Supabase 或 Railway）

### 步骤 1: 准备数据库

#### 选项 A: 使用 Vercel Postgres（推荐）

1. 在 Vercel 项目中，点击 "Storage" → "Create Database"
2. 选择 "Postgres"
3. 创建后，Vercel 会自动设置 `DATABASE_URL` 环境变量

#### 选项 B: 使用 Supabase

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 在 Settings → Database 中找到连接字符串
4. 格式：`postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require`

#### 选项 C: 使用 Railway

1. 访问 [Railway](https://railway.app/)
2. 创建 PostgreSQL 数据库
3. 复制数据库连接 URL

### 步骤 2: 推送代码到 Git

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 步骤 3: 在 Vercel 中导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 导入你的 Git 仓库
4. 选择项目

### 步骤 4: 配置环境变量

在部署前，点击 "Environment Variables" 添加：

```bash
DATABASE_URL=你的数据库连接字符串
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=运行 openssl rand -base64 32 生成
```

**重要提示：**
- `NEXTAUTH_URL` 必须是你的 Vercel 域名，不能是 localhost
- `NEXTAUTH_SECRET` 必须是强随机字符串
- 所有环境变量都需要设置

### 步骤 5: 部署

1. 点击 "Deploy"
2. 等待构建完成（约 2-3 分钟）
3. 构建成功后，访问分配的域名

### 步骤 6: 初始化数据库（重要！）

部署成功后，需要初始化数据库：

#### 方法 A: 使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 运行数据库初始化
vercel env pull .env.local
npm run db:seed
```

#### 方法 B: 本地连接生产数据库

```bash
# 设置生产数据库 URL
export DATABASE_URL="你的生产数据库URL"

# 运行迁移
npx prisma migrate deploy

# 运行种子数据
npm run db:seed
```

#### 方法 C: 使用 Prisma Studio

```bash
# 设置生产数据库 URL
export DATABASE_URL="你的生产数据库URL"

# 打开 Prisma Studio
npx prisma studio

# 手动创建管理员用户：
# - username: admin
# - password: $2a$10$... (使用 bcrypt 加密 "admin123")
# - role: admin
```

### 步骤 7: 验证部署

1. 访问你的 Vercel 域名
2. 应该会重定向到登录页面
3. 使用默认管理员账号登录：
   - 用户名：`admin`
   - 密码：`admin123`

## 🔍 常见问题排查

### 问题 1: 404 NOT_FOUND

**原因：**
- `NEXTAUTH_URL` 设置错误
- 环境变量未设置

**解决：**
1. 检查 Vercel 环境变量中的 `NEXTAUTH_URL`
2. 必须使用 HTTPS 和正确的域名
3. 重新部署

### 问题 2: Database connection failed

**原因：**
- `DATABASE_URL` 格式错误
- 数据库未允许 Vercel IP 访问

**解决：**
1. 检查数据库连接字符串格式
2. 确保添加 `?sslmode=require` 参数
3. 在数据库设置中允许所有 IP 或 Vercel IP 访问

### 问题 3: Prisma Client 未生成

**原因：**
- 构建过程中 Prisma generate 未运行

**解决：**
已在 `package.json` 中配置：
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

### 问题 4: 无法登录 / Session 错误

**原因：**
- `NEXTAUTH_SECRET` 未设置或太短
- `NEXTAUTH_URL` 不匹配

**解决：**
1. 生成强随机密钥：`openssl rand -base64 32`
2. 确保 `NEXTAUTH_URL` 与访问域名完全一致
3. 检查是否包含 `https://`

### 问题 5: 默认管理员不存在

**原因：**
- 数据库种子未运行

**解决：**
```bash
# 连接到生产数据库并运行种子
export DATABASE_URL="你的生产数据库URL"
npm run db:seed
```

## 🚀 生产环境优化

### 1. 自定义域名

1. 在 Vercel 项目设置中，点击 "Domains"
2. 添加你的域名
3. 更新 `NEXTAUTH_URL` 环境变量为新域名
4. 重新部署

### 2. 环境变量管理

为不同环境设置不同的变量：

- **Production**: 生产数据库
- **Preview**: 测试数据库（可选）
- **Development**: 本地数据库

### 3. 性能优化

在 `vercel.json` 中配置（可选）：

```json
{
  "regions": ["sin1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### 4. 监控和日志

1. 在 Vercel Dashboard 查看部署日志
2. 使用 "Analytics" 监控性能
3. 使用 "Logs" 查看运行时日志

## 📊 数据库迁移

### 更新数据库 Schema

当你修改了 `prisma/schema.prisma` 后：

```bash
# 1. 本地创建迁移
npx prisma migrate dev --name your_migration_name

# 2. 提交并推送
git add .
git commit -m "Add database migration"
git push

# 3. Vercel 会自动运行迁移（因为 build 脚本中包含 prisma migrate deploy）
```

### 手动运行迁移

如果需要手动运行：

```bash
# 使用 Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# 或直接连接生产数据库
DATABASE_URL="你的生产数据库URL" npx prisma migrate deploy
```

## 🔒 安全建议

1. **强密钥**: 使用 `openssl rand -base64 32` 生成 NEXTAUTH_SECRET
2. **环境隔离**: 不要在生产环境使用开发数据库
3. **修改默认密码**: 部署后立即修改 admin 密码
4. **HTTPS**: Vercel 自动提供 HTTPS
5. **环境变量**: 不要在代码中硬编码敏感信息

## 🔄 持续部署

推送到主分支会自动触发部署：

```bash
git push origin main
```

查看部署状态：
- Vercel Dashboard → Deployments
- GitHub/GitLab 中的 Checks

## 📝 检查清单

部署前确认：

- [ ] `DATABASE_URL` 已设置并可连接
- [ ] `NEXTAUTH_URL` 设置为正确的 Vercel 域名（包含 https://）
- [ ] `NEXTAUTH_SECRET` 已设置（至少 32 字符）
- [ ] 代码已推送到 Git
- [ ] 数据库迁移已运行
- [ ] 默认管理员已创建
- [ ] 可以成功登录

## 🆘 获取帮助

如果仍有问题：

1. 查看 Vercel 部署日志
2. 查看浏览器控制台错误
3. 检查所有环境变量
4. 在 GitHub Issues 中提问

## 📚 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [NextAuth.js Vercel 部署](https://next-auth.js.org/deployment#vercel)
- [Prisma Vercel 部署](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**祝您部署顺利！** 🚀
