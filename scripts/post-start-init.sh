#!/bin/bash

# 容器启动后的初始化脚本

echo "等待应用启动..."
sleep 15

# 检查应用是否正常运行
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 应用启动成功"
else
    echo "❌ 应用启动失败"
    exit 1
fi

# 检查数据库文件是否存在
if [ -f "/app/data/app.db" ]; then
    echo "✅ SQLite 数据库已创建"
else
    echo "❌ SQLite 数据库未找到"
    exit 1
fi

echo "🎉 部署完成！"
echo ""
echo "访问地址："
echo "  应用主页: http://localhost:3000"
echo "  备份管理: http://localhost:3000/admin/backup"
echo ""
echo "👤 默认管理员账号："
echo "   用户名: admin"
echo "   密码: admin123"
echo "   ⚠️  请立即修改默认密码！"