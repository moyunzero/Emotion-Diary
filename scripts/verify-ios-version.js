#!/usr/bin/env node

/**
 * iOS版本配置一致性验证脚本
 * 
 * 此脚本检查：
 * 1. app.json 中的 ios.minimumOsVersion
 * 2. Xcode 项目中的 IPHONEOS_DEPLOYMENT_TARGET
 * 3. 两者是否一致
 */

const fs = require('fs');
const path = require('path');
const { findXcodePbxprojPath, hasIosNativeProject } = require('./ios-project-paths');

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

function readAppJson() {
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(content);
    return appJson.expo?.ios?.minimumOsVersion || null;
  } catch (error) {
    log(`❌ 无法读取 app.json: ${error.message}`, 'red');
    return null;
  }
}

function readXcodeProjectVersion() {
  try {
    const pbxprojPath = findXcodePbxprojPath();

    if (!pbxprojPath) {
      log('ℹ️  Xcode 项目文件不存在（可能还未运行 expo prebuild）', 'blue');
      return null;
    }

    const content = fs.readFileSync(pbxprojPath, 'utf8');
    
    // 查找 IPHONEOS_DEPLOYMENT_TARGET
    const regex = /IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([0-9.]+);/g;
    const matches = [...content.matchAll(regex)];
    
    if (matches.length === 0) {
      log('⚠️  未找到 IPHONEOS_DEPLOYMENT_TARGET 配置', 'yellow');
      return null;
    }

    // 获取所有匹配的版本号
    const versions = matches.map(match => match[1]);
    
    // 检查是否所有版本号都一致
    const uniqueVersions = [...new Set(versions)];
    
    if (uniqueVersions.length > 1) {
      log(`⚠️  Xcode 项目中存在多个不同的 IPHONEOS_DEPLOYMENT_TARGET 值: ${uniqueVersions.join(', ')}`, 'yellow');
    }

    return uniqueVersions[0];
  } catch (error) {
    log(`❌ 无法读取 Xcode 项目文件: ${error.message}`, 'red');
    return null;
  }
}

function compareVersions(v1, v2) {
  if (!v1 || !v2) return false;
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  // 补齐版本号长度
  while (parts1.length < parts2.length) parts1.push(0);
  while (parts2.length < parts1.length) parts2.push(0);
  
  for (let i = 0; i < parts1.length; i++) {
    if (parts1[i] !== parts2[i]) return false;
  }
  
  return true;
}

function main() {
  log('\n🔍 iOS 版本配置一致性检查\n', 'bold');

  let hasIssues = false;

  // 读取 app.json 中的版本
  log('1. 检查 app.json 配置...', 'blue');
  const appJsonVersion = readAppJson();
  
  if (appJsonVersion) {
    log(`   ✅ app.json 中的 minimumOsVersion: ${appJsonVersion}`, 'green');
  } else {
    log('   ❌ app.json 中未找到 ios.minimumOsVersion', 'red');
    hasIssues = true;
  }

  // 读取 Xcode 项目中的版本
  log('\n2. 检查 Xcode 项目配置...', 'blue');
  const xcodeVersion = readXcodeProjectVersion();
  
  if (xcodeVersion) {
    log(`   ✅ Xcode 项目中的 IPHONEOS_DEPLOYMENT_TARGET: ${xcodeVersion}`, 'green');
  } else if (xcodeVersion === null && !hasIosNativeProject()) {
    log('   ℹ️  Xcode 项目尚未生成，运行 expo prebuild 后将自动同步', 'blue');
  } else {
    log('   ❌ Xcode 项目中未找到 IPHONEOS_DEPLOYMENT_TARGET', 'red');
    hasIssues = true;
  }

  // 比较版本
  log('\n3. 比较版本一致性...', 'blue');
  
  if (appJsonVersion && xcodeVersion) {
    if (compareVersions(appJsonVersion, xcodeVersion)) {
      log(`   ✅ 版本配置一致: ${appJsonVersion}`, 'green');
    } else {
      log(`   ❌ 版本配置不一致!`, 'red');
      log(`      app.json: ${appJsonVersion}`, 'red');
      log(`      Xcode:    ${xcodeVersion}`, 'red');
      log('\n   建议：', 'yellow');
      log('      1. 确保 app.json 中的版本正确', 'yellow');
      log('      2. 运行 expo prebuild --clean 重新生成 iOS 项目', 'yellow');
      log('      3. 或手动更新 Xcode 项目中的 IPHONEOS_DEPLOYMENT_TARGET', 'yellow');
      hasIssues = true;
    }
  } else if (appJsonVersion && !xcodeVersion) {
    log('   ℹ️  Xcode 项目尚未生成或无法读取', 'blue');
    log('   运行 expo prebuild 后将使用 app.json 中的配置', 'blue');
  }

  // iOS 15.1 版本说明
  log('\n4. iOS 15.1 版本选择说明...', 'blue');
  log('   ✅ iOS 15.1 于 2021年10月 发布', 'green');
  log('   ✅ 支持 React Native 新架构特性', 'green');
  log('   ✅ 覆盖约 95% 的活跃 iOS 设备', 'green');
  log('   ✅ 支持所有必需的 API（Face ID、Secure Store 等）', 'green');

  // 总结
  log('\n' + '='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 发现配置问题，请修复后再继续', 'red');
    process.exit(1);
  } else {
    log('✅ iOS 版本配置检查通过！', 'green');
    process.exit(0);
  }
}

main();
