#!/usr/bin/env node

/**
 * EAS配置验证脚本
 * 
 * 此脚本检查：
 * 1. eas.json文件是否存在
 * 2. 生产环境配置是否正确
 * 3. 自动版本递增是否启用
 * 4. 分发类型是否正确
 * 5. 环境变量是否配置
 * 6. 提交配置是否完整
 */

const fs = require('fs');
const path = require('path');

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

function readEasConfig() {
  try {
    const configPath = path.join(process.cwd(), 'eas.json');
    
    if (!fs.existsSync(configPath)) {
      log('❌ eas.json 文件不存在', 'red');
      return null;
    }

    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    return { path: configPath, config };
  } catch (error) {
    log(`❌ 无法读取或解析 eas.json: ${error.message}`, 'red');
    return null;
  }
}

function checkProductionBuildConfig(config) {
  const issues = [];
  const warnings = [];
  const info = [];

  if (!config.build) {
    issues.push('缺少 build 配置');
    return { issues, warnings, info };
  }

  if (!config.build.production) {
    issues.push('缺少 production 构建配置');
    return { issues, warnings, info };
  }

  const production = config.build.production;

  // 检查自动版本递增
  if (production.autoIncrement !== true) {
    issues.push('autoIncrement 未启用或设置不正确');
    issues.push('  应该设置为 true 以自动递增构建号');
  } else {
    info.push('✓ autoIncrement 已启用');
  }

  // 检查分发类型
  if (production.distribution !== 'store') {
    issues.push(`distribution 设置不正确: ${production.distribution}`);
    issues.push('  应该设置为 "store" 用于应用商店分发');
  } else {
    info.push('✓ distribution 设置为 store');
  }

  // 检查iOS配置
  if (!production.ios) {
    warnings.push('缺少 ios 配置');
  } else {
    if (production.ios.distribution !== 'store') {
      issues.push('ios.distribution 应该设置为 "store"');
    } else {
      info.push('✓ ios.distribution 设置为 store');
    }
  }

  // 检查Android配置
  if (!production.android) {
    warnings.push('缺少 android 配置');
  } else {
    if (production.android.buildType !== 'app-bundle') {
      warnings.push('android.buildType 建议设置为 "app-bundle"');
      warnings.push('  Google Play 要求使用 AAB 格式');
    } else {
      info.push('✓ android.buildType 设置为 app-bundle');
    }
  }

  // 检查环境变量
  if (!production.env) {
    warnings.push('缺少 env 配置');
  } else {
    if (production.env.NODE_ENV !== 'production') {
      warnings.push('NODE_ENV 应该设置为 "production"');
    } else {
      info.push('✓ NODE_ENV 设置为 production');
    }
  }

  return { issues, warnings, info };
}

function checkSubmitConfig(config) {
  const issues = [];
  const warnings = [];
  const info = [];

  if (!config.submit) {
    warnings.push('缺少 submit 配置');
    warnings.push('  添加 submit 配置可以自动提交到应用商店');
    return { issues, warnings, info };
  }

  if (!config.submit.production) {
    warnings.push('缺少 production 提交配置');
    return { issues, warnings, info };
  }

  const production = config.submit.production;

  // 检查iOS提交配置
  if (!production.ios) {
    warnings.push('缺少 ios 提交配置');
    warnings.push('  需要配置 appleId, ascAppId, appleTeamId');
  } else {
    const ios = production.ios;
    const placeholders = ['your-apple-id@example.com', 'your-app-store-connect-app-id', 'your-team-id'];
    
    if (!ios.appleId || placeholders.includes(ios.appleId)) {
      warnings.push('ios.appleId 需要配置为实际的 Apple ID');
    } else {
      info.push('✓ ios.appleId 已配置');
    }

    if (!ios.ascAppId || placeholders.includes(ios.ascAppId)) {
      warnings.push('ios.ascAppId 需要配置为实际的 App Store Connect 应用ID');
    } else {
      info.push('✓ ios.ascAppId 已配置');
    }

    if (!ios.appleTeamId || placeholders.includes(ios.appleTeamId)) {
      warnings.push('ios.appleTeamId 需要配置为实际的团队ID');
    } else {
      info.push('✓ ios.appleTeamId 已配置');
    }
  }

  // 检查Android提交配置
  if (!production.android) {
    info.push('ℹ️  未配置 android 提交（可选）');
  } else {
    if (production.android.serviceAccountKeyPath) {
      info.push('✓ android.serviceAccountKeyPath 已配置');
    }
    if (production.android.track) {
      info.push(`✓ android.track 设置为 ${production.android.track}`);
    }
  }

  return { issues, warnings, info };
}

function checkCliConfig(config) {
  const issues = [];
  const warnings = [];
  const info = [];

  if (!config.cli) {
    warnings.push('缺少 cli 配置');
    return { issues, warnings, info };
  }

  // 检查CLI版本
  if (config.cli.version) {
    info.push(`✓ CLI 版本要求: ${config.cli.version}`);
  }

  // 检查appVersionSource
  if (config.cli.appVersionSource === 'remote') {
    info.push('✓ appVersionSource 设置为 remote（支持自动版本递增）');
  } else if (config.cli.appVersionSource === 'local') {
    warnings.push('appVersionSource 设置为 local');
    warnings.push('  建议设置为 "remote" 以支持自动版本递增');
  }

  return { issues, warnings, info };
}

function checkOtherProfiles(config) {
  const info = [];
  const warnings = [];

  if (!config.build) {
    return { info, warnings };
  }

  // 检查development配置
  if (config.build.development) {
    info.push('✓ development 配置存在');
  } else {
    warnings.push('建议添加 development 配置用于本地开发');
  }

  // 检查preview配置
  if (config.build.preview) {
    info.push('✓ preview 配置存在');
  } else {
    warnings.push('建议添加 preview 配置用于内部测试');
  }

  return { info, warnings };
}

function main() {
  log('\n⚙️  EAS 配置验证\n', 'bold');

  let hasIssues = false;
  let hasWarnings = false;

  // 1. 读取配置文件
  const easConfig = readEasConfig();
  if (!easConfig) {
    log('\n❌ 验证失败：无法读取 eas.json 文件', 'red');
    process.exit(1);
  }

  log('✅ eas.json 文件存在', 'green');
  log(`   位置: ${easConfig.path}\n`, 'blue');

  // 2. 检查CLI配置
  log('1. 检查CLI配置...\n', 'blue');
  const cliResult = checkCliConfig(easConfig.config);
  
  if (cliResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    cliResult.issues.forEach(issue => log(`      - ${issue}`, 'red'));
  }
  
  if (cliResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  建议:', 'yellow');
    cliResult.warnings.forEach(warning => log(`      - ${warning}`, 'yellow'));
  }
  
  if (cliResult.info.length > 0) {
    cliResult.info.forEach(info => log(`   ${info}`, 'green'));
  }
  log('');

  // 3. 检查生产构建配置
  log('2. 检查生产构建配置...\n', 'blue');
  const buildResult = checkProductionBuildConfig(easConfig.config);
  
  if (buildResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    buildResult.issues.forEach(issue => log(`      - ${issue}`, 'red'));
  }
  
  if (buildResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  建议:', 'yellow');
    buildResult.warnings.forEach(warning => log(`      - ${warning}`, 'yellow'));
  }
  
  if (buildResult.info.length > 0) {
    buildResult.info.forEach(info => log(`   ${info}`, 'green'));
  }
  log('');

  // 4. 检查提交配置
  log('3. 检查提交配置...\n', 'blue');
  const submitResult = checkSubmitConfig(easConfig.config);
  
  if (submitResult.issues.length > 0) {
    hasIssues = true;
    log('   ❌ 发现问题:', 'red');
    submitResult.issues.forEach(issue => log(`      - ${issue}`, 'red'));
  }
  
  if (submitResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  需要配置:', 'yellow');
    submitResult.warnings.forEach(warning => log(`      - ${warning}`, 'yellow'));
  }
  
  if (submitResult.info.length > 0) {
    submitResult.info.forEach(info => log(`   ${info}`, 'green'));
  }
  log('');

  // 5. 检查其他配置
  log('4. 检查其他构建配置...\n', 'blue');
  const otherResult = checkOtherProfiles(easConfig.config);
  
  if (otherResult.warnings.length > 0) {
    hasWarnings = true;
    log('   ⚠️  建议:', 'yellow');
    otherResult.warnings.forEach(warning => log(`      - ${warning}`, 'yellow'));
  }
  
  if (otherResult.info.length > 0) {
    otherResult.info.forEach(info => log(`   ${info}`, 'green'));
  }
  log('');

  // 总结
  log('='.repeat(50), 'blue');
  if (hasIssues) {
    log('❌ 验证失败：发现严重问题，请修复后再继续', 'red');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/eas-build-configuration-guide.md', 'blue');
    log('   - https://docs.expo.dev/build-reference/eas-json/', 'blue');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  验证通过，但有一些建议', 'yellow');
    log('\n下一步：', 'blue');
    log('   1. 配置 iOS 提交信息（appleId, ascAppId, appleTeamId）', 'blue');
    log('   2. 配置 EAS Secrets（运行 yarn verify:env）', 'blue');
    log('   3. 运行测试构建：eas build --profile preview --platform ios', 'blue');
    log('\n📖 查看详细指南：', 'blue');
    log('   - docs/eas-build-configuration-guide.md', 'blue');
    process.exit(0);
  } else {
    log('✅ EAS 配置验证通过！', 'green');
    log('\n下一步：', 'blue');
    log('   1. 运行测试构建：eas build --profile preview --platform ios', 'blue');
    log('   2. 运行生产构建：eas build --profile production --platform ios', 'blue');
    log('   3. 提交到 App Store：eas submit --platform ios --profile production', 'blue');
    process.exit(0);
  }
}

main();
