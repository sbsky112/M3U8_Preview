# 🔐 用户名登录更新

## ✅ 更新完成

系统已从**邮箱登录**改为**用户名登录**！

## 🎯 主要变更

### 1. 登录方式

**之前：**
```
邮箱: user@example.com
密码: ******
```

**现在：**
```
用户名: testuser
密码: ******
```

### 2. 注册表单

**之前：**
- 邮箱（必填）
- 用户名（可选）
- 密码

**现在：**
- 用户名（必填，3-20个字符）
- 昵称（可选）
- 密码

### 3. 默认管理员

**保持不变：**
```
用户名: admin
密码: admin123
```

## 📁 修改的文件

### 数据库

- `prisma/schema.prisma` - email → username
- `prisma/seed.ts` - 使用 username
- `prisma/migrations/change_email_to_username.sql` - 迁移脚本

### 认证系统

- `lib/auth.ts` - NextAuth 配置
- `app/api/auth/register/route.ts` - 注册 API
- `lib/init-admin.ts` - 管理员初始化

### 前端页面

- `app/auth/signin/page.tsx` - 登录页面
- `app/auth/signup/page.tsx` - 注册页面
- `components/Navbar.tsx` - 导航栏显示
- `app/admin/users/page.tsx` - 用户管理
- `app/api/admin/users/[id]/route.ts` - 用户 API

## 🚀 如何应用更新

### 选项 1: 全新安装（推荐）

如果你是全新安装或数据不重要：

```bash
# 1. 重置数据库
npx prisma db push --force-reset

# 2. 创建默认管理员
npm run db:seed

# 3. 启动应用
npm run dev
```

### 选项 2: 迁移现有数据

如果你已有用户数据，需要执行迁移：

```bash
# 1. 备份数据库（重要！）
pg_dump -U your_user -d your_database > backup.sql

# 2. 执行迁移脚本
psql -U your_user -d your_database -f prisma/migrations/change_email_to_username.sql

# 3. 重新生成 Prisma Client
npx prisma generate

# 4. 启动应用
npm run dev
```

详细步骤请查看 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

## 🎨 界面更新

### 登录页面

```
┌─────────────────────────────────┐
│       欢迎回来                   │
│   登录到 M3U8 视频平台           │
├─────────────────────────────────┤
│ ℹ️  默认管理员账号               │
│ 用户名: admin                   │
│ 密码: admin123                  │
├─────────────────────────────────┤
│ 用户名: [testuser]              │
│ 密码: [••••••••]                │
│                                 │
│      [登录]                      │
└─────────────────────────────────┘
```

### 注册页面

```
┌─────────────────────────────────┐
│       创建账号                   │
│   加入 M3U8 视频平台             │
├─────────────────────────────────┤
│ 用户名 *: [3-20个字符]          │
│ 昵称（可选）: [显示名称]        │
│ 密码: [至少6个字符]             │
│ 确认密码: [再次输入密码]        │
│                                 │
│      [注册]                      │
└─────────────────────────────────┘
```

### 用户管理页面

```
┌──────────────────────────────────────────┐
│ 用户           │ 角色    │ 视频数 │ 操作 │
├──────────────────────────────────────────┤
│ 系统管理员      │ 管理员  │ 0个    │      │
│ @admin         │ (禁用)  │        │      │
│ 默认管理员      │         │        │      │
├──────────────────────────────────────────┤
│ 测试用户        │ 普通用户│ 5个    │ 删除 │
│ @testuser      │         │        │      │
└──────────────────────────────────────────┘
```

## 🔍 功能验证

### 1. 测试登录

```bash
# 启动应用
npm run dev

# 访问 http://localhost:3000/auth/signin
# 使用：admin / admin123
```

### 2. 测试注册

```bash
# 访问 http://localhost:3000/auth/signup
# 填写：
# 用户名: testuser
# 昵称: 测试用户
# 密码: test123456
```

### 3. 测试用户管理

```bash
# 访问 http://localhost:3000/admin/users
# 查看用户列表，应显示用户名
```

## 📊 数据库变更

### User 表结构

**变更前：**
```sql
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,  -- 旧字段
  "name" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT DEFAULT 'user',
  ...
);
```

**变更后：**
```sql
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,  -- 新字段
  "name" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT DEFAULT 'user',
  ...
);
```

## ⚠️ 重要提示

### 1. 会话清理

更新后首次登录前，请清除浏览器 Cookie，因为旧的 session 可能还包含 email 字段。

### 2. 用户名规则

- 最少 3 个字符
- 最多 20 个字符
- 唯一（不可重复）
- 用于登录识别

### 3. 昵称（name）

- 可选字段
- 用于显示名称
- 如果未设置，显示用户名

## 🆘 常见问题

### Q1: 无法登录？

**解决：**
1. 清除浏览器 Cookie
2. 确认使用用户名而不是邮箱
3. 检查数据库是否已迁移

### Q2: 注册失败？

**可能原因：**
- 用户名已被占用
- 用户名太短（< 3个字符）
- 用户名太长（> 20个字符）

### Q3: 旧用户怎么办？

如果执行了迁移，旧用户的 email 会自动复制到 username 字段，可以使用原来的邮箱（现在作为用户名）登录。

例如：
- 原邮箱：`user@example.com`
- 现用户名：`user@example.com`（可以登录）
- 建议用户修改为简短的用户名

### Q4: 如何批量更新用户名？

```sql
-- 示例：将邮箱格式改为用户名格式
UPDATE "User" 
SET "username" = SPLIT_PART("username", '@', 1)
WHERE "username" LIKE '%@%';
```

## 📚 相关文档

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - 详细迁移指南
- **[README.md](./README.md)** - 项目文档
- **[INSTALLATION.md](./INSTALLATION.md)** - 安装指南

## 🎉 优势总结

### 1. 更简洁
```
admin     vs     admin@example.com
testuser  vs     test@test.com
```

### 2. 更友好
- 不需要记住完整邮箱
- 输入更快捷
- 更符合现代应用习惯

### 3. 更安全
- 邮箱不暴露在前端
- 用户隐私更好保护

### 4. 更灵活
- 用户名可以是任意字符
- 不受邮箱格式限制

---

**开始使用：**

```bash
# 全新安装
npm run db:push
npm run dev

# 访问 http://localhost:3000
# 登录：admin / admin123
```

祝使用愉快！🚀
