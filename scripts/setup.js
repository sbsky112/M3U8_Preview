#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 开始设置 M3U8 视频预览平台...\n');

// 检查 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 创建 .env 文件...');
  
  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf-8');
    
    // 生成随机密钥
    const secret = crypto.randomBytes(32).toString('base64');
    envContent = envContent.replace('your-secret-key-change-this-in-production', secret);
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 文件已创建\n');
  } else {
    console.log('❌ 找不到 .env.example 文件\n');
  }
} else {
  console.log('✅ .env 文件已存在\n');
}

// 提示用户配置数据库
console.log('⚠️  请确保：');
console.log('   1. PostgreSQL 已安装并运行');
console.log('   2. 已创建数据库: m3u8_preview');
console.log('   3. .env 文件中的 DATABASE_URL 配置正确\n');

console.log('按 Enter 继续，或按 Ctrl+C 取消...');
process.stdin.once('data', () => {
  try {
    console.log('\n📦 生成 Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('\n🗄️  同步数据库...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('\n✨ 设置完成！');
    console.log('\n运行以下命令启动开发服务器：');
    console.log('   npm run dev\n');
    
    console.log('然后在浏览器中访问：');
    console.log('   http://localhost:3000\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    console.log('\n请检查：');
    console.log('   1. PostgreSQL 是否正在运行');
    console.log('   2. DATABASE_URL 配置是否正确');
    console.log('   3. 数据库是否已创建\n');
    process.exit(1);
  }
});
