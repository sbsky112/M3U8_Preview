# 多阶段构建 Dockerfile for M3U8 视频预览平台 (SQLite版本)

# 阶段 1: 依赖安装
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl sqlite
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# 阶段 2: 构建应用
FROM node:18-alpine AS builder
WORKDIR /app

# 安装 SQLite 和必要的系统依赖
RUN apk add --no-cache openssl sqlite

# 设置默认数据库URL（SQLite）
ENV DATABASE_URL="file:./data/app.db"
ENV BACKUP_DATABASE_URL="file:./data/app_backup.db"

# 复制源代码（包括 Prisma schema）
COPY . .

# 安装所有依赖（包括开发依赖）
RUN npm install

# 生成 Prisma Client
RUN npx prisma generate

# 设置环境变量并构建
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# 阶段 3: 生产运行
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 安装必要的系统依赖，包括 SQLite
RUN apk add --no-cache openssl sqlite

# 创建数据目录
RUN mkdir -p /app/data /app/data/backups

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 复制构建产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制 Prisma schema 和生成的 client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# 复制初始化脚本及其依赖
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# 使用 root 用户运行（避免权限问题）
# USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL="file:./data/app.db"
ENV BACKUP_DATABASE_URL="file:./data/app_backup.db"

CMD ["node", "server.js"]
