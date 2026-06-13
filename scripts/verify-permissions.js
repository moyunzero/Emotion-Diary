#!/usr/bin/env node

/**
 * iOS 权限配置验证脚本
 * 
 * 此脚本检查：
 * 1. Info.plist 中配置的权限
 * 2. 权限说明是否清晰
 * 3. 是否有不必要的权限
 * 4. 权限说明是否使用中文
 */

const fs = require('fs');
const path = require('path');
const { getNativeAppFile } = require('./ios-project-paths');

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

function readInfoPlist() {
  try {
    const plistPath = getNativeAppFile('Info.plist');

    if (!plistPath || !fs.existsSync(plistPath)) {
      log('ℹ️  Info.plist 文件不存在（可能还未运行 expo prebuild）', 'blue');
      return null;
    }

    const content = fs.readFileSync(plistPath, 'utf8');
    return content;
  } catch (error) {
    log(`❌ 无法读取 Info.plist: ${error.message}`, 'red');
    return null;
  }
}

function extractPermissions(plistContent) {
  const permissions = {};
  
  // 常见的权限键
  const permissionKeys = [
    'NSCameraUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSPhotoLibraryAddUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSContactsUsageDescription',
    'NSCalendarsUsageDescription',
    'NSRemindersUsageDescription',
    'NSFaceIDUsageDescription',
    'NSSpeechRecognitionUsageDescription',
    'NSHealthShareUsageDescription',
    'NSHealthUpdateUsageDescription',
    'NSMotionUsageDescription',
    'NSAppleMusicUsageDescription',
    'NSBluetoothAlwaysUsageDescription',
    'NSBluetoothPeripheralUsageDescription',
  ];

  for (const key of permissionKeys) {
    const regex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`, 'i');
    const match = plistContent.match(regex);
    if (match) {
      permissions[key] = match[1].trim();
    }
  }

  return permissions;
}

function getPermissionName(key) {
  const names = {
    'NSCameraUsageDescription': '相机',
    'NSPhotoLibraryUsageDescription': '相册（读取）',
    'NSPhotoLibraryAddUsageDescription': '相册（添加）',
    'NSLocationWhenInUseUsageDescription': '位置（使用时）',
    'NSLocationAlwaysUsageDescription': '位置（始终）',
    'NSLocationAlwaysAndWhenInUseUsageDescription': '位置（始终和使用时）',
    'NSMicrophoneUsageDescription': '麦克风',
    'NSContactsUsageDescription': '通讯录',
    'NSCalendarsUsageDescription': '日历',
    'NSRemindersUsageDescription': '提醒事项',
    'NSFaceIDUsageDescription': 'Face ID / Touch ID',
    'NSSpeechRecognitionUsageDescription': '语音识别',
    'NSHealthShareUsageDescription': '健康数据（读取）',
    'NSHealthUpdateUsageDescription': '健康数据（写入）',
    'NSMotionUsageDescription': '运动与健身',
    'NSAppleMusicUsageDescription': '媒体库',
    'NSBluetoothAlwaysUsageDescription': '蓝牙（始终）',
    'NSBluetoothPeripheralUsageDescription': '蓝牙（外设）',
  };
  return names[key] || key;
}

function checkDescriptionQuality(description) {
  const issues = [];
  
  // 检查是否为空
  if (!description || description.trim() === '') {
    issues.push('说明为空');
    return issues;
  }

  // 检查是否使用了占位符
  if (description.includes('$(PRODUCT_NAME)')) {
    issues.push('包含占位符 $(PRODUCT_NAME)，建议使用应用名称');
  }

  // 检查是否使用英文
  if (/^[a-zA-Z\s.,!?]+$/.test(description)) {
    issues.push('使用英文说明，建议使用中文');
  }

  // 检查长度
  if (description.length < 10) {
    issues.push('说明过短，建议提供更详细的说明');
  }

  if (description.length > 200) {
    issues.push('说明过长，建议简化为1-2句话');
  }

  // 检查是否说明了具体用途
  const hasSpecificPurpose = 
    description.includes('以便') ||
    description.includes('用于') ||
    description.includes('帮助') ||
    description.includes('让您') ||
    description.includes('为您');

  if (!hasSpecificPurpose) {
    issues.push('建议说明具体用途（使用"以便"、"用于"等词）');
  }

  return issues;
}

function main() {
  log('\n🔐 iOS 权限配置验证\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  // 读取 Info.plist
  const plistContent = readInfoPlist();
  
  if (!plistContent) {
    log('⚠️  无法读取 Info.plist 文件', 'yellow');
    process.exit(0);
  }

  // 提取权限
  const permissions = extractPermissions(plistContent);

  if (Object.keys(permissions).length === 0) {
    log('ℹ️  未找到任何权限配置', 'blue');
    log('   这是正常的，如果应用不需要特殊权限', 'blue');
    process.exit(0);
  }

  // 检查每个权限
  log('1. 检查已配置的权限...\n', 'blue');

  for (const [key, description] of Object.entries(permissions)) {
    const permissionName = getPermissionName(key);
    log(`   📱 ${permissionName}`, 'bold');
    log(`      说明: ${description}`, 'reset');

    const issues = checkDescriptionQuality(description);
    
    if (issues.length === 0) {
      log(`      ✅ 说明质量良好`, 'green');
    } else {
      hasWarnings = true;
      log(`      ⚠️  建议改进:`, 'yellow');
      issues.forEach(issue => {
        log(`         - ${issue}`, 'yellow');
      });
    }
    log('');
  }

  // 检查常见不必要的权限
  log('2. 检查可能不必要的权限...\n', 'blue');

  const potentiallyUnnecessary = {
    'NSMicrophoneUsageDescription': '应用是否真的需要麦克风？（语音输入、录音等）',
    'NSCameraUsageDescription': '应用是否真的需要相机？（拍照、扫码等）',
    'NSLocationWhenInUseUsageDescription': '应用是否真的需要位置？（地图、天气等）',
    'NSContactsUsageDescription': '应用是否真的需要通讯录？（分享、邀请等）',
  };

  let foundUnnecessary = false;
  for (const [key, question] of Object.entries(potentiallyUnnecessary)) {
    if (permissions[key]) {
      foundUnnecessary = true;
      const permissionName = getPermissionName(key);
      log(`   ⚠️  ${permissionName}`, 'yellow');
      log(`      ${question}`, 'yellow');
      log('');
    }
  }

  if (!foundUnnecessary) {
    log('   ✅ 未发现明显不必要的权限', 'green');
  } else {
    hasWarnings = true;
    log('   建议：仔细检查这些权限是否真的需要', 'yellow');
    log('   如果不需要，请从 Info.plist 中移除', 'yellow');
  }

  // 权限最佳实践提示
  log('\n3. 权限最佳实践...\n', 'blue');
  log('   ✓ 使用用户母语（中文）', 'green');
  log('   ✓ 说明具体用途', 'green');
  log('   ✓ 强调用户利益', 'green');
  log('   ✓ 简洁明了（1-2句话）', 'green');
  log('   ✓ 避免技术术语', 'green');
  log('   ✓ 只请求必要的权限', 'green');

  // 总结
  log('\n' + '='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 发现严重问题，请修复后再继续', 'red');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/ios-permissions-guide.md', 'blue');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  发现一些建议，可以考虑优化', 'yellow');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/ios-permissions-guide.md', 'blue');
    process.exit(0);
  } else {
    log('✅ 权限配置验证通过！', 'green');
    process.exit(0);
  }
}

main();
