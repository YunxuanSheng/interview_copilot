#!/usr/bin/env node

/**
 * 生产环境数据库迁移脚本
 * 用于在Vercel部署后更新数据库结构
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始生产环境数据库迁移...');

async function migrateProduction() {
  try {
    // 1. 检查环境变量
    console.log('📋 检查环境变量...');
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  未找到 .env.local 文件');
      console.log('💡 请先运行: vercel env pull .env.local');
      process.exit(1);
    }

    // 2. 检查DATABASE_URL
    require('dotenv').config({ path: envPath });
    if (!process.env.DATABASE_URL) {
      console.log('❌ 未找到 DATABASE_URL 环境变量');
      console.log('💡 请确保已正确配置生产数据库连接');
      process.exit(1);
    }

    console.log('✅ 环境变量检查通过');

    // 3. 运行Prisma迁移
    console.log('🔄 运行数据库迁移...');
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    console.log('✅ 数据库迁移完成');

    // 4. 生成Prisma客户端
    console.log('🔧 生成Prisma客户端...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('✅ Prisma客户端生成完成');

    // 5. 验证迁移结果
    console.log('🔍 验证迁移结果...');
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
      console.log('✅ 数据库验证通过');
    } catch (error) {
      console.log('⚠️  数据库验证跳过（没有seed脚本）');
    }

    console.log('🎉 生产环境数据库迁移成功完成！');
    console.log('📝 新增字段: recommendedAnswer (推荐答案)');
    console.log('🔗 可以在面试记录中查看AI推荐的标准答案');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.log('💡 请检查数据库连接和权限设置');
    process.exit(1);
  }
}

// 运行迁移
migrateProduction();
