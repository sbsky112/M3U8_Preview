#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    console.log('🔧 检查并修复admin用户角色...');

    // 查找admin用户
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('❌ 未找到admin用户');
      return;
    }

    console.log(`📋 当前admin用户信息:`);
    console.log(`   用户名: ${adminUser.username}`);
    console.log(`   当前角色: ${adminUser.role}`);

    // 如果角色不是admin，则更新为admin
    if (adminUser.role !== 'admin') {
      console.log('🔄 正在修复admin用户角色...');

      const updatedUser = await prisma.user.update({
        where: { username: 'admin' },
        data: { role: 'admin' }
      });

      console.log('✅ admin用户角色已修复为admin');
      console.log(`   用户名: ${updatedUser.username}`);
      console.log(`   新角色: ${updatedUser.role}`);
    } else {
      console.log('✅ admin用户角色已经是admin，无需修复');
    }

  } catch (error) {
    console.error('❌ 修复admin用户角色失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixAdminRole()
    .then(() => {
      console.log('🎉 admin角色修复完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixAdminRole };