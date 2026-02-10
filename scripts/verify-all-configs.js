#!/usr/bin/env node

/**
 * 统一配置验证脚本
 * 
 * 此脚本运行所有配置验证检查：
 * 1. 环境变量安全
 * 2. iOS版本配置
 * 3. 应用图标
 * 4. 权限配置
 * 5. 隐私清单
 * 6. EAS配置
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, description) {
  const scriptPath = path.join(__dirname, scriptName);
  
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${description}`, 'bold');
  log('='.repeat(60), 'blue');
  
  try {
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return { success: true, name: description };
  } catch (error) {
    return { success: false, name: description, error };
  }
}

function main() {
  log('\n🔍 运行所有配置验证检查\n', 'bold');
  log('这将验证所有iOS发布配置是否正确...\n', 'dim');

  const results = [];

  // 1. 环境变量安全验证
  results.push(runScript('verify-env-security.js', '1. 环境变量安全验证'));

  // 2. iOS版本配置验证
  results.push(runScript('verify-ios-version.js', '2. iOS版本配置验证'));

  // 3. 应用图标验证
  results.push(runScript('verify-app-icon.js', '3. 应用图标验证'));

  // 4. 权限配置验证
  results.push(runScript('verify-permissions.js', '4. 权限配置验证'));

  // 5. 隐私清单验证
  results.push(runScript('verify-privacy-manifest.js', '5. 隐私清单验证'));

  // 6. EAS配置验证
  results.push(runScript('verify-eas-config.js', '6. EAS配置验证'));

  // 总结
  log('\n' + '='.repeat(60), 'blue');
  log('验证结果总结', 'bold');
  log('='.repeat(60), 'blue');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\n总计: ${results.length} 项检查`, 'blue');
  log(`通过: ${passed} 项`, 'green');
  if (failed > 0) {
    log(`失败: ${failed} 项`, 'red');
  }

  log('\n检查详情:', 'blue');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`  ${status} ${result.name}`, color);
  });

  if (failed > 0) {
    log('\n⚠️  部分检查失败，请查看上面的详细信息', 'yellow');
    log('修复问题后重新运行此脚本', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ 所有配置验证通过！', 'green');
    log('\n下一步:', 'blue');
    log('  1. 运行测试: yarn test:release', 'blue');
    log('  2. 运行预览构建: eas build --profile preview --platform ios', 'blue');
    log('  3. 查看发布检查清单: docs/release-checklist.md', 'blue');
    process.exit(0);
  }
}

main();
