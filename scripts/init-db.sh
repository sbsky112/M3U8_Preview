#!/bin/bash

# 数据库初始化脚本
# 用于解决 PostgreSQL 权限问题

echo "🔧 正在初始化数据库权限..."

# 从 DATABASE_URL 提取连接信息
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

# 解析 DATABASE_URL
# 格式: postgresql://username:password@host:port/database
PROTO=$(echo "$DATABASE_URL" | sed -n 's|^\(.*\)://.*|\1|p')
USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*:[^@]*@\([^:]*\):.*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)\/.*|\1|p')
DATABASE=$(echo "$DATABASE_URL" | sed -n 's|.*\/\([^?]*\).*|\1|p')

echo "📊 数据库信息:"
echo "   主机: $HOST"
echo "   端口: $PORT"
echo "   数据库: $DATABASE"
echo "   用户: $USER"

# 使用 psql 设置权限
export PGPASSWORD="$PASSWORD"

echo ""
echo "🔐 正在设置数据库权限..."

# 1. 连接到数据库并设置权限
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" << EOF
-- 授予创建表的权限
GRANT CREATE ON SCHEMA public TO $USER;

-- 授予所有表的操作权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $USER;

-- 授予所有序列的操作权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $USER;

-- 设置默认权限，以便将来创建的表也有正确权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $USER;

-- 显示当前权限
SELECT 
    schemaname,
    tablename,
    tableowner,
    has_table_privilege($USER, tablename, 'SELECT') as can_select,
    has_table_privilege($USER, tablename, 'INSERT') as can_insert,
    has_table_privilege($USER, tablename, 'UPDATE') as can_update,
    has_table_privilege($USER, tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库权限设置成功!"
else
    echo ""
    echo "❌ 数据库权限设置失败!"
    echo ""
    echo "💡 可能的解决方案:"
    echo "   1. 检查数据库用户名和密码是否正确"
    echo "   2. 确保数据库用户有足够的权限"
    echo "   3. 尝试使用 postgres 超级用户执行此脚本"
    echo "   4. 检查数据库服务器是否允许连接"
    exit 1
fi

echo ""
echo "🎉 数据库初始化完成!"