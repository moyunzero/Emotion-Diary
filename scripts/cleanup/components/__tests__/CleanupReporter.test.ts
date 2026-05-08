/**
 * Unit tests for CleanupReporter
 * 
 * Tests the cleanup reporting component to ensure it correctly generates
 * reports, logs CI results, and updates documentation.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CIResult } from '../CIVerifier';
import { CleanupReporter, CleanupSummary } from '../CleanupReporter';
import type { DeprecatedItem } from '../FileScanner';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    appendFile: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

const mockFs = fs.promises as jest.Mocked<typeof fs.promises>;

describe('CleanupReporter', () => {
  let reporter: CleanupReporter;
  const testProjectRoot = '/test/project';

  beforeEach(() => {
    reporter = new CleanupReporter(testProjectRoot);
    jest.clearAllMocks();
  });

  describe('logCIResult', () => {
    it('should create log directory if it does not exist', async () => {
      const ciResult: CIResult = {
        success: true,
        checks: [
          { name: 'typecheck', success: true, output: 'All types valid', duration: 1000 },
        ],
        duration: 1000,
      };

      await reporter.logCIResult(ciResult, 'docs/cleanup-ci-log.txt');

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs'),
        { recursive: true }
      );
    });

    it('should append CI result to log file with timestamp', async () => {
      const ciResult: CIResult = {
        success: true,
        checks: [
          { name: 'typecheck', success: true, output: 'All types valid', duration: 1000 },
          { name: 'lint', success: true, output: 'No lint errors', duration: 500 },
        ],
        duration: 1500,
      };

      await reporter.logCIResult(ciResult, 'docs/cleanup-ci-log.txt');

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs/cleanup-ci-log.txt'),
        expect.stringContaining('CI Verification'),
        'utf-8'
      );

      const logContent = (mockFs.appendFile as jest.Mock).mock.calls[0][1];
      expect(logContent).toContain('Overall Status: ✓ PASSED');
      expect(logContent).toContain('Duration: 1.50s');
      expect(logContent).toContain('✓ typecheck (1.00s)');
      expect(logContent).toContain('✓ lint (0.50s)');
    });

    it('should log failed CI result correctly', async () => {
      const ciResult: CIResult = {
        success: false,
        checks: [
          { name: 'typecheck', success: true, output: 'All types valid', duration: 1000 },
          { name: 'lint', success: false, output: 'Error: Unused variable', duration: 500 },
        ],
        duration: 1500,
      };

      await reporter.logCIResult(ciResult, 'docs/cleanup-ci-log.txt');

      const logContent = (mockFs.appendFile as jest.Mock).mock.calls[0][1];
      expect(logContent).toContain('Overall Status: ✗ FAILED');
      expect(logContent).toContain('✗ lint (0.50s)');
    });

    it('should handle checks with empty output', async () => {
      const ciResult: CIResult = {
        success: true,
        checks: [
          { name: 'typecheck', success: true, output: '', duration: 1000 },
        ],
        duration: 1000,
      };

      await reporter.logCIResult(ciResult, 'docs/cleanup-ci-log.txt');

      const logContent = (mockFs.appendFile as jest.Mock).mock.calls[0][1];
      expect(logContent).toContain('✓ typecheck (1.00s)');
      expect(logContent).not.toContain('Output:');
    });
  });

  describe('generateSummary', () => {
    it('should generate comprehensive cleanup summary', async () => {
      const summary: CleanupSummary = {
        timestamp: '2026-01-15T10:30:00.000Z',
        dryRun: false,
        phases: [
          {
            phaseName: 'Documentation Cleanup',
            success: true,
            filesAffected: 5,
            duration: 2000,
            errors: [],
            dryRun: false,
          },
          {
            phaseName: 'Empty Directories',
            success: true,
            filesAffected: 3,
            duration: 1000,
            errors: [],
            dryRun: false,
          },
        ],
        removedFiles: ['docs/OLD_SUMMARY.md', 'docs/TEST_FIX.md'],
        movedFiles: [
          { source: 'docs/ANALYSIS.md', destination: 'docs/archive/ANALYSIS.md' },
        ],
        removedDirectories: ['src/empty-dir/', 'src/test-empty/'],
        deprecatedItemsRemoved: [
          {
            filePath: 'utils/old.ts',
            itemName: 'oldFunction',
            lineNumber: 10,
            annotation: '@deprecated Use newFunction instead',
            isUsed: false,
            usageLocations: [],
          },
        ],
        deprecatedItemsTracked: [
          {
            filePath: 'utils/legacy.ts',
            itemName: 'legacyFunction',
            lineNumber: 20,
            annotation: '@deprecated',
            isUsed: true,
            usageLocations: ['components/OldComponent.tsx'],
            removalDate: '2026-08-01',
            migrationGuide: 'Use newLegacyFunction instead',
          },
        ],
        bundleSizeComparison: {
          passed: true,
          before: 1024000,
          after: 1020000,
          change: -4000,
          changePercent: -0.39,
        },
        ciResults: [
          {
            success: true,
            checks: [
              { name: 'typecheck', success: true, output: '', duration: 1000 },
              { name: 'lint', success: true, output: '', duration: 500 },
            ],
            duration: 1500,
          },
        ],
      };

      await reporter.generateSummary(summary, 'docs/cleanup-summary-2026.md');

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs'),
        { recursive: true }
      );

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs/cleanup-summary-2026.md'),
        expect.stringContaining('# 心晴MO 清理总结报告'),
        'utf-8'
      );

      const summaryContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      // Check sections
      expect(summaryContent).toContain('## 📊 执行概览');
      expect(summaryContent).toContain('## 📁 文件操作');
      expect(summaryContent).toContain('## 🗑️ 废弃代码处理');
      expect(summaryContent).toContain('## 📦 Bundle 大小对比');
      expect(summaryContent).toContain('## ✅ CI 验证结果');
      expect(summaryContent).toContain('## 📝 总结');

      // Check content
      expect(summaryContent).toContain('Documentation Cleanup');
      expect(summaryContent).toContain('Empty Directories');
      expect(summaryContent).toContain('docs/OLD_SUMMARY.md');
      expect(summaryContent).toContain('docs/ANALYSIS.md');
      expect(summaryContent).toContain('src/empty-dir/');
      expect(summaryContent).toContain('oldFunction');
      expect(summaryContent).toContain('legacyFunction');
      expect(summaryContent).toContain('2026-08-01');
      expect(summaryContent).toContain('✅ 通过');
    });

    it('should handle dry run mode', async () => {
      const summary: CleanupSummary = {
        timestamp: '2026-01-15T10:30:00.000Z',
        dryRun: true,
        phases: [],
        removedFiles: [],
        movedFiles: [],
        removedDirectories: [],
        deprecatedItemsRemoved: [],
        deprecatedItemsTracked: [],
        bundleSizeComparison: {
          passed: true,
          before: 1024000,
          after: 1024000,
          change: 0,
          changePercent: 0,
        },
        ciResults: [],
      };

      await reporter.generateSummary(summary, 'docs/cleanup-summary-2026.md');

      const summaryContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(summaryContent).toContain('🔍 Dry Run（模拟）');
      expect(summaryContent).toContain('🔍 **这是一次模拟运行**');
    });

    it('should handle empty operations', async () => {
      const summary: CleanupSummary = {
        timestamp: '2026-01-15T10:30:00.000Z',
        dryRun: false,
        phases: [],
        removedFiles: [],
        movedFiles: [],
        removedDirectories: [],
        deprecatedItemsRemoved: [],
        deprecatedItemsTracked: [],
        bundleSizeComparison: {
          passed: true,
          before: 1024000,
          after: 1024000,
          change: 0,
          changePercent: 0,
        },
        ciResults: [],
      };

      await reporter.generateSummary(summary, 'docs/cleanup-summary-2026.md');

      const summaryContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(summaryContent).toContain('_无文件删除_');
      expect(summaryContent).toContain('_无文件移动_');
      expect(summaryContent).toContain('_无目录删除_');
      expect(summaryContent).toContain('_无废弃代码删除_');
      expect(summaryContent).toContain('_无废弃项跟踪_');
    });

    it('should format bundle size correctly', async () => {
      const summary: CleanupSummary = {
        timestamp: '2026-01-15T10:30:00.000Z',
        dryRun: false,
        phases: [],
        removedFiles: [],
        movedFiles: [],
        removedDirectories: [],
        deprecatedItemsRemoved: [],
        deprecatedItemsTracked: [],
        bundleSizeComparison: {
          passed: false,
          before: 1024000,
          after: 1030000,
          change: 6000,
          changePercent: 0.59,
        },
        ciResults: [],
      };

      await reporter.generateSummary(summary, 'docs/cleanup-summary-2026.md');

      const summaryContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(summaryContent).toContain('❌ 未通过');
      expect(summaryContent).toContain('📈');
      expect(summaryContent).toContain('0.59%');
    });
  });

  describe('updateReadmeStructure', () => {
    it('should not update README if no directories removed', async () => {
      await reporter.updateReadmeStructure([]);

      expect(mockFs.readFile).not.toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should remove directory lines from README', async () => {
      const readmeContent = `
# Project

## Structure

\`\`\`
project/
├── app/
├── components/
├── old-feature/
│   ├── index.ts
│   └── utils.ts
├── utils/
└── README.md
\`\`\`
`;

      mockFs.readFile.mockResolvedValue(readmeContent);

      await reporter.updateReadmeStructure(['old-feature/']);

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'README.md'),
        'utf-8'
      );

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'README.md'),
        expect.not.stringContaining('old-feature/'),
        'utf-8'
      );
    });

    it('should handle multiple removed directories', async () => {
      const readmeContent = `
\`\`\`
project/
├── app/
├── old-dir-1/
├── old-dir-2/
└── utils/
\`\`\`
`;

      mockFs.readFile.mockResolvedValue(readmeContent);

      await reporter.updateReadmeStructure(['old-dir-1/', 'old-dir-2/']);

      const updatedContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(updatedContent).not.toContain('old-dir-1/');
      expect(updatedContent).not.toContain('old-dir-2/');
      expect(updatedContent).toContain('app/');
      expect(updatedContent).toContain('utils/');
    });

    it('should clean up excessive empty lines', async () => {
      const readmeContent = `
Line 1


Line 2




Line 3
`;

      mockFs.readFile.mockResolvedValue(readmeContent);

      await reporter.updateReadmeStructure(['test/']);

      const updatedContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(updatedContent).not.toMatch(/\n{3,}/);
    });

    it('should throw error if README read fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(
        reporter.updateReadmeStructure(['test/'])
      ).rejects.toThrow('Failed to update README.md');
    });
  });

  describe('generateDeprecatedTrackingReport', () => {
    it('should generate tracking report with grouped items', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/old.ts',
          itemName: 'oldFunction',
          lineNumber: 10,
          annotation: '@deprecated Use newFunction instead',
          isUsed: false,
          usageLocations: [],
          removalDate: '2026-08-01',
        },
        {
          filePath: 'utils/legacy.ts',
          itemName: 'legacyFunction',
          lineNumber: 20,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: ['components/OldComponent.tsx'],
          removalDate: '2026-08-01',
          migrationGuide: 'Use newLegacyFunction instead',
        },
        {
          filePath: 'utils/pending.ts',
          itemName: 'pendingFunction',
          lineNumber: 30,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
        },
      ];

      await reporter.generateDeprecatedTrackingReport(
        items,
        'docs/deprecated-tracking.md'
      );

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs'),
        { recursive: true }
      );

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectRoot, 'docs/deprecated-tracking.md'),
        expect.stringContaining('# 废弃代码跟踪报告'),
        'utf-8'
      );

      const reportContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      // Check sections
      expect(reportContent).toContain('## 📋 按移除日期分组');
      expect(reportContent).toContain('### 📅 2026-08-01');
      expect(reportContent).toContain('### ⏳ 待定');

      // Check items
      expect(reportContent).toContain('oldFunction');
      expect(reportContent).toContain('legacyFunction');
      expect(reportContent).toContain('pendingFunction');
      expect(reportContent).toContain('✅ 未使用');
      expect(reportContent).toContain('⚠️ 仍在使用');
      expect(reportContent).toContain('Use newLegacyFunction instead');
    });

    it('should sort items by removal date', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/c.ts',
          itemName: 'functionC',
          lineNumber: 30,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
          removalDate: '2026-12-01',
        },
        {
          filePath: 'utils/a.ts',
          itemName: 'functionA',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
          removalDate: '2026-06-01',
        },
        {
          filePath: 'utils/b.ts',
          itemName: 'functionB',
          lineNumber: 20,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
          removalDate: '2026-09-01',
        },
      ];

      await reporter.generateDeprecatedTrackingReport(
        items,
        'docs/deprecated-tracking.md'
      );

      const reportContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      // Check order: 2026-06-01 should come before 2026-09-01 and 2026-12-01
      const indexA = reportContent.indexOf('functionA');
      const indexB = reportContent.indexOf('functionB');
      const indexC = reportContent.indexOf('functionC');
      
      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
    });

    it('should handle items with permanent flag', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/permanent.ts',
          itemName: 'permanentFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
          permanent: true,
        },
      ];

      await reporter.generateDeprecatedTrackingReport(
        items,
        'docs/deprecated-tracking.md'
      );

      const reportContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(reportContent).toContain('**永久保留**: ✓');
    });

    it('should handle items with usage locations', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/used.ts',
          itemName: 'usedFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: [
            'components/ComponentA.tsx',
            'components/ComponentB.tsx',
            'utils/helper.ts',
          ],
        },
      ];

      await reporter.generateDeprecatedTrackingReport(
        items,
        'docs/deprecated-tracking.md'
      );

      const reportContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(reportContent).toContain('**使用位置**:');
      expect(reportContent).toContain('components/ComponentA.tsx');
      expect(reportContent).toContain('components/ComponentB.tsx');
      expect(reportContent).toContain('utils/helper.ts');
    });

    it('should include action items in report', async () => {
      const items: DeprecatedItem[] = [];

      await reporter.generateDeprecatedTrackingReport(
        items,
        'docs/deprecated-tracking.md'
      );

      const reportContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      expect(reportContent).toContain('## 🔄 下一步行动');
      expect(reportContent).toContain('对于"仍在使用"的废弃项');
      expect(reportContent).toContain('对于"未使用"的废弃项');
      expect(reportContent).toContain('定期检查移除日期');
    });
  });
});
