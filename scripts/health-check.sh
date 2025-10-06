#!/bin/bash

# 健康检查脚本

# 检查应用是否响应
response=$(wget --spider -q -S "http://localhost:3000" 2>&1)
status_code=$(echo "$response" | grep "HTTP/" | awk '{print $2}')

if [ "$status_code" = "200" ]; then
    echo "Application is healthy"
    exit 0
else
    echo "Application is unhealthy (status: $status_code)"
    exit 1
fi