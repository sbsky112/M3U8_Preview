# M3U8 视频预览平台

基于 Next.js + Prisma + PostgreSQL 构建的 M3U8 视频浏览和管理平台。

[![Docker](https://img.shields.io/badge/Docker-支持-2496ED?logo=docker&logoColor=white)](./DOCKER_DEPLOYMENT.md)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 功能特性

### 核心功能
- ✅ **Docker 一键部署**（包含数据库和应用）🐳
- ✅ 用户认证系统（注册/登录）
- ✅ **管理员系统**（后台管理、用户管理、权限控制）🛡️
- ✅ **视频批量管理**（批量删除、批量修改分类）📦
- ✅ DPlayer 播放器集成，支持 M3U8 视频播放
- ✅ 视频管理（上传、编辑、删除）
- ✅ 批量导入视频功能

### 高级功能
- ✅ **作者和分类系统**（自动识别作者、分类管理）🏷️
- ✅ **搜索和筛选**（标题搜索、分类、作者、时间筛选）🔍
- ✅ **客户端视频封面提取**（无需服务端 ffmpeg）
- ✅ **智能缓存系统**（双层缓存，二次访问 < 50ms）⚡
- ✅ **首页自动提取封面**（自动提取并缓存）
- ✅ 实时封面预览和自定义提取时间点
- ✅ **多种布局选择**（2-6列灵活布局）📱
- ✅ 响应式设计，支持移动端和桌面端
- ✅ 美观的现代化 UI 和流畅动画效果
- ✅ 视频列表分页

## 技术栈

- **前端**: Next.js 14 (App Router), React 18, TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js
- **视频播放器**: DPlayer (支持 HLS)
- **UI 框架**: TailwindCSS

## 快速开始

> 💡 **快速部署：** 
> - Docker 部署：查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 获取完整 Docker 部署指南
> - 传统部署：查看下方步骤或 [QUICK_START.md](./QUICK_START.md)

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env`：

\`\`\`bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/m3u8_preview?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
\`\`\`

生成 NEXTAUTH_SECRET：

\`\`\`bash
openssl rand -base64 32
\`\`\`

### 3. 设置数据库

确保 PostgreSQL 已安装并运行，然后执行：

\`\`\`bash
# 初始化 Prisma
npx prisma generate

# 创建数据库表并初始化默认管理员
npm run db:push
\`\`\`

这会自动：
1. 创建数据库表结构
2. 创建默认管理员账号（admin / admin123）

你会看到类似输出：
\`\`\`
✅ 默认管理员账号已创建
   账号: admin
   密码: admin123
⚠️  重要提示：首次登录后请立即修改密码！
\`\`\`

可选命令：
\`\`\`bash
# 单独运行数据库初始化
npm run db:seed

# 使用 Prisma Studio 查看数据库
npm run db:studio
\`\`\`

### 4. 运行开发服务器

\`\`\`bash
npm run dev
\`\`\`

打开 [http://localhost:3000](http://localhost:3000) 访问应用。

### 5. 使用默认管理员登录

默认管理员账号已在步骤3中创建：

```
账号: admin
密码: admin123
```

⚠️ **重要：** 首次登录后请立即修改密码！

点击导航栏的"修改密码"即可修改。

详细说明：[默认管理员文档](./docs/DEFAULT_ADMIN.md)

## 项目结构

\`\`\`
m3u8_preview/
├── app/
│   ├── api/                    # API 路由
│   │   ├── auth/              # 认证相关 API
│   │   └── videos/            # 视频管理 API
│   ├── auth/                  # 认证页面
│   │   ├── signin/           # 登录页
│   │   └── signup/           # 注册页
│   ├── videos/                # 视频相关页面
│   │   ├── [id]/             # 视频详情页
│   │   ├── upload/           # 上传视频页
│   │   └── batch-import/     # 批量导入页
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页
│   ├── providers.tsx         # 全局 Providers
│   └── globals.css           # 全局样式
├── components/                # React 组件
│   ├── VideoPlayer.tsx       # 视频播放器
│   ├── VideoCard.tsx         # 视频卡片
│   └── Navbar.tsx            # 导航栏
├── lib/                       # 工具库
│   ├── auth.ts               # NextAuth 配置
│   └── prisma.ts             # Prisma 客户端
├── prisma/
│   └── schema.prisma         # 数据库模型
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
\`\`\`

## 使用说明

### 管理员登录

**默认管理员账号（自动创建）：**
- 账号：`admin`
- 密码：`admin123`

**首次使用建议：**
1. 使用默认账号登录
2. 立即点击"修改密码"修改默认密码
3. 访问管理后台查看系统统计

### 注册和登录

1. 普通用户可以注册新账号
2. 使用邮箱和密码登录
3. 登录后才能访问视频内容

### 修改密码

**所有用户都可以修改密码：**
1. 登录后点击导航栏的"修改密码"
2. 输入当前密码
3. 输入新密码（至少6位）
4. 确认新密码并提交

### 管理员功能

**管理后台：**
- 访问路径：导航栏 → 管理后台
- 查看系统统计（用户数、视频数等）
- 管理所有用户
- 查看和管理所有视频

**用户管理：**
- 查看所有用户列表
- 删除普通用户（不能删除管理员）
- 查看用户上传的视频数量

**视频管理：**
- 编辑任意视频（普通用户只能编辑自己的）
- 删除任意视频
- 查看所有视频统计

### 上传视频

1. 点击导航栏的"上传视频"
2. 填写视频标题和 M3U8 链接
3. （可选）添加视频描述和封面图片
4. 点击"上传视频"按钮

### 批量导入视频

1. 点击导航栏的"批量导入"
2. 按照格式输入视频信息：
   \`\`\`
   标题|M3U8链接|封面链接（可选）|描述（可选）
   \`\`\`
3. 每行一个视频
4. 点击"批量导入"按钮

### 播放视频

1. 在视频列表中点击任意视频卡片
2. 进入视频详情页自动加载播放器
3. 使用 DPlayer 的控制栏进行播放控制

## 封面提取功能 🎬

**最新版本使用客户端封面提取**，无需服务端 ffmpeg 支持！

### 特点
- ✅ **纯客户端实现** - 使用 HTML5 Video API 和 HLS.js
- ✅ **实时预览** - 提取后立即显示封面
- ✅ **自定义时间点** - 可选择从视频任意时间提取
- ✅ **Base64 存储** - 直接保存到数据库
- ✅ **跨浏览器兼容** - 支持现代浏览器

### 使用方法

**在上传页面：**
1. 输入 M3U8 视频链接
2. 设置提取时间点（默认 1 秒）
3. 点击"提取封面"按钮
4. 预览并使用提取的封面

**编程方式：**
```typescript
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

// 从视频第 1 秒提取封面
const thumbnail = await extractM3U8Thumbnail('https://example.com/video.m3u8', 1)
// 返回 Base64 编码的图片
```

详细文档：[docs/THUMBNAIL_EXTRACTION.md](./docs/THUMBNAIL_EXTRACTION.md)

## 数据库模型

### User（用户）

- id: 用户唯一标识
- email: 邮箱（唯一）
- name: 用户名
- password: 加密密码
- role: 用户角色
- createdAt: 创建时间
- updatedAt: 更新时间

### Video（视频）

- id: 视频唯一标识
- title: 视频标题
- description: 视频描述
- m3u8Url: M3U8 链接
- thumbnail: 封面图片链接
- duration: 视频时长（秒）
- userId: 上传用户 ID
- createdAt: 创建时间
- updatedAt: 更新时间

## API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/[...nextauth]` - NextAuth 认证

### 视频接口

- `GET /api/videos` - 获取视频列表
- `POST /api/videos` - 创建视频
- `GET /api/videos/[id]` - 获取视频详情
- `PUT /api/videos/[id]` - 更新视频
- `DELETE /api/videos/[id]` - 删除视频
- `POST /api/videos/batch` - 批量导入视频
- `POST /api/videos/thumbnail` - 提取视频封面

## 部署

### 方式一：Docker 部署（推荐） 🐳

使用 Docker Compose 一键部署应用和数据库：

**1. 生成密钥**

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

**2. 创建环境变量文件**

创建 `.env` 文件（或修改 `.env.example`）：

```bash
NEXTAUTH_SECRET=your-generated-secret-here
```

**3. 启动服务**

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷（会清空数据库）
docker-compose down -v
```

**4. 访问应用**

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**Docker 部署说明：**
- 应用运行在端口 `3000`
- PostgreSQL 运行在端口 `5432`
- 数据持久化在 Docker volume `postgres_data`
- 自动运行数据库迁移和初始化
- 自动创建默认管理员账号

**自定义配置：**

修改 `docker-compose.yml` 中的环境变量：
- `POSTGRES_USER`: 数据库用户名
- `POSTGRES_PASSWORD`: 数据库密码
- `POSTGRES_DB`: 数据库名称
- `NEXTAUTH_URL`: 应用访问地址（生产环境需修改）

### 方式二：传统部署

**构建生产版本**

\`\`\`bash
npm run build
npm start
\`\`\`

### 方式三：部署到 Vercel

> 📖 **详细指南**: 查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 获取完整 Vercel 部署指南

**快速步骤：**

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（**重要！**）:
   ```bash
   DATABASE_URL=你的PostgreSQL连接字符串
   NEXTAUTH_URL=https://your-project-name.vercel.app  # 必须是实际域名！
   NEXTAUTH_SECRET=运行 openssl rand -base64 32 生成
   ```
4. 连接 PostgreSQL 数据库（推荐使用 Vercel Postgres、Supabase 或 Railway）
5. 部署
6. 运行数据库初始化（见 VERCEL_DEPLOYMENT.md）

**⚠️ 常见错误：**
- `404 NOT_FOUND`: 检查 `NEXTAUTH_URL` 是否设置为正确的 Vercel 域名（不是 localhost）
- 无法登录: 检查 `NEXTAUTH_SECRET` 是否设置

### 环境变量配置

确保在生产环境中配置以下环境变量：

- `DATABASE_URL`: PostgreSQL 连接字符串
- `NEXTAUTH_URL`: 应用的 URL
- `NEXTAUTH_SECRET`: NextAuth 密钥（使用 `openssl rand -base64 32` 生成）

## 注意事项

1. **CORS 问题**: 如果 M3U8 视频源有 CORS 限制，可能需要配置代理
2. **视频格式**: 仅支持 HLS (M3U8) 格式
3. **封面提取**: 完整的封面提取功能需要服务器端 ffmpeg 支持
4. **性能优化**: 大量视频时建议添加缓存和 CDN

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
