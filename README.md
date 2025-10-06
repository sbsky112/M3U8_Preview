# M3U8 视频预览平台

基于 Next.js + Prisma + SQLite 构建的 M3U8 视频浏览和管理平台。

[![Docker](https://img.shields.io/badge/Docker-支持-2496ED?logo=docker&logoColor=white)](./DOCKER_DEPLOYMENT.md)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-自动构建-2088FF?logo=github-actions&logoColor=white)](./GITHUB_ACTIONS_DEPLOYMENT.md)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)

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
- ✅ **智能搜索和筛选**（标题搜索、分类、作者、时间筛选）🔍
- ✅ **优化的搜索体验**（自动/手动搜索模式，防抖优化）⚡
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
- **数据库**: SQLite + Prisma ORM
- **认证**: NextAuth.js
- **视频播放器**: DPlayer (支持 HLS)
- **UI 框架**: TailwindCSS

## 快速开始

> 💡 **快速部署：**
> - Docker 部署：查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 获取完整 Docker 部署指南
> - GitHub Actions 自动化部署：查看 [GITHUB_ACTIONS_DEPLOYMENT.md](./GITHUB_ACTIONS_DEPLOYMENT.md) 获取 CI/CD 配置指南
> - 传统部署：查看下方步骤

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env`：

\`\`\`bash
# Database (SQLite)
DATABASE_URL="file:./data/app.db"
BACKUP_DATABASE_URL="file:./data/app_backup.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
\`\`\`

生成 NEXTAUTH_SECRET：

\`\`\`bash
openssl rand -base64 32
\`\`\`

### 3. 设置数据库

使用 SQLite 数据库（无需额外安装）：

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
│   │   ├── videos/            # 视频管理 API
│   │   ├── admin/             # 管理员 API
│   │   └── backup/            # 备份恢复 API
│   ├── admin/                 # 管理后台页面
│   │   ├── page.tsx           # 管理首页
│   │   ├── users/             # 用户管理
│   │   ├── videos/            # 视频管理
│   │   ├── categories/        # 分类管理
│   │   └── settings/          # 系统设置
│   ├── auth/                  # 认证页面
│   │   ├── signin/           # 登录页
│   │   └── signup/           # 注册页
│   ├── videos/                # 视频相关页面
│   │   ├── page.tsx           # 视频列表页（支持搜索筛选）
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
│   ├── VideoCardWithThumbnail.tsx # 带封面的视频卡片
│   ├── Navbar.tsx            # 导航栏
│   └── BackupManager.tsx     # 备份管理组件
├── lib/                       # 工具库
│   ├── auth.ts               # NextAuth 配置
│   ├── prisma.ts             # Prisma 客户端
│   ├── video-search.ts       # 搜索逻辑
│   ├── thumbnail-cache.ts    # 缩略图缓存
│   └── backup-restore.ts     # 备份恢复功能
├── hooks/                     # 自定义 React Hooks
│   └── useVideoSearch.ts     # 视频搜索 Hook
├── scripts/                   # 脚本文件
│   ├── init-admin.js         # 初始化管理员
│   └── health-check.sh       # 健康检查脚本
├── data/                      # 数据目录
├── public/
│   └── uploads/              # 上传文件目录
├── prisma/
│   └── schema.prisma         # 数据库模型
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── docker-compose.yml        # Docker 配置
└── Dockerfile               # Docker 镜像配置
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

## 搜索和筛选功能 🔍

### 智能搜索体验

**优化的搜索行为：**

🔍 **自动搜索模式：**
- 搜索关键词输入（300ms 防抖，避免频繁请求）
- 初始页面加载自动显示所有视频

🚫 **手动搜索模式：**
- 精确搜索选项切换（需点击搜索按钮）
- 分类筛选框选择（需点击搜索按钮）
- 作者筛选框选择（需点击搜索按钮）
- 开始日期选择（需点击搜索按钮）
- 结束日期选择（需点击搜索按钮）

### 使用方法

**基本搜索：**
1. 在搜索框输入关键词 → 自动搜索（带防抖）
2. 可勾选"精确搜索"选项匹配完整标题
3. 点击"🔍 搜索"按钮应用筛选条件

**高级筛选：**
1. 点击"显示筛选"展开筛选面板
2. 设置筛选条件：
   - 视频分类
   - 视频作者
   - 时间范围（开始日期 - 结束日期）
3. 点击"✨ 应用筛选"按钮执行搜索
4. 可查看当前活动的筛选条件
5. 使用"清空全部"按钮重置所有筛选

**特点：**
- ✅ 减少不必要的API请求
- ✅ 更好的用户体验控制
- ✅ 符合用户操作习惯
- ✅ 支持多种筛选条件组合

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
- role: 用户角色（user/admin）
- createdAt: 创建时间
- updatedAt: 更新时间

### Video（视频）

- id: 视频唯一标识
- title: 视频标题
- description: 视频描述
- m3u8Url: M3U8 链接
- thumbnail: 封面图片链接（支持 Base64）
- duration: 视频时长（秒）
- author: 视频作者
- category: 视频分类
- userId: 上传用户 ID
- createdAt: 创建时间
- updatedAt: 更新时间

### Category（分类）

- id: 分类唯一标识
- name: 分类名称
- description: 分类描述
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

### 方式一：GitHub Actions 自动化部署（推荐）🚀

配置 GitHub Actions 实现自动化构建和部署：

1. **自动构建 Docker 镜像**：代码推送时自动构建
2. **推送到 GitHub Container Registry**：统一管理镜像
3. **自动部署到生产服务器**：SSH 连接服务器自动部署
4. **多版本标签支持**：支持版本管理和回滚

详细配置请查看：[GitHub Actions 部署指南](./GITHUB_ACTIONS_DEPLOYMENT.md)

### 方式二：Docker 部署 🐳

使用 Docker Compose 一键部署应用和 SQLite 数据库：

**1. 生成密钥**

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

**2. 创建环境变量文件**

创建 `.env` 文件（或修改 `.env.example`）：

```bash
DATABASE_URL="file:/app/data/app.db"
BACKUP_DATABASE_URL="file:/app/data/app_backup.db"
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL="http://localhost:3000"
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
- 使用 SQLite 数据库，数据持久化在 `./data` 目录
- 自动运行数据库迁移和初始化
- 自动创建默认管理员账号
- 支持备份和恢复功能

**自定义配置：**

修改 `docker-compose.yml` 中的环境变量：
- `DATABASE_URL`: SQLite 数据库路径
- `BACKUP_DATABASE_URL`: 备份数据库路径
- `NEXTAUTH_URL`: 应用访问地址（生产环境需修改）
- `NEXTAUTH_SECRET`: NextAuth 密钥

### 方式三：传统部署

**构建生产版本**

\`\`\`bash
npm run build
npm start
\`\`\`


### 环境变量配置

确保在生产环境中配置以下环境变量：

- `DATABASE_URL`: SQLite 数据库文件路径
- `BACKUP_DATABASE_URL`: 备份数据库文件路径
- `NEXTAUTH_URL`: 应用的 URL
- `NEXTAUTH_SECRET`: NextAuth 密钥（使用 `openssl rand -base64 32` 生成）

## 注意事项

1. **CORS 问题**: 如果 M3U8 视频源有 CORS 限制，可能需要配置代理
2. **视频格式**: 仅支持 HLS (M3U8) 格式
3. **封面提取**: 使用客户端提取，无需服务器端 ffmpeg 支持
4. **性能优化**:
   - 使用 SQLite 数据库，适合中小规模应用
   - 内置双层缓存系统，优化访问速度
   - 智能搜索防抖，减少服务器负载
5. **数据备份**: 支持数据库备份和恢复功能

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
