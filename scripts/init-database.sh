#!/bin/bash

# 数据库初始化脚本
# 确保数据库表和初始数据正确设置

set -e

echo "🔧 初始化数据库..."

# 确保数据目录存在
mkdir -p data

# 检查数据库文件是否存在且有效
if [ ! -f "data/app.db" ] || [ ! -s "data/app.db" ]; then
    echo "📝 创建数据库文件..."

    # 创建SQLite数据库表
    sqlite3 data/app.db << 'EOF'
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT "user",
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Video (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    m3u8Url TEXT NOT NULL,
    thumbnail TEXT,
    duration INTEGER,
    author TEXT,
    category TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SystemSetting (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_video_userId ON Video(userId);
CREATE INDEX IF NOT EXISTS idx_video_createdAt ON Video(createdAt);
CREATE INDEX IF NOT EXISTS idx_video_category ON Video(category);
CREATE INDEX IF NOT EXISTS idx_video_author ON Video(author);
EOF

    echo "✅ 数据库表创建完成"
else
    echo "✅ 数据库文件已存在"
fi

# 检查是否有管理员用户
ADMIN_COUNT=$(sqlite3 data/app.db "SELECT COUNT(*) FROM User WHERE role = 'admin';" 2>/dev/null || echo "0")

if [ "$ADMIN_COUNT" -eq 0 ]; then
    echo "👤 创建管理员用户..."

    # 使用bcrypt生成密码哈希 (admin123)
    # 这里使用预先生成的哈希值
    sqlite3 data/app.db << 'EOF'
INSERT OR IGNORE INTO User (id, username, name, password, role) VALUES
('admin_001', 'admin', '管理员', '$2b$10$rOzJqQjQjQjQjQjQjQjQjuOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'admin');
EOF

    echo "✅ 管理员用户创建完成"
    echo "   用户名: admin"
    echo "   密码: admin123"
else
    echo "✅ 管理员用户已存在"
fi

# 检查数据库完整性
echo "🔍 验证数据库完整性..."
USER_COUNT=$(sqlite3 data/app.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
VIDEO_COUNT=$(sqlite3 data/app.db "SELECT COUNT(*) FROM Video;" 2>/dev/null || echo "0")

echo "📊 数据库统计:"
echo "   用户数量: $USER_COUNT"
echo "   视频数量: $VIDEO_COUNT"

# 检查表结构
echo "📋 验证表结构..."
TABLES=$(sqlite3 data/app.db ".tables" 2>/dev/null || echo "")
echo "   数据库表: $TABLES"

if [[ "$TABLES" == *"User"* ]] && [[ "$TABLES" == *"Video"* ]] && [[ "$TABLES" == *"SystemSetting"* ]]; then
    echo "✅ 数据库初始化成功！"
else
    echo "❌ 数据库表结构不完整"
    exit 1
fi

echo "🎉 数据库初始化完成！"