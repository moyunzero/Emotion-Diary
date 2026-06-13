#!/usr/bin/env node

/**
 * iOS 隐私清单验证脚本
 * 
 * 此脚本检查：
 * 1. PrivacyInfo.xcprivacy 文件是否存在
 * 2. 文件格式是否正确
 * 3. 必需的数据类型声明是否完整
 * 4. 必需原因API声明是否完整
 * 5. 追踪设置是否正确
 */

const fs = require('fs');
const path = require('path');
const { getNativeAppFile } = require('./ios-project-paths');
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

function readPrivacyManifest() {
  try {
    const manifestPath = getNativeAppFile('PrivacyInfo.xcprivacy');

    if (!manifestPath || !fs.existsSync(manifestPath)) {
      log('❌ PrivacyInfo.xcprivacy 文件不存在', 'red');
      const hint = getNativeAppFile('PrivacyInfo.xcprivacy');
      if (hint) {
        log(`   期望位置: ${path.relative(process.cwd(), hint)}`, 'red');
      } else {
        log('   运行 expo prebuild 后应位于 ios/<AppName>/PrivacyInfo.xcprivacy', 'red');
      }
      return null;
    }

    const content = fs.readFileSync(manifestPath, 'utf8');
    return { path: manifestPath, content };
  } catch (error) {
    log(`❌ 无法读取 PrivacyInfo.xcprivacy: ${error.message}`, 'red');
    return null;
  }
}

function validatePlistFormat(manifestPath) {
  try {
    // 使用 plutil 验证 plist 格式（仅在 macOS 上可用）
    if (process.platform === 'darwin') {
      // Safe: Escape shell arguments to prevent command injection
      const escapedPath = manifestPath.replace(/"/g, '\\"');
      execSync(`plutil -lint "${escapedPath}"`, { stdio: 'pipe' });
      return { valid: true };
    } else {
      // 在非 macOS 系统上，进行基本的 XML 格式检查
      const content = fs.readFileSync(manifestPath, 'utf8');
      if (!content.includes('<?xml') || !content.includes('<plist')) {
        return { valid: false, error: '不是有效的 plist 文件' };
      }
      return { valid: true, warning: '无法使用 plutil 验证（非 macOS 系统）' };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function checkDataTypes(content) {
  const issues = [];
  const warnings = [];
  
  // 检查是否有 NSPrivacyCollectedDataTypes 键
  if (!content.includes('NSPrivacyCollectedDataTypes')) {
    issues.push('缺少 NSPrivacyCollectedDataTypes 键');
    return { issues, warnings };
  }

  // 检查用户内容数据类型
  if (!content.includes('NSPrivacyCollectedDataTypeUserContent')) {
    warnings.push('未声明用户内容（UserContent）数据收集');
    warnings.push('  如果应用收集用户创建的内容（如日记），应该声明此类型');
  } else {
    // 检查是否有完整的配置
    const userContentSection = content.substring(
      content.indexOf('NSPrivacyCollectedDataTypeUserContent'),
      content.indexOf('</dict>', content.indexOf('NSPrivacyCollectedDataTypeUserContent'))
    );
    
    if (!userContentSection.includes('NSPrivacyCollectedDataTypeLinked')) {
      issues.push('用户内容数据类型缺少 Linked 声明');
    }
    if (!userContentSection.includes('NSPrivacyCollectedDataTypeTracking')) {
      issues.push('用户内容数据类型缺少 Tracking 声明');
    }
    if (!userContentSection.includes('NSPrivacyCollectedDataTypePurposes')) {
      issues.push('用户内容数据类型缺少 Purposes 声明');
    }
  }

  // 检查用户ID数据类型
  if (!content.includes('NSPrivacyCollectedDataTypeUserID')) {
    warnings.push('未声明用户ID（UserID）数据收集');
    warnings.push('  如果应用使用用户认证，应该声明此类型');
  } else {
    const userIDSection = content.substring(
      content.indexOf('NSPrivacyCollectedDataTypeUserID'),
      content.indexOf('</dict>', content.indexOf('NSPrivacyCollectedDataTypeUserID'))
    );
    
    if (!userIDSection.includes('NSPrivacyCollectedDataTypeLinked')) {
      issues.push('用户ID数据类型缺少 Linked 声明');
    }
    if (!userIDSection.includes('NSPrivacyCollectedDataTypeTracking')) {
      issues.push('用户ID数据类型缺少 Tracking 声明');
    }
    if (!userIDSection.includes('NSPrivacyCollectedDataTypePurposes')) {
      issues.push('用户ID数据类型缺少 Purposes 声明');
    }
  }

  return { issues, warnings };
}

function checkAccessedAPIs(content) {
  const issues = [];
  const warnings = [];
  
  // 检查是否有 NSPrivacyAccessedAPITypes 键
  if (!content.includes('NSPrivacyAccessedAPITypes')) {
    issues.push('缺少 NSPrivacyAccessedAPITypes 键');
    return { issues, warnings };
  }

  // 常见的必需原因API
  const commonAPIs = {
    'NSPrivacyAccessedAPICategoryUserDefaults': 'UserDefaults API',
    'NSPrivacyAccessedAPICategoryFileTimestamp': '文件时间戳 API',
    'NSPrivacyAccessedAPICategoryDiskSpace': '磁盘空间 API',
    'NSPrivacyAccessedAPICategorySystemBootTime': '系统启动时间 API',
  };

  const declaredAPIs = [];
  for (const [apiKey, apiName] of Object.entries(commonAPIs)) {
    if (content.includes(apiKey)) {
      declaredAPIs.push(apiName);
      
      // 检查是否有原因代码
      const apiSection = content.substring(
        content.indexOf(apiKey),
        content.indexOf('</dict>', content.indexOf(apiKey))
      );
      
      if (!apiSection.includes('NSPrivacyAccessedAPITypeReasons')) {
        issues.push(`${apiName} 缺少原因代码（Reasons）`);
      }
    }
  }

  if (declaredAPIs.length === 0) {
    warnings.push('未声明任何必需原因API');
    warnings.push('  大多数应用至少会使用 UserDefaults 或文件时间戳API');
  }

  return { issues, warnings, declaredAPIs };
}

function checkTracking(content) {
  const issues = [];
  const warnings = [];
  
  // 检查是否有 NSPrivacyTracking 键
  if (!content.includes('NSPrivacyTracking')) {
    issues.push('缺少 NSPrivacyTracking 键');
  } else {
    // 检查追踪设置
    if (content.includes('<key>NSPrivacyTracking</key>') && 
        content.includes('<true/>', content.indexOf('NSPrivacyTracking'))) {
      warnings.push('应用启用了追踪（NSPrivacyTracking = true）');
      warnings.push('  如果启用追踪，需要请求用户许可（ATT框架）');
      
      // 检查是否有追踪域名
      if (!content.includes('NSPrivacyTrackingDomains')) {
        issues.push('启用追踪但未声明追踪域名');
      }
    }
  }

  return { issues, warnings };
}

function main() {
  log('\n🔒 iOS 隐私清单验证\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  // 1. 读取隐私清单文件
  const manifest = readPrivacyManifest();
  if (!manifest) {
    log('\n❌ 验证失败：无法读取隐私清单文件', 'red');
    process.exit(1);
  }

  log('✅ 隐私清单文件存在', 'green');
  log(`   位置: ${manifest.path}\n`, 'blue');

  // 2. 验证文件格式
  log('1. 验证文件格式...\n', 'blue');
  const formatResult = validatePlistFormat(manifest.path);
  
  if (!formatResult.valid) {
    hasIssues = true;
    log(`   ❌ 文件格式无效: ${formatResult.error}`, 'red');
  } else {
    log('   ✅ 文件格式正确', 'green');
    if (formatResult.warning) {
      log(`   ⚠️  ${formatResult.warning}`, 'yellow');
    }
  }
  log('');

  // 3. 检查数据类型声明
  log('2. 检查数据类型声明...\n', 'blue');
  const dataTypesResult = checkDataTypes(manifest.content);
  
  if (dataTypesResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    dataTypesResult.issues.forEach(issue => {
      log(`      - ${issue}`, 'red');
    });
  } else {
    log('   ✅ 数据类型声明完整', 'green');
  }
  
  if (dataTypesResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  建议:', 'yellow');
    dataTypesResult.warnings.forEach(warning => {
      log(`      - ${warning}`, 'yellow');
    });
  }
  log('');

  // 4. 检查必需原因API声明
  log('3. 检查必需原因API声明...\n', 'blue');
  const apisResult = checkAccessedAPIs(manifest.content);
  
  if (apisResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    apisResult.issues.forEach(issue => {
      log(`      - ${issue}`, 'red');
    });
  } else if (apisResult.declaredAPIs.length > 0) {
    log('   ✅ 已声明的API:', 'green');
    apisResult.declaredAPIs.forEach(api => {
      log(`      - ${api}`, 'green');
    });
  }
  
  if (apisResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  建议:', 'yellow');
    apisResult.warnings.forEach(warning => {
      log(`      - ${warning}`, 'yellow');
    });
  }
  log('');

  // 5. 检查追踪设置
  log('4. 检查追踪设置...\n', 'blue');
  const trackingResult = checkTracking(manifest.content);
  
  if (trackingResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    trackingResult.issues.forEach(issue => {
      log(`      - ${issue}`, 'red');
    });
  } else {
    log('   ✅ 追踪设置正确', 'green');
  }
  
  if (trackingResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  注意:', 'yellow');
    trackingResult.warnings.forEach(warning => {
      log(`      - ${warning}`, 'yellow');
    });
  }
  log('');

  // 总结
  log('='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 验证失败：发现严重问题，请修复后再继续', 'red');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/ios-privacy-manifest-guide.md', 'blue');
    log('   - https://developer.apple.com/documentation/bundleresources/privacy_manifest_files', 'blue');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  验证通过，但有一些建议', 'yellow');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/ios-privacy-manifest-guide.md', 'blue');
    process.exit(0);
  } else {
    log('✅ 隐私清单验证通过！', 'green');
    log('\n下一步：', 'blue');
    log('   1. 在 Xcode 中构建项目，检查是否有隐私相关警告', 'blue');
    log('   2. 提交应用后，在 App Store Connect 中验证隐私信息', 'blue');
    log('   3. 确保隐私政策与隐私清单一致', 'blue');
    process.exit(0);
  }
}

main();
