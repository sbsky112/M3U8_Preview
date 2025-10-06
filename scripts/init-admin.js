#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 检查并创建管理员用户...');

    // 检查是否已存在admin用户
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('📋 管理员用户已存在');
      console.log(`   当前角色: ${existingAdmin.role}`);

      // 如果角色不是admin，则更新为admin
      if (existingAdmin.role !== 'admin') {
        console.log('🔄 正在更新admin用户角色为admin...');

        const updatedUser = await prisma.user.update({
          where: { username: 'admin' },
          data: { role: 'admin' }
        });

        console.log('✅ admin用户角色已更新为admin');
        console.log(`   用户名: ${updatedUser.username}`);
        console.log(`   角色: ${updatedUser.role}`);
      } else {
        console.log('✅ admin用户角色已经是admin');
      }

      console.log('   用户名: admin');
      console.log('   密码: admin123');
      console.log('   ⚠️  请在生产环境中立即修改密码！');
      return;
    }

    // 创建admin用户
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        name: '系统管理员',
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ 管理员用户创建成功');
    console.log('   用户名: admin');
    console.log('   密码: admin123');
    console.log('   ⚠️  请在生产环境中立即修改密码！');

  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 管理员用户初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };