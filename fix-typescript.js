#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 修复 TypeScript 和项目问题...\n');

// 1. 删除 .next 目录
console.log('1️⃣ 清理 .next 目录...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('   ✅ .next 目录已删除\n');
  } else {
    console.log('   ℹ️  .next 目录不存在\n');
  }
} catch (error) {
  console.log('   ⚠️  无法删除 .next 目录:', error.message, '\n');
}

// 2. 清理 node_modules 缓存
console.log('2️⃣ 清理 node_modules 缓存...');
try {
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('   ✅ node_modules 缓存已清理\n');
  } else {
    console.log('   ℹ️  缓存目录不存在\n');
  }
} catch (error) {
  console.log('   ⚠️  无法清理缓存:', error.message, '\n');
}

// 3. 重新生成 Prisma Client
console.log('3️⃣ 重新生成 Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('   ✅ Prisma Client 已生成\n');
} catch (error) {
  console.log('   ⚠️  生成 Prisma Client 失败\n');
}

console.log('✨ 修复完成！\n');
console.log('请执行以下操作：');
console.log('1. 在 VSCode 中按 Ctrl+Shift+P');
console.log('2. 输入并选择: "TypeScript: Restart TS Server"');
console.log('3. 重新运行: npm run dev\n');
