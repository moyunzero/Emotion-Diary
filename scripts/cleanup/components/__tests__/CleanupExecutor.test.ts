import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CleanupExecutor } from '../CleanupExecutor';
import type { DeprecatedItem, DocumentationFile } from '../FileScanner';

// Mock child_process
jest.mock('child_process');
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('CleanupExecutor', () => {
  let executor: CleanupExecutor;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(__dirname, 'test-cleanup-executor');
    await fs.promises.mkdir(testDir, { recursive: true });
    executor = new CleanupExecutor(testDir);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('archiveFiles', () => {
    it('should archive files with structure preservation in dry-run mode', async () => {
      // Create test files
      const testFile = 'docs/TEST_SUMMARY.md';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.mkdir(path.dirname(testFilePath), { recursive: true });
      await fs.promises.writeFile(testFilePath, 'Test content');

      const files: DocumentationFile[] = [
        {
          path: testFile,
          pattern: '*_SUMMARY.md',
          archivePath: 'docs/archive/docs/TEST_SUMMARY.md',
        },
      ];

      const result = await executor.archiveFiles(files, true, true);

      expect(result.success).toBe(true);
      expect(result.archivedFiles).toEqual([testFile]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(true);
      
      // File should still exist in dry-run mode
      expect(fs.existsSync(testFilePath)).toBe(true);
    });

    it('should actually move files when not in dry-run mode', async () => {
      // Create test files
      const testFile = 'docs/TEST_SUMMARY.md';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.mkdir(path.dirname(testFilePath), { recursive: true });
      await fs.promises.writeFile(testFilePath, 'Test content');

      const files: DocumentationFile[] = [
        {
          path: testFile,
          pattern: '*_SUMMARY.md',
          archivePath: 'docs/archive/docs/TEST_SUMMARY.md',
        },
      ];

      // Mock git commands to avoid actual git operations
      mockedExecSync.mockImplementation(() => Buffer.from(''));

      const result = await executor.archiveFiles(files, true, false);

      expect(result.success).toBe(true);
      expect(result.archivedFiles).toEqual([testFile]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(false);
      
      // Original file should be moved
      expect(fs.existsSync(testFilePath)).toBe(false);
      
      // File should exist in archive
      const archivePath = path.join(testDir, 'docs/archive/docs/TEST_SUMMARY.md');
      expect(fs.existsSync(archivePath)).toBe(true);
      
      const content = await fs.promises.readFile(archivePath, 'utf-8');
      expect(content).toBe('Test content');
    });

    it('should handle missing source files gracefully', async () => {
      const files: DocumentationFile[] = [
        {
          path: 'nonexistent.md',
          pattern: '*.md',
          archivePath: 'docs/archive/nonexistent.md',
        },
      ];

      const result = await executor.archiveFiles(files, true, true);

      expect(result.success).toBe(false);
      expect(result.archivedFiles).toEqual([]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Source file not found');
    });

    it('should archive without structure preservation when specified', async () => {
      // Create test files
      const testFile = 'docs/subdir/TEST_SUMMARY.md';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.mkdir(path.dirname(testFilePath), { recursive: true });
      await fs.promises.writeFile(testFilePath, 'Test content');

      const files: DocumentationFile[] = [
        {
          path: testFile,
          pattern: '*_SUMMARY.md',
          archivePath: 'docs/archive/docs/subdir/TEST_SUMMARY.md',
        },
      ];

      // Mock git commands
      mockedExecSync.mockImplementation(() => Buffer.from(''));

      const result = await executor.archiveFiles(files, false, false);

      expect(result.success).toBe(true);
      
      // File should be in archive root, not preserving structure
      const archivePath = path.join(testDir, 'docs/archive/TEST_SUMMARY.md');
      expect(fs.existsSync(archivePath)).toBe(true);
    });
  });

  describe('removeFiles', () => {
    it('should remove files in dry-run mode without actual deletion', async () => {
      // Create test files
      const testFile = 'test.bak';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.writeFile(testFilePath, 'Test content');

      const result = await executor.removeFiles([testFile], 'Remove backup files', true);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([testFile]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(true);
      
      // File should still exist in dry-run mode
      expect(fs.existsSync(testFilePath)).toBe(true);
    });

    it('should actually remove files when not in dry-run mode', async () => {
      // Create test files
      const testFile = 'test.bak';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.writeFile(testFilePath, 'Test content');

      // Mock git rm to fail (file not tracked)
      mockedExecSync.mockImplementation(() => {
        throw new Error('not tracked');
      });

      const result = await executor.removeFiles([testFile], 'Remove backup files', false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([testFile]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(false);
      
      // File should be deleted
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it('should handle missing files gracefully', async () => {
      const result = await executor.removeFiles(['nonexistent.bak'], 'Remove backup files', true);

      expect(result.success).toBe(false);
      expect(result.removedItems).toEqual([]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('File not found');
    });

    it('should use git rm when file is tracked', async () => {
      // Create test files
      const testFile = 'tracked.bak';
      const testFilePath = path.join(testDir, testFile);
      await fs.promises.writeFile(testFilePath, 'Test content');

      // Mock successful git rm
      mockedExecSync.mockImplementation(() => Buffer.from(''));

      const result = await executor.removeFiles([testFile], 'Remove backup files', false);

      expect(result.success).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git rm -f'),
        expect.any(Object)
      );
    });
  });

  describe('removeEmptyDirectories', () => {
    it('should remove empty directories in dry-run mode', async () => {
      // Create empty directory
      const emptyDir = 'src/empty-dir';
      const emptyDirPath = path.join(testDir, emptyDir);
      await fs.promises.mkdir(emptyDirPath, { recursive: true });

      const result = await executor.removeEmptyDirectories([emptyDir], true);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([emptyDir]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(true);
      
      // Directory should still exist in dry-run mode
      expect(fs.existsSync(emptyDirPath)).toBe(true);
    });

    it('should actually remove empty directories when not in dry-run mode', async () => {
      // Create empty directory
      const emptyDir = 'src/empty-dir';
      const emptyDirPath = path.join(testDir, emptyDir);
      await fs.promises.mkdir(emptyDirPath, { recursive: true });

      const result = await executor.removeEmptyDirectories([emptyDir], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([emptyDir]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(false);
      
      // Directory should be deleted
      expect(fs.existsSync(emptyDirPath)).toBe(false);
    });

    it('should remove directories with only ignored files', async () => {
      // Create directory with .gitkeep
      const emptyDir = 'src/empty-with-gitkeep';
      const emptyDirPath = path.join(testDir, emptyDir);
      await fs.promises.mkdir(emptyDirPath, { recursive: true });
      await fs.promises.writeFile(path.join(emptyDirPath, '.gitkeep'), '');

      const result = await executor.removeEmptyDirectories([emptyDir], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([emptyDir]);
      
      // Directory should be deleted
      expect(fs.existsSync(emptyDirPath)).toBe(false);
    });

    it('should not remove directories with meaningful content', async () => {
      // Create directory with actual file
      const nonEmptyDir = 'src/non-empty-dir';
      const nonEmptyDirPath = path.join(testDir, nonEmptyDir);
      await fs.promises.mkdir(nonEmptyDirPath, { recursive: true });
      await fs.promises.writeFile(path.join(nonEmptyDirPath, 'file.ts'), 'content');

      const result = await executor.removeEmptyDirectories([nonEmptyDir], false);

      expect(result.success).toBe(false);
      expect(result.removedItems).toEqual([]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Directory not empty');
      
      // Directory should still exist
      expect(fs.existsSync(nonEmptyDirPath)).toBe(true);
    });

    it('should remove nested directories in correct order (deepest first)', async () => {
      // Create nested empty directories
      const dirs = ['src/a/b/c', 'src/a/b', 'src/a'];
      for (const dir of dirs) {
        await fs.promises.mkdir(path.join(testDir, dir), { recursive: true });
      }

      const result = await executor.removeEmptyDirectories(dirs, false);

      expect(result.success).toBe(true);
      expect(result.removedItems.length).toBe(3);
      
      // All directories should be deleted
      for (const dir of dirs) {
        expect(fs.existsSync(path.join(testDir, dir))).toBe(false);
      }
    });
  });

  describe('removeDeprecatedCode', () => {
    it('should remove deprecated function in dry-run mode', async () => {
      // Create test file with deprecated function
      const testFile = 'test.ts';
      const testFilePath = path.join(testDir, testFile);
      const sourceCode = `
/**
 * @deprecated Use newFunction instead
 */
export function oldFunction() {
  return 'old';
}

export function newFunction() {
  return 'new';
}
`;
      await fs.promises.writeFile(testFilePath, sourceCode);

      const item: DeprecatedItem = {
        filePath: testFile,
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated Use newFunction instead',
        isUsed: false,
        usageLocations: [],
      };

      await executor.removeDeprecatedCode(item, true);

      // File should be unchanged in dry-run mode
      const content = await fs.promises.readFile(testFilePath, 'utf-8');
      expect(content).toBe(sourceCode);
    });

    it('should actually remove deprecated function when not in dry-run mode', async () => {
      // Create test file with deprecated function
      const testFile = 'test.ts';
      const testFilePath = path.join(testDir, testFile);
      const sourceCode = `
/**
 * @deprecated Use newFunction instead
 */
export function oldFunction() {
  return 'old';
}

export function newFunction() {
  return 'new';
}
`;
      await fs.promises.writeFile(testFilePath, sourceCode);

      const item: DeprecatedItem = {
        filePath: testFile,
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated Use newFunction instead',
        isUsed: false,
        usageLocations: [],
      };

      await executor.removeDeprecatedCode(item, false);

      // File should have deprecated function removed
      const content = await fs.promises.readFile(testFilePath, 'utf-8');
      expect(content).not.toContain('oldFunction');
      expect(content).toContain('newFunction');
      expect(content).not.toContain('@deprecated');
    });
  });

  describe('addMigrationComment', () => {
    it('should add migration comment in dry-run mode', async () => {
      // Create test file with deprecated function
      const testFile = 'test.ts';
      const testFilePath = path.join(testDir, testFile);
      const sourceCode = `
/**
 * @deprecated
 */
export function oldFunction() {
  return 'old';
}
`;
      await fs.promises.writeFile(testFilePath, sourceCode);

      const item: DeprecatedItem = {
        filePath: testFile,
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated',
        isUsed: true,
        usageLocations: ['app/index.ts'],
      };

      await executor.addMigrationComment(item, 'https://docs.example.com/migration', true);

      // File should be unchanged in dry-run mode
      const content = await fs.promises.readFile(testFilePath, 'utf-8');
      expect(content).toBe(sourceCode);
    });

    it('should actually add migration comment when not in dry-run mode', async () => {
      // Create test file with deprecated function
      const testFile = 'test.ts';
      const testFilePath = path.join(testDir, testFile);
      const sourceCode = `
/**
 * @deprecated
 */
export function oldFunction() {
  return 'old';
}
`;
      await fs.promises.writeFile(testFilePath, sourceCode);

      const item: DeprecatedItem = {
        filePath: testFile,
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated',
        isUsed: true,
        usageLocations: ['app/index.ts'],
      };

      await executor.addMigrationComment(item, 'https://docs.example.com/migration', false);

      // File should have migration comment added
      const content = await fs.promises.readFile(testFilePath, 'utf-8');
      expect(content).toContain('Migration guide:');
      expect(content).toContain('https://docs.example.com/migration');
    });

    it('should not add duplicate migration comment', async () => {
      // Create test file with deprecated function that already has migration comment
      const testFile = 'test.ts';
      const testFilePath = path.join(testDir, testFile);
      const sourceCode = `
/**
 * @deprecated
 * Migration guide: https://docs.example.com/migration
 */
export function oldFunction() {
  return 'old';
}
`;
      await fs.promises.writeFile(testFilePath, sourceCode);

      const item: DeprecatedItem = {
        filePath: testFile,
        itemName: 'oldFunction',
        lineNumber: 5,
        annotation: '@deprecated',
        isUsed: true,
        usageLocations: ['app/index.ts'],
      };

      await executor.addMigrationComment(item, 'https://docs.example.com/migration', false);

      // File should be unchanged (no duplicate comment)
      const content = await fs.promises.readFile(testFilePath, 'utf-8');
      const migrationCount = (content.match(/Migration guide:/g) || []).length;
      expect(migrationCount).toBe(1);
    });
  });

  describe('cleanupOldArchives', () => {
    it('should return success when archive directory does not exist', async () => {
      const result = await executor.cleanupOldArchives(180, [], true);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(true);
    });

    it('should identify old files in dry-run mode', async () => {
      // Create archive directory with test files
      const archiveDir = path.join(testDir, 'docs/archive');
      await fs.promises.mkdir(archiveDir, { recursive: true });

      // Create an old file (set mtime to 200 days ago)
      const oldFile = path.join(archiveDir, 'old-file.md');
      await fs.promises.writeFile(oldFile, 'Old content');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(oldFile, oldDate, oldDate);

      // Create a recent file (set mtime to 30 days ago)
      const recentFile = path.join(archiveDir, 'recent-file.md');
      await fs.promises.writeFile(recentFile, 'Recent content');
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      await fs.promises.utimes(recentFile, recentDate, recentDate);

      const result = await executor.cleanupOldArchives(180, [], true);

      expect(result.success).toBe(true);
      expect(result.removedItems).toContain('docs/archive/old-file.md');
      expect(result.removedItems).not.toContain('docs/archive/recent-file.md');
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(true);

      // Files should still exist in dry-run mode
      expect(fs.existsSync(oldFile)).toBe(true);
      expect(fs.existsSync(recentFile)).toBe(true);
    });

    it('should actually remove old files when not in dry-run mode', async () => {
      // Create archive directory with test files
      const archiveDir = path.join(testDir, 'docs/archive');
      await fs.promises.mkdir(archiveDir, { recursive: true });

      // Create an old file (set mtime to 200 days ago)
      const oldFile = path.join(archiveDir, 'old-file.md');
      await fs.promises.writeFile(oldFile, 'Old content');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(oldFile, oldDate, oldDate);

      // Mock git rm to fail (file not tracked)
      mockedExecSync.mockImplementation(() => {
        throw new Error('not tracked');
      });

      const result = await executor.cleanupOldArchives(180, [], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toContain('docs/archive/old-file.md');
      expect(result.errors).toEqual([]);
      expect(result.dryRun).toBe(false);

      // Old file should be deleted
      expect(fs.existsSync(oldFile)).toBe(false);
    });

    it('should skip permanent archives', async () => {
      // Create archive directory with test files
      const archiveDir = path.join(testDir, 'docs/archive');
      await fs.promises.mkdir(archiveDir, { recursive: true });

      // Create an old file that is marked as permanent
      const permanentFile = path.join(archiveDir, 'permanent-file.md');
      await fs.promises.writeFile(permanentFile, 'Permanent content');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(permanentFile, oldDate, oldDate);

      const result = await executor.cleanupOldArchives(180, ['docs/archive/permanent-file.md'], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([]);
      expect(result.errors).toEqual([]);

      // Permanent file should still exist
      expect(fs.existsSync(permanentFile)).toBe(true);
    });

    it('should handle nested archive directories', async () => {
      // Create nested archive directory structure
      const archiveDir = path.join(testDir, 'docs/archive');
      const subDir = path.join(archiveDir, 'subdir');
      await fs.promises.mkdir(subDir, { recursive: true });

      // Create old files in nested directories
      const oldFile1 = path.join(archiveDir, 'old-file-1.md');
      const oldFile2 = path.join(subDir, 'old-file-2.md');
      
      await fs.promises.writeFile(oldFile1, 'Old content 1');
      await fs.promises.writeFile(oldFile2, 'Old content 2');
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(oldFile1, oldDate, oldDate);
      await fs.promises.utimes(oldFile2, oldDate, oldDate);

      // Mock git rm to fail
      mockedExecSync.mockImplementation(() => {
        throw new Error('not tracked');
      });

      const result = await executor.cleanupOldArchives(180, [], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toContain('docs/archive/old-file-1.md');
      expect(result.removedItems).toContain('docs/archive/subdir/old-file-2.md');
      expect(result.errors).toEqual([]);

      // Both files should be deleted
      expect(fs.existsSync(oldFile1)).toBe(false);
      expect(fs.existsSync(oldFile2)).toBe(false);
    });

    it('should match permanent archives by filename only', async () => {
      // Create archive directory with test files
      const archiveDir = path.join(testDir, 'docs/archive');
      await fs.promises.mkdir(archiveDir, { recursive: true });

      // Create an old file
      const oldFile = path.join(archiveDir, 'important.md');
      await fs.promises.writeFile(oldFile, 'Important content');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(oldFile, oldDate, oldDate);

      // Use filename only in permanent archives list
      const result = await executor.cleanupOldArchives(180, ['important.md'], false);

      expect(result.success).toBe(true);
      expect(result.removedItems).toEqual([]);
      expect(result.errors).toEqual([]);

      // File should still exist (matched by filename)
      expect(fs.existsSync(oldFile)).toBe(true);
    });

    it('should use git rm when file is tracked', async () => {
      // Create archive directory with test files
      const archiveDir = path.join(testDir, 'docs/archive');
      await fs.promises.mkdir(archiveDir, { recursive: true });

      // Create an old file
      const oldFile = path.join(archiveDir, 'old-file.md');
      await fs.promises.writeFile(oldFile, 'Old content');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);
      await fs.promises.utimes(oldFile, oldDate, oldDate);

      // Mock successful git rm
      mockedExecSync.mockImplementation(() => Buffer.from(''));

      const result = await executor.cleanupOldArchives(180, [], false);

      expect(result.success).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git rm -f'),
        expect.any(Object)
      );
    });
  });

  describe('createDeprecatedItemIssue', () => {
    it('should skip issue creation when GitHub token is not available', async () => {
      const item: DeprecatedItem = {
        filePath: 'test.ts',
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated',
        isUsed: true,
        usageLocations: ['app/index.ts'],
      };

      // Ensure GITHUB_TOKEN is not set
      const originalToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const issueUrl = await executor.createDeprecatedItemIssue(item);

      expect(issueUrl).toBe('');

      // Restore original token
      if (originalToken) {
        process.env.GITHUB_TOKEN = originalToken;
      }
    });

    it('should return placeholder URL when GitHub token is available', async () => {
      const item: DeprecatedItem = {
        filePath: 'test.ts',
        itemName: 'oldFunction',
        lineNumber: 4,
        annotation: '@deprecated',
        isUsed: true,
        usageLocations: ['app/index.ts'],
        removalDate: '2026-08-01',
      };

      // Set a fake GitHub token
      const originalToken = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = 'fake-token';

      const issueUrl = await executor.createDeprecatedItemIssue(item);

      expect(issueUrl).toContain('github.com');
      expect(issueUrl).toContain('issues');

      // Restore original token
      if (originalToken) {
        process.env.GITHUB_TOKEN = originalToken;
      } else {
        delete process.env.GITHUB_TOKEN;
      }
    });
  });
});
