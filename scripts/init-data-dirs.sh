#!/bin/bash

# 数据目录初始化脚本

echo "正在创建数据目录..."

# 创建必要的目录
mkdir -p data/backups
mkdir -p public/uploads
mkdir -p data/temp

# 设置权限
chmod 755 data
chmod 755 data/backups
chmod 755 public/uploads
chmod 755 data/temp

echo "数据目录创建完成！"

# 创建 .gitkeep 文件确保空目录被包含在 git 中
touch data/.gitkeep
touch data/backups/.gitkeep
touch public/uploads/.gitkeep
touch data/temp/.gitkeep

echo "已创建 .gitkeep 文件。"

# 检查是否存在 .env 文件
if [ ! -f .env ]; then
    echo "警告：未找到 .env 文件，正在从 .env.example 复制..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "已从 .env.example 创建 .env 文件，请根据需要修改配置。"
    else
        echo "错误：未找到 .env.example 文件！"
        exit 1
    fi
fi

echo "初始化完成！"