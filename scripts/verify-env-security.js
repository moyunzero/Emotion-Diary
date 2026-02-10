#!/usr/bin/env node

/**
 * 环境变量安全验证脚本
 * 
 * 此脚本检查：
 * 1. .env 文件是否在 .gitignore 中
 * 2. .env 文件是否包含真实的 API 密钥
 * 3. .env.example 是否存在
 * 4. 敏感文件是否被正确忽略
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function isFileIgnored(filePath) {
  try {
    execSync(`git check-ignore ${filePath}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkForRealKeys(content) {
  const suspiciousPatterns = [
    { pattern: /gsk_[A-Za-z0-9]{50,}/, name: 'Groq API Key' },
    { pattern: /hf_[A-Za-z0-9]{30,}/, name: 'Hugging Face Token' },
    { pattern: /eyJ[A-Za-z0-9_-]{30,}/, name: 'Supabase JWT Token' },
    { pattern: /sb_publishable_[A-Za-z0-9_-]{20,}/, name: 'Supabase Publishable Key' },
  ];

  const found = [];
  for (const { pattern, name } of suspiciousPatterns) {
    if (pattern.test(content)) {
      found.push(name);
    }
  }
  return found;
}

function main() {
  log('\n🔍 环境变量安全检查\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  // 检查 1: .env.example 是否存在
  log('1. 检查 .env.example 文件...', 'blue');
  if (checkFileExists('.env.example')) {
    log('   ✅ .env.example 文件存在', 'green');
  } else {
    log('   ❌ .env.example 文件不存在', 'red');
    log('   建议：运行 cp .env .env.example 并移除真实密钥', 'yellow');
    hasIssues = true;
  }

  // 检查 2: .env 是否在 .gitignore 中
  log('\n2. 检查 .env 是否被 Git 忽略...', 'blue');
  if (isFileIgnored('.env')) {
    log('   ✅ .env 文件已在 .gitignore 中', 'green');
  } else {
    log('   ❌ .env 文件未被 Git 忽略', 'red');
    log('   建议：在 .gitignore 中添加 .env', 'yellow');
    hasIssues = true;
  }

  // 检查 3: .env 文件内容
  log('\n3. 检查 .env 文件内容...', 'blue');
  const envContent = readFile('.env');
  if (envContent) {
    const realKeys = checkForRealKeys(envContent);
    if (realKeys.length > 0) {
      log('   ⚠️  检测到可能的真实 API 密钥:', 'yellow');
      realKeys.forEach(key => log(`      - ${key}`, 'yellow'));
      log('   建议：', 'yellow');
      log('      1. 将密钥迁移到 EAS Secrets: eas secret:push --scope project --env-file .env', 'yellow');
      log('      2. 清空 .env 文件中的真实密钥', 'yellow');
      log('      3. 使用开发环境的测试密钥', 'yellow');
      hasWarnings = true;
    } else {
      log('   ✅ 未检测到明显的真实 API 密钥', 'green');
    }
  } else {
    log('   ℹ️  .env 文件不存在（这是正常的）', 'blue');
  }

  // 检查 4: .env 是否在 Git 历史中
  log('\n4. 检查 .env 是否在 Git 历史中...', 'blue');
  try {
    const gitLog = execSync('git log --all --full-history -- .env', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    if (gitLog.trim()) {
      log('   ⚠️  .env 文件存在于 Git 历史中', 'yellow');
      log('   建议：', 'yellow');
      log('      1. 立即轮换所有 API 密钥', 'yellow');
      log('      2. 考虑使用 BFG Repo-Cleaner 清理 Git 历史', 'yellow');
      log('      3. 查看 docs/URGENT_ENV_SECURITY_FIX.md 了解详细步骤', 'yellow');
      hasWarnings = true;
    } else {
      log('   ✅ .env 文件不在 Git 历史中', 'green');
    }
  } catch (error) {
    log('   ✅ .env 文件不在 Git 历史中', 'green');
  }

  // 检查 5: 其他敏感文件
  log('\n5. 检查其他敏感文件...', 'blue');
  const sensitiveFiles = [
    '.env.local',
    '.env.production.local',
    '*.p12',
    '*.p8',
    '*.mobileprovision',
    '*.jks',
    '*.keystore',
  ];

  let allIgnored = true;
  for (const file of sensitiveFiles) {
    if (!isFileIgnored(file)) {
      log(`   ⚠️  ${file} 未被忽略`, 'yellow');
      allIgnored = false;
    }
  }

  if (allIgnored) {
    log('   ✅ 所有敏感文件模式已被正确忽略', 'green');
  } else {
    log('   建议：检查并更新 .gitignore 文件', 'yellow');
    hasWarnings = true;
  }

  // 总结
  log('\n' + '='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 发现严重问题，请立即修复！', 'red');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  发现警告，建议尽快处理', 'yellow');
    log('\n📖 查看详细修复指南：', 'blue');
    log('   - docs/URGENT_ENV_SECURITY_FIX.md', 'blue');
    log('   - docs/eas-secrets-setup.md', 'blue');
    process.exit(0);
  } else {
    log('✅ 所有检查通过！环境变量配置安全', 'green');
    process.exit(0);
  }
}

main();
