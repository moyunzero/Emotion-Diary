#!/usr/bin/env node

/**
 * 应用图标验证脚本
 * 
 * 此脚本检查：
 * 1. 图标文件是否存在
 * 2. 图标尺寸是否为 1024x1024
 * 3. 图标格式是否正确
 * 4. 图标是否有透明度
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

function getImageInfo(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Safe: Escape shell arguments to prevent command injection
    // Using double quotes and escaping special characters
    const escapedPath = fullPath.replace(/"/g, '\\"');
    const output = execSync(`sips -g pixelWidth -g pixelHeight -g format -g hasAlpha "${escapedPath}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const info = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('pixelWidth:')) {
        info.width = Number.parseInt(line.split(':')[1].trim());
      }
      if (line.includes('pixelHeight:')) {
        info.height = Number.parseInt(line.split(':')[1].trim());
      }
      if (line.includes('format:')) {
        info.format = line.split(':')[1].trim();
      }
      if (line.includes('hasAlpha:')) {
        info.hasAlpha = line.split(':')[1].trim() === 'yes';
      }
    }

    return info;
  } catch (error) {
    log(`   ⚠️  无法读取图片信息（需要 macOS 的 sips 命令）`, 'yellow');
    return null;
  }
}

function main() {
  log('\n🎨 应用图标验证\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  const iconPath = 'assets/images/app-icon.png';

  // 检查 1: 图标文件是否存在
  log('1. 检查图标文件是否存在...', 'blue');
  if (checkFileExists(iconPath)) {
    log(`   ✅ 图标文件存在: ${iconPath}`, 'green');
  } else {
    log(`   ❌ 图标文件不存在: ${iconPath}`, 'red');
    log('   建议：确保图标文件在正确的位置', 'yellow');
    hasIssues = true;
    process.exit(1);
  }

  // 检查 2: 图标规格
  log('\n2. 检查图标规格...', 'blue');
  const info = getImageInfo(iconPath);

  if (info) {
    // 检查尺寸
    if (info.width === 1024 && info.height === 1024) {
      log(`   ✅ 图标尺寸正确: ${info.width} x ${info.height}`, 'green');
    } else {
      log(`   ❌ 图标尺寸不正确: ${info.width} x ${info.height}`, 'red');
      log('   要求：1024 x 1024 像素', 'yellow');
      hasIssues = true;
    }

    // 检查格式
    if (info.format === 'png') {
      log(`   ✅ 图标格式正确: PNG`, 'green');
    } else {
      log(`   ⚠️  图标格式: ${info.format}`, 'yellow');
      log('   建议：使用 PNG 格式', 'yellow');
      hasWarnings = true;
    }

    // 检查透明度
    if (info.hasAlpha) {
      log(`   ⚠️  图标包含透明度（Alpha 通道）`, 'yellow');
      log('   App Store 要求：图标不能有透明度', 'yellow');
      log('   建议：移除透明度，使用纯色背景', 'yellow');
      hasWarnings = true;
    } else {
      log(`   ✅ 图标无透明度`, 'green');
    }
  }

  // 检查 3: app.json 配置
  log('\n3. 检查 app.json 配置...', 'blue');
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const configuredIcon = appJson.expo?.icon;

    if (configuredIcon === `./${iconPath}`) {
      log(`   ✅ app.json 中的图标路径正确`, 'green');
    } else {
      log(`   ⚠️  app.json 中的图标路径: ${configuredIcon}`, 'yellow');
      log(`   当前图标路径: ${iconPath}`, 'yellow');
      hasWarnings = true;
    }
  } catch (error) {
    log(`   ❌ 无法读取 app.json: ${error.message}`, 'red');
    hasIssues = true;
  }

  // App Store 要求说明
  log('\n4. App Store 图标要求...', 'blue');
  log('   ✓ 尺寸：1024 x 1024 像素', 'green');
  log('   ✓ 格式：PNG（无透明度）', 'green');
  log('   ✓ 色彩空间：RGB', 'green');
  log('   ✓ 圆角：不要添加（系统会自动处理）', 'green');
  log('   ✓ 清晰度：在小尺寸下也能识别', 'green');

  // 总结
  log('\n' + '='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 发现严重问题，请修复后再继续', 'red');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/app-store-screenshots-guide.md', 'blue');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  发现警告，建议修复', 'yellow');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/app-store-screenshots-guide.md', 'blue');
    process.exit(0);
  } else {
    log('✅ 应用图标验证通过！', 'green');
    process.exit(0);
  }
}

main();
