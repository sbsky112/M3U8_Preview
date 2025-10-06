#!/usr/bin/env node

/**
 * 生成测试数据脚本
 * 创建一些示例视频数据用于测试搜索和筛选功能
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// 测试数据
const testVideos = [
  {
    title: 'JavaScript基础教程',
    description: '适合初学者的JavaScript编程入门教程',
    m3u8Url: 'https://example.com/video1.m3u8',
    author: '张老师',
    category: '教育',
  },
  {
    title: 'React框架详解',
    description: '深入理解React框架的核心概念',
    m3u8Url: 'https://example.com/video2.m3u8',
    author: '李老师',
    category: '教育',
  },
  {
    title: 'Node.js后端开发',
    description: '使用Node.js构建RESTful API',
    m3u8Url: 'https://example.com/video3.m3u8',
    author: '王老师',
    category: '技术',
  },
  {
    title: 'CSS动画技巧',
    description: '创建炫酷的CSS动画效果',
    m3u8Url: 'https://example.com/video4.m3u8',
    author: '张老师',
    category: '设计',
  },
  {
    title: '数据库设计原理',
    description: '关系型数据库设计的基本原则',
    m3u8Url: 'https://example.com/video5.m3u8',
    author: '陈老师',
    category: '教育',
  },
  {
    title: '前端性能优化',
    description: '提升Web应用性能的最佳实践',
    m3u8Url: 'https://example.com/video6.m3u8',
    author: '李老师',
    category: '技术',
  },
  {
    title: 'Vue.js实战项目',
    description: '使用Vue.js构建完整的单页应用',
    m3u8Url: 'https://example.com/video7.m3u8',
    author: '赵老师',
    category: '教育',
  },
  {
    title: 'TypeScript入门指南',
    description: 'TypeScript语言基础和类型系统',
    m3u8Url: 'https://example.com/video8.m3u8',
    author: '王老师',
    category: '技术',
  },
  {
    title: '响应式网页设计',
    description: '创建适配多种设备的网页布局',
    m3u8Url: 'https://example.com/video9.m3u8',
    author: '张老师',
    category: '设计',
  },
  {
    title: '测试视频',
    description: '这是一个用于搜索测试的视频',
    m3u8Url: 'https://example.com/video10.m3u8',
    author: '测试作者',
    category: '测试',
  }
];

async function generateTestData() {
  console.log('🚀 开始生成测试数据...\n');

  try {
    // 检查数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 清除现有数据（可选）
    console.log('🧹 清除现有测试数据...');
    await prisma.video.deleteMany({});
    console.log('✅ 清除完成');

    // 获取或创建管理员用户
    let adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('👤 创建管理员用户...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          name: '管理员',
          password: hashedPassword,
          role: 'admin',
        },
      });
      console.log('✅ 管理员用户创建成功');
    } else {
      console.log('✅ 管理员用户已存在');
    }

    // 插入测试视频数据
    console.log('📹 插入测试视频数据...');
    const videos = [];

    for (let i = 0; i < testVideos.length; i++) {
      const videoData = testVideos[i];

      // 创建不同的创建时间以便测试日期筛选
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - (i * 5)); // 每个视频相隔5天

      const video = await prisma.video.create({
        data: {
          ...videoData,
          userId: adminUser.id,
          createdAt,
        },
      });

      videos.push(video);
      console.log(`   ✅ 创建视频: ${video.title}`);
    }

    // 输出统计信息
    console.log('\n📊 数据生成完成统计:');
    console.log(`   管理员用户: 1`);
    console.log(`   测试视频: ${videos.length}`);
    console.log(`   分类数量: ${new Set(testVideos.map(v => v.category)).size}`);
    console.log(`   作者数量: ${new Set(testVideos.map(v => v.author)).size}`);

    console.log('\n🎉 测试数据生成完成！');
    console.log('💡 现在可以运行搜索筛选测试: node scripts/test-search-filter.js');

  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  generateTestData().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { generateTestData, testVideos };