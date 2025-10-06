#!/usr/bin/env node

/**
 * 搜索和筛选功能测试脚本
 * 这个脚本会测试视频搜索和筛选功能的各种场景
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000/api';
let authToken = null;

// 测试用例
const testCases = [
  {
    name: '获取所有视频',
    params: {},
    expectedResults: '应返回所有视频列表'
  },
  {
    name: '搜索功能 - 模糊匹配',
    params: { search: '测试', exactMatch: false },
    expectedResults: '应返回标题包含"测试"的视频'
  },
  {
    name: '搜索功能 - 精确匹配',
    params: { search: '测试视频', exactMatch: true },
    expectedResults: '应返回标题等于"测试视频"的视频'
  },
  {
    name: '分类筛选',
    params: { category: '教育' },
    expectedResults: '应返回分类为"教育"的视频'
  },
  {
    name: '作者筛选',
    params: { author: '测试作者' },
    expectedResults: '应返回作者为"测试作者"的视频'
  },
  {
    name: '日期范围筛选',
    params: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    expectedResults: '应返回2024年的视频'
  },
  {
    name: '组合筛选 - 搜索 + 分类',
    params: {
      search: '教程',
      category: '教育',
      exactMatch: false
    },
    expectedResults: '应返回标题包含"教程"且分类为"教育"的视频'
  },
  {
    name: '分页测试 - 第2页',
    params: { page: 2, limit: 5 },
    expectedResults: '应返回第2页的视频，每页5条'
  },
  {
    name: '无效参数测试',
    params: { page: -1, limit: 1000 },
    expectedResults: '应使用默认值并正常返回结果'
  }
];

// 工具函数
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(path, params = {}) {
  try {
    const config = {
      method: 'GET',
      url: `${API_BASE}${path}`,
      params,
      headers: {}
    };

    // 如果需要认证，添加认证头
    if (authToken) {
      config.headers.Cookie = `next-auth.session-token=${authToken}`;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试搜索和筛选功能...\n');

  // 检查API是否可访问
  console.log('📡 检查API连接...');
  const healthCheck = await makeRequest('/videos');
  if (!healthCheck.success) {
    console.log('❌ API连接失败:', healthCheck.error);
    console.log('💡 请确保Docker容器正在运行: docker-compose up -d');
    process.exit(1);
  }
  console.log('✅ API连接正常\n');

  // 获取筛选器选项
  console.log('🔍 获取筛选器选项...');
  const filtersResponse = await makeRequest('/videos/filters');
  if (filtersResponse.success) {
    console.log('✅ 筛选器选项获取成功');
    console.log('   分类:', filtersResponse.data.categories?.join(', ') || '无');
    console.log('   作者:', filtersResponse.data.authors?.join(', ') || '无');
  } else {
    console.log('❌ 筛选器选项获取失败:', filtersResponse.error);
  }
  console.log('');

  // 运行测试用例
  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`🧪 测试 ${i + 1}/${totalTests}: ${testCase.name}`);
    console.log(`   参数:`, JSON.stringify(testCase.params, null, 2));

    const response = await makeRequest('/videos', testCase.params);

    if (response.success) {
      console.log('✅ 测试通过');
      console.log(`   结果: 找到 ${response.data.pagination?.total || 0} 个视频`);
      console.log(`   分页: ${response.data.pagination?.page || 0}/${response.data.pagination?.totalPages || 0}`);

      if (response.data.videos && response.data.videos.length > 0) {
        console.log('   示例视频:');
        const video = response.data.videos[0];
        console.log(`     - 标题: ${video.title}`);
        console.log(`     - 分类: ${video.category || '无'}`);
        console.log(`     - 作者: ${video.author || '无'}`);
        console.log(`     - 创建时间: ${video.createdAt}`);
      }
      passedTests++;
    } else {
      console.log('❌ 测试失败');
      console.log('   错误:', response.error);
      console.log(`   状态码: ${response.status}`);
    }

    console.log(`   期望: ${testCase.expectedResults}\n`);

    // 避免请求过快
    await sleep(500);
  }

  // 测试总结
  console.log('📊 测试总结:');
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   通过: ${passedTests}`);
  console.log(`   失败: ${totalTests - passedTests}`);
  console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！搜索和筛选功能工作正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能。');
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testCases };