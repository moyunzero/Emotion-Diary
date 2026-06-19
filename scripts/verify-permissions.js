#!/usr/bin/env node

/**
 * iOS 权限配置验证脚本
 *
 * 此脚本检查：
 * 1. locales/native/en.json 与 zh.json 双语 NS* 键 parity（NAT-01）
 * 2. Info.plist 中配置的权限（prebuild 后可选）
 * 3. 权限说明是否清晰
 * 4. 是否有不必要的权限
 */

const fs = require('fs');
const path = require('path');
const { getNativeAppFile } = require('./ios-project-paths');

const REQUIRED_IOS_KEYS = [
  'NSMicrophoneUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSFaceIDUsageDescription',
];

const NATIVE_LOCALE_PATHS = {
  en: path.join(process.cwd(), 'locales/native/en.json'),
  zh: path.join(process.cwd(), 'locales/native/zh.json'),
};

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

function readNativeLocale(relativePath) {
  try {
    const content = fs.readFileSync(relativePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ 无法读取 ${relativePath}: ${error.message}`, 'red');
    return null;
  }
}

function getIosBlock(locale) {
  return locale?.ios ?? locale ?? {};
}

function validateNativeLocales() {
  log('1. 检查 locales/native 双语权限 JSON...\n', 'blue');

  let hasIssues = false;

  for (const [lang, filePath] of Object.entries(NATIVE_LOCALE_PATHS)) {
    const locale = readNativeLocale(filePath);
    if (!locale) {
      hasIssues = true;
      continue;
    }

    const ios = getIosBlock(locale);
    log(`   📄 ${path.relative(process.cwd(), filePath)}`, 'bold');

    for (const key of REQUIRED_IOS_KEYS) {
      const value = ios[key];
      if (!value || String(value).trim() === '') {
        hasIssues = true;
        log(`      ❌ 缺少或为空: ${key}`, 'red');
        continue;
      }

      if (lang === 'en') {
        if (!/[A-Za-z]/.test(value)) {
          hasIssues = true;
          log(`      ❌ ${key} 应为英文说明`, 'red');
        } else {
          log(`      ✅ ${key}`, 'green');
        }
      } else {
        const hasCjk = /[\u4e00-\u9fff]/.test(value);
        const hasPurpose =
          /以便|用于|保护|仅在你|仅在您/.test(value);
        if (!hasCjk || !value.includes('心晴MO')) {
          hasIssues = true;
          log(`      ❌ ${key} 应含 心晴MO 与中文用途说明`, 'red');
        } else if (!hasPurpose) {
          hasIssues = true;
          log(`      ❌ ${key} 建议说明具体用途（以便/用于/保护等）`, 'red');
        } else {
          log(`      ✅ ${key}`, 'green');
        }
      }
    }

    log('');
  }

  return hasIssues;
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

function checkDescriptionQuality(description, { expectChinese = true } = {}) {
  const issues = [];

  if (!description || description.trim() === '') {
    issues.push('说明为空');
    return issues;
  }

  if (description.includes('$(PRODUCT_NAME)')) {
    issues.push('包含占位符 $(PRODUCT_NAME)，建议使用应用名称');
  }

  if (description.length < 10) {
    issues.push('说明过短，建议提供更详细的说明');
  }

  if (description.length > 200) {
    issues.push('说明过长，建议简化为1-2句话');
  }

  const isEnglishOnly = /^[a-zA-Z0-9\s.,!?()'"-]+$/.test(description);
  const hasCjk = /[\u4e00-\u9fff]/.test(description);

  if (expectChinese && !hasCjk && isEnglishOnly) {
    issues.push('中文设备 plist 建议使用中文说明（英文由 locales/native/en.json 覆盖）');
  }

  if (expectChinese && hasCjk) {
    const hasSpecificPurpose =
      description.includes('以便') ||
      description.includes('用于') ||
      description.includes('帮助') ||
      description.includes('让您') ||
      description.includes('为您') ||
      description.includes('保护') ||
      description.includes('仅在你') ||
      description.includes('仅在您');

    if (!hasSpecificPurpose) {
      issues.push('建议说明具体用途（使用"以便"、"用于"等词）');
    }
  }

  return issues;
}

function main() {
  log('\n🔐 iOS 权限配置验证\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  if (validateNativeLocales()) {
    hasIssues = true;
  }

  const plistContent = readInfoPlist();

  if (!plistContent) {
    if (hasIssues) {
      log('\n❌ locales/native 校验失败', 'red');
      process.exit(1);
    }
    log('ℹ️  Info.plist 未生成（可运行 expo prebuild）；locales/native 校验已通过', 'blue');
    process.exit(0);
  }

  const permissions = extractPermissions(plistContent);

  if (Object.keys(permissions).length === 0) {
    if (hasIssues) {
      log('\n❌ locales/native 校验失败', 'red');
      process.exit(1);
    }
    log('ℹ️  Info.plist 中未找到权限键；locales/native 校验已通过', 'blue');
    process.exit(0);
  }

  log('2. 检查 Info.plist 已配置的权限...\n', 'blue');

  for (const [key, description] of Object.entries(permissions)) {
    const permissionName = getPermissionName(key);
    log(`   📱 ${permissionName}`, 'bold');
    log(`      说明: ${description}`, 'reset');

    const expectChinese = /[\u4e00-\u9fff]/.test(description);
    const issues = checkDescriptionQuality(description, { expectChinese });
    
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

  log('3. 检查可能不必要的权限...\n', 'blue');

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

  log('\n4. 权限最佳实践...\n', 'blue');
  log('   ✓ locales/native 双语 NS* 键 parity（NAT-01）', 'green');
  log('   ✓ 英文设备由 en.json 覆盖系统弹窗文案', 'green');
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
