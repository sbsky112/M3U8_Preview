# 项目升级指南：PostgreSQL → SQLite

## 概述

本项目已成功从 PostgreSQL 数据库迁移到轻量化的 SQLite 数据库，并增加了完整的备份和恢复功能。

## 主要变更

### 1. 数据库迁移
- **从 PostgreSQL 迁移到 SQLite**
- 无需外部数据库服务
- 大幅简化部署和维护

### 2. 新增功能
- ✅ **数据库备份功能**
- ✅ **完整网站备份（数据库+文件）**
- ✅ **备份管理和恢复功能**
- ✅ **备份文件管理界面**

### 3. Docker 优化
- 修复了 Docker 构建问题
- 优化了容器配置
- 添加了健康检查
- 数据持久化配置

## 技术变更详情

### 数据库配置
```prisma
// 之前
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 现在
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 环境变量
```bash
# 之前（PostgreSQL）
DATABASE_URL="postgresql://video:jZixWkjHLW2cLwnN@localhost:5432/video?schema=public"

# 现在（SQLite）
DATABASE_URL="file:./data/app.db"
BACKUP_DATABASE_URL="file:./data/app_backup.db"
```

### 新增文件
```
lib/backup-restore.ts          # 备份恢复核心功能
app/api/backup/route.ts        # 备份API接口
app/api/restore/route.ts       # 恢复API接口
components/BackupManager.tsx   # 备份管理前端组件
app/admin/backup/page.tsx      # 备份管理页面
scripts/init-data-dirs.sh      # 数据目录初始化脚本
scripts/health-check.sh        # 健康检查脚本
start.sh                       # 快速启动脚本
```

## 新增功能使用

### 1. 备份管理页面
访问：`http://localhost:3000/admin/backup`

功能：
- 创建数据库备份
- 创建完整备份（数据库+文件）
- 查看备份列表
- 删除备份
- 从备份恢复数据

### 2. API 接口

#### 创建备份
```bash
# 数据库备份
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"includeFiles": false}'

# 完整备份
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"fullBackup": true}'
```

#### 查看备份列表
```bash
curl http://localhost:3000/api/backup
```

#### 恢复备份
```bash
curl -X POST http://localhost:3000/api/restore \
  -H "Content-Type: application/json" \
  -d '{"backupPath": "./data/backups/backup_2024-01-01.db"}'
```

#### 删除备份
```bash
curl -X DELETE "http://localhost:3000/api/backup?path=./data/backups/backup_2024-01-01.db"
```

## 部署方式

### 快速启动
```bash
# 一键启动（推荐）
./start.sh
```

### 手动启动
```bash
# 1. 初始化数据目录
./scripts/init-data-dirs.sh

# 2. 构建并启动
docker-compose up -d --build

# 3. 查看状态
docker-compose ps
```

## 数据持久化

### Docker 挂载目录
- `./data` → `/app/data`（数据库和备份文件）
- `./public/uploads` → `/app/public/uploads`（上传文件）

### 备份文件位置
- 数据库备份：`./data/backups/backup_YYYY-MM-DD.db`
- 完整备份：包含配置和数据库文件

## 性能对比

| 特性 | PostgreSQL | SQLite |
|------|------------|---------|
| 部署复杂度 | 高（需要外部服务） | 低（文件数据库） |
| 资源占用 | 高 | 低 |
| 维护成本 | 高 | 低 |
| 备份复杂度 | 复杂 | 简单（文件复制） |
| 适合场景 | 大型企业应用 | 中小型应用 |

## 迁移注意事项

### 数据迁移
如果需要从现有的 PostgreSQL 数据库迁移：

1. 导出 PostgreSQL 数据
2. 转换为 SQLite 兼容格式
3. 导入到 SQLite 数据库

### 配置更新
- 更新 `.env` 文件中的数据库连接
- 更新 Docker 配置
- 重新生成 Prisma 客户端

## 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la ./data/app.db

# 重新初始化数据库
rm ./data/app.db
docker-compose restart
```

#### 2. 备份功能异常
```bash
# 检查备份目录权限
ls -la ./data/backups/

# 手动创建备份
docker-compose exec app cp /app/data/app.db /app/data/backups/manual.db
```

#### 3. Docker 构建失败
```bash
# 清理并重新构建
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

## 开发指南

### 本地开发
```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma db push
npm run db:seed

# 启动开发服务器
npm run dev
```

### 添加新的备份功能
在 `lib/backup-restore.ts` 中添加新功能：
1. 实现备份逻辑
2. 添加相应的 API 接口
3. 更新前端组件

## 安全建议

1. **定期备份**：设置自动备份脚本
2. **权限控制**：只有管理员可以访问备份功能
3. **备份存储**：将备份文件存储在安全位置
4. **密码保护**：使用强密码保护管理员账号

## 总结

通过这次升级，项目实现了：
- 🚀 **部署简化**：无需外部数据库服务
- 💾 **数据安全**：内置备份和恢复功能
- 🐳 **容器优化**：修复了 Docker 构建问题
- 📊 **功能增强**：提供了完整的备份管理界面

项目现在更适合中小型部署场景，大大降低了运维复杂度。