/**
 * CleanupReporter Component
 * 
 * Responsible for generating cleanup reports and documentation.
 * Implements reporting functionality defined in the design document.
 * 
 * **Validates: Requirements 6.5, 7.1, 7.2, 7.3**
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BundleSizeComparison, CIResult } from './CIVerifier';
import type { DeprecatedItem } from './FileScanner';

/**
 * Phase execution result
 */
export interface PhaseResult {
  phaseName: string;
  success: boolean;
  filesAffected: number;
  duration: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Cleanup summary data
 */
export interface CleanupSummary {
  timestamp: string;
  dryRun: boolean;
  phases: PhaseResult[];
  removedFiles: string[];
  movedFiles: { source: string; destination: string }[];
  removedDirectories: string[];
  deprecatedItemsRemoved: DeprecatedItem[];
  deprecatedItemsTracked: DeprecatedItem[]; // Items with removal dates
  bundleSizeComparison: BundleSizeComparison;
  ciResults: CIResult[];
}

/**
 * CleanupReporter
 * 
 * Generates cleanup reports, summaries, and updates documentation.
 */
export class CleanupReporter {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Log CI check results to a file
   * 
   * Writes CI verification results to docs/cleanup-ci-log.txt with timestamps
   * and detailed check information.
   * 
   * **Validates: Requirements 6.5**
   * 
   * @param result - CI verification result
   * @param logPath - Path to log file (docs/cleanup-ci-log.txt)
   */
  async logCIResult(result: CIResult, logPath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, logPath);
    const timestamp = new Date().toISOString();

    // Format CI result as log entry
    const logEntry = [
      `\n${'='.repeat(80)}`,
      `CI Verification - ${timestamp}`,
      `${'='.repeat(80)}`,
      ``,
      `Overall Status: ${result.success ? '✓ PASSED' : '✗ FAILED'}`,
      `Duration: ${(result.duration / 1000).toFixed(2)}s`,
      ``,
      `Checks:`,
      ...result.checks.map(check => {
        const status = check.success ? '✓' : '✗';
        const duration = (check.duration / 1000).toFixed(2);
        return [
          `  ${status} ${check.name} (${duration}s)`,
          check.output ? `    Output: ${check.output.split('\n')[0].substring(0, 100)}...` : '',
        ].filter(Boolean).join('\n');
      }),
      ``,
    ].join('\n');

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Append to log file
    await fs.promises.appendFile(fullPath, logEntry, 'utf-8');
  }

  /**
   * Generate cleanup summary report
   * 
   * Creates a comprehensive markdown summary at docs/cleanup-summary-2026.md
   * with all cleanup operations, results, and metrics.
   * 
   * **Validates: Requirements 7.1**
   * 
   * @param summary - Cleanup summary data
   * @param outputPath - Path to summary file (docs/cleanup-summary-2026.md)
   */
  async generateSummary(
    summary: CleanupSummary,
    outputPath: string
  ): Promise<void> {
    const fullPath = path.join(this.projectRoot, outputPath);
    const timestamp = new Date(summary.timestamp).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Build markdown content
    const content = [
      `# 心晴MO 清理总结报告`,
      ``,
      `**生成时间**: ${timestamp}`,
      `**执行模式**: ${summary.dryRun ? '🔍 Dry Run（模拟）' : '✅ 实际执行'}`,
      ``,
      `---`,
      ``,
      `## 📊 执行概览`,
      ``,
      this.formatPhasesSummary(summary.phases),
      ``,
      `## 📁 文件操作`,
      ``,
      `### 删除的文件 (${summary.removedFiles.length})`,
      ``,
      summary.removedFiles.length > 0
        ? summary.removedFiles.map(f => `- \`${f}\``).join('\n')
        : '_无文件删除_',
      ``,
      `### 移动的文件 (${summary.movedFiles.length})`,
      ``,
      summary.movedFiles.length > 0
        ? summary.movedFiles.map(m => `- \`${m.source}\` → \`${m.destination}\``).join('\n')
        : '_无文件移动_',
      ``,
      `### 删除的目录 (${summary.removedDirectories.length})`,
      ``,
      summary.removedDirectories.length > 0
        ? summary.removedDirectories.map(d => `- \`${d}\``).join('\n')
        : '_无目录删除_',
      ``,
      `## 🗑️ 废弃代码处理`,
      ``,
      `### 已删除的废弃项 (${summary.deprecatedItemsRemoved.length})`,
      ``,
      summary.deprecatedItemsRemoved.length > 0
        ? summary.deprecatedItemsRemoved.map(item => 
            `- \`${item.itemName}\` in \`${item.filePath}\` (line ${item.lineNumber})`
          ).join('\n')
        : '_无废弃代码删除_',
      ``,
      `### 跟踪中的废弃项 (${summary.deprecatedItemsTracked.length})`,
      ``,
      summary.deprecatedItemsTracked.length > 0
        ? summary.deprecatedItemsTracked.map(item => 
            `- \`${item.itemName}\` in \`${item.filePath}\` - 计划移除: ${item.removalDate || '待定'}`
          ).join('\n')
        : '_无废弃项跟踪_',
      ``,
      `## 📦 Bundle 大小对比`,
      ``,
      this.formatBundleSizeComparison(summary.bundleSizeComparison),
      ``,
      `## ✅ CI 验证结果`,
      ``,
      this.formatCIResults(summary.ciResults),
      ``,
      `---`,
      ``,
      `## 📝 总结`,
      ``,
      this.generateConclusion(summary),
      ``,
    ].join('\n');

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write summary file
    await fs.promises.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Update README.md project structure section
   * 
   * Removes deleted directories from the project structure tree in README.md.
   * 
   * **Validates: Requirements 7.2**
   * 
   * @param removedDirectories - Directories that were removed
   */
  async updateReadmeStructure(removedDirectories: string[]): Promise<void> {
    if (removedDirectories.length === 0) {
      return; // Nothing to update
    }

    const readmePath = path.join(this.projectRoot, 'README.md');
    
    try {
      const content = await fs.promises.readFile(readmePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Remove lines mentioning deleted directories
      for (const dir of removedDirectories) {
        // Match lines like "├── dirname/" or "│   ├── dirname/"
        const dirName = dir.replace(/\/$/, '').split('/').pop();
        if (!dirName) continue;

        // Create regex to match directory lines in the tree structure
        // This matches lines with tree characters followed by the directory name
        const regex = new RegExp(`^.*[│├└].*${dirName}/.*$`, 'gm');
        const beforeReplace = updatedContent;
        updatedContent = updatedContent.replace(regex, '');
        
        if (beforeReplace !== updatedContent) {
          hasChanges = true;
        }
      }

      // Clean up empty lines (more than 2 consecutive)
      const beforeCleanup = updatedContent;
      updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');
      
      if (beforeCleanup !== updatedContent) {
        hasChanges = true;
      }

      // Write back if changed
      if (hasChanges) {
        await fs.promises.writeFile(readmePath, updatedContent, 'utf-8');
      }
    } catch (error: any) {
      throw new Error(`Failed to update README.md: ${error.message}`);
    }
  }

  /**
   * Generate deprecated items tracking report
   * 
   * Creates a markdown report tracking deprecated items with removal dates
   * and migration guides.
   * 
   * **Validates: Requirements 7.3**
   * 
   * @param items - Deprecated items with removal dates
   * @param outputPath - Path to tracking report
   */
  async generateDeprecatedTrackingReport(
    items: DeprecatedItem[],
    outputPath: string
  ): Promise<void> {
    const fullPath = path.join(this.projectRoot, outputPath);
    const timestamp = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Sort items by removal date
    const sortedItems = [...items].sort((a, b) => {
      if (!a.removalDate) return 1;
      if (!b.removalDate) return -1;
      return a.removalDate.localeCompare(b.removalDate);
    });

    // Group by removal date
    const itemsByDate = new Map<string, DeprecatedItem[]>();
    for (const item of sortedItems) {
      const date = item.removalDate || '待定';
      if (!itemsByDate.has(date)) {
        itemsByDate.set(date, []);
      }
      itemsByDate.get(date)!.push(item);
    }

    // Build markdown content
    const content = [
      `# 废弃代码跟踪报告`,
      ``,
      `**生成时间**: ${timestamp}`,
      `**跟踪项总数**: ${items.length}`,
      ``,
      `---`,
      ``,
      `## 📋 按移除日期分组`,
      ``,
      ...Array.from(itemsByDate.entries()).map(([date, dateItems]) => [
        `### ${date === '待定' ? '⏳ 待定' : `📅 ${date}`}`,
        ``,
        ...dateItems.map(item => [
          `#### \`${item.itemName}\``,
          ``,
          `- **文件**: \`${item.filePath}\``,
          `- **行号**: ${item.lineNumber}`,
          `- **注解**: ${item.annotation}`,
          item.isUsed ? `- **状态**: ⚠️ 仍在使用` : `- **状态**: ✅ 未使用`,
          item.usageLocations.length > 0 
            ? `- **使用位置**:\n${item.usageLocations.map(loc => `  - \`${loc}\``).join('\n')}`
            : '',
          item.migrationGuide ? `- **迁移指南**: ${item.migrationGuide}` : '',
          item.permanent ? `- **永久保留**: ✓` : '',
          ``,
        ].filter(Boolean).join('\n')),
        ``,
      ].join('\n')),
      `---`,
      ``,
      `## 📝 说明`,
      ``,
      `- **⚠️ 仍在使用**: 该废弃项仍被其他代码引用，需要先迁移使用方`,
      `- **✅ 未使用**: 该废弃项未被引用，可以安全删除`,
      `- **永久保留**: 标记为永久保留的项不会被自动删除`,
      ``,
      `## 🔄 下一步行动`,
      ``,
      `1. 对于"仍在使用"的废弃项，参考迁移指南更新使用方代码`,
      `2. 对于"未使用"的废弃项，可以在下次清理中安全删除`,
      `3. 定期检查移除日期，及时处理到期的废弃项`,
      ``,
    ].join('\n');

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write tracking report
    await fs.promises.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Format phases summary table
   */
  private formatPhasesSummary(phases: PhaseResult[]): string {
    const rows = phases.map(phase => {
      const status = phase.success ? '✓' : '✗';
      const duration = (phase.duration / 1000).toFixed(2);
      const mode = phase.dryRun ? '模拟' : '执行';
      return `| ${status} | ${phase.phaseName} | ${phase.filesAffected} | ${duration}s | ${mode} |`;
    });

    return [
      `| 状态 | 阶段 | 影响文件数 | 耗时 | 模式 |`,
      `|------|------|-----------|------|------|`,
      ...rows,
    ].join('\n');
  }

  /**
   * Format bundle size comparison
   */
  private formatBundleSizeComparison(comparison: BundleSizeComparison): string {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const status = comparison.passed ? '✅ 通过' : '❌ 未通过';
    const changeIcon = comparison.change < 0 ? '📉' : comparison.change > 0 ? '📈' : '➡️';
    const changePercent = comparison.changePercent.toFixed(2);

    return [
      `- **状态**: ${status}`,
      `- **清理前**: ${formatSize(comparison.before)}`,
      `- **清理后**: ${formatSize(comparison.after)}`,
      `- **变化**: ${changeIcon} ${formatSize(Math.abs(comparison.change))} (${changePercent}%)`,
    ].join('\n');
  }

  /**
   * Format CI results
   */
  private formatCIResults(ciResults: CIResult[]): string {
    if (ciResults.length === 0) {
      return '_未运行 CI 检查_';
    }

    return ciResults.map((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      const duration = (result.duration / 1000).toFixed(2);

      const checks = result.checks.map(check => {
        const checkStatus = check.success ? '✓' : '✗';
        const checkDuration = (check.duration / 1000).toFixed(2);
        return `  - ${checkStatus} ${check.name} (${checkDuration}s)`;
      }).join('\n');

      return [
        `### CI 运行 #${index + 1}`,
        ``,
        `- **状态**: ${status}`,
        `- **耗时**: ${duration}s`,
        `- **检查项**:`,
        checks,
      ].join('\n');
    }).join('\n\n');
  }

  /**
   * Generate conclusion based on summary data
   */
  private generateConclusion(summary: CleanupSummary): string {
    const totalFiles = summary.removedFiles.length + summary.movedFiles.length;
    const totalDirs = summary.removedDirectories.length;
    const allPhasesSuccess = summary.phases.every(p => p.success);
    const bundlePassed = summary.bundleSizeComparison.passed;
    const ciPassed = summary.ciResults.every(r => r.success);

    const conclusions: string[] = [];

    if (summary.dryRun) {
      conclusions.push('🔍 **这是一次模拟运行**，未实际修改文件。请检查上述报告，确认无误后使用 `--force` 标志执行实际清理。');
    } else {
      if (allPhasesSuccess && bundlePassed && ciPassed) {
        conclusions.push('✅ **清理成功完成**！所有阶段执行成功，CI 检查通过，Bundle 大小在允许范围内。');
      } else {
        conclusions.push('⚠️ **清理过程中遇到问题**，请检查上述详细信息。');
        if (!allPhasesSuccess) {
          conclusions.push('- 部分阶段执行失败');
        }
        if (!bundlePassed) {
          conclusions.push('- Bundle 大小超出允许范围');
        }
        if (!ciPassed) {
          conclusions.push('- CI 检查未通过');
        }
      }
    }

    conclusions.push('');
    conclusions.push(`本次清理共处理 **${totalFiles}** 个文件和 **${totalDirs}** 个目录。`);

    if (summary.deprecatedItemsTracked.length > 0) {
      conclusions.push('');
      conclusions.push(`📋 有 **${summary.deprecatedItemsTracked.length}** 个废弃项正在跟踪中，请查看废弃代码跟踪报告了解详情。`);
    }

    return conclusions.join('\n');
  }
}
