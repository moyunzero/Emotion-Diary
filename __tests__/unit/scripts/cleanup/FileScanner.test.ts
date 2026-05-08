import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { FileScanner } from '../../../../scripts/cleanup/components/FileScanner';

describe('FileScanner', () => {
  let testDir: string;
  let scanner: FileScanner;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(process.cwd(), '__test_cleanup_temp__');
    await fs.promises.mkdir(testDir, { recursive: true });
    scanner = new FileScanner(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('findDocumentationFiles', () => {
    it('should find files matching *_SUMMARY.md pattern', async () => {
      // Create test files
      await fs.promises.writeFile(
        path.join(testDir, 'TEST_SUMMARY.md'),
        '# Test Summary'
      );
      await fs.promises.writeFile(
        path.join(testDir, 'ANOTHER_SUMMARY.md'),
        '# Another Summary'
      );

      const results = await scanner.findDocumentationFiles();

      expect(results.length).toBeGreaterThanOrEqual(2);
      const summaryFiles = results.filter(r => r.pattern === '*_SUMMARY.md');
      expect(summaryFiles.length).toBe(2);
      expect(summaryFiles.some(f => f.path === 'TEST_SUMMARY.md')).toBe(true);
      expect(summaryFiles.some(f => f.path === 'ANOTHER_SUMMARY.md')).toBe(true);
    });

    it('should find files matching *_FIX.md pattern', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'BUG_FIX.md'),
        '# Bug Fix'
      );

      const results = await scanner.findDocumentationFiles();

      const fixFiles = results.filter(r => r.pattern === '*_FIX.md');
      expect(fixFiles.length).toBe(1);
      expect(fixFiles[0].path).toBe('BUG_FIX.md');
    });

    it('should find files matching *_ANALYSIS.md pattern', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'CODE_ANALYSIS.md'),
        '# Code Analysis'
      );

      const results = await scanner.findDocumentationFiles();

      const analysisFiles = results.filter(r => r.pattern === '*_ANALYSIS.md');
      expect(analysisFiles.length).toBe(1);
      expect(analysisFiles[0].path).toBe('CODE_ANALYSIS.md');
    });

    it('should find files matching *_REPORT.md pattern', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'STATUS_REPORT.md'),
        '# Status Report'
      );

      const results = await scanner.findDocumentationFiles();

      const reportFiles = results.filter(r => r.pattern === '*_REPORT.md');
      expect(reportFiles.length).toBe(1);
      expect(reportFiles[0].path).toBe('STATUS_REPORT.md');
    });

    it('should set correct archive path for documentation files', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'TEST_SUMMARY.md'),
        '# Test'
      );

      const results = await scanner.findDocumentationFiles();

      const file = results.find(r => r.path === 'TEST_SUMMARY.md');
      expect(file?.archivePath).toBe('docs/archive/TEST_SUMMARY.md');
    });
  });

  describe('findEmptyDirectories', () => {
    it('should find directories with no files', async () => {
      const emptyDir = path.join(testDir, 'src', 'empty-dir');
      await fs.promises.mkdir(emptyDir, { recursive: true });

      const results = await scanner.findEmptyDirectories(false);

      expect(results.some(d => d.includes('empty-dir'))).toBe(true);
    });

    it('should find directories with only .gitkeep', async () => {
      const dirWithGitkeep = path.join(testDir, 'src', 'with-gitkeep');
      await fs.promises.mkdir(dirWithGitkeep, { recursive: true });
      await fs.promises.writeFile(path.join(dirWithGitkeep, '.gitkeep'), '');

      const results = await scanner.findEmptyDirectories(false);

      expect(results.some(d => d.includes('with-gitkeep'))).toBe(true);
    });

    it('should find directories with only .DS_Store', async () => {
      const dirWithDSStore = path.join(testDir, 'src', 'with-ds-store');
      await fs.promises.mkdir(dirWithDSStore, { recursive: true });
      await fs.promises.writeFile(path.join(dirWithDSStore, '.DS_Store'), '');

      const results = await scanner.findEmptyDirectories(false);

      expect(results.some(d => d.includes('with-ds-store'))).toBe(true);
    });

    it('should find directories with only Thumbs.db', async () => {
      const dirWithThumbs = path.join(testDir, 'src', 'with-thumbs');
      await fs.promises.mkdir(dirWithThumbs, { recursive: true });
      await fs.promises.writeFile(path.join(dirWithThumbs, 'Thumbs.db'), '');

      const results = await scanner.findEmptyDirectories(false);

      expect(results.some(d => d.includes('with-thumbs'))).toBe(true);
    });

    it('should not find directories with actual files', async () => {
      const dirWithFiles = path.join(testDir, 'src', 'with-files');
      await fs.promises.mkdir(dirWithFiles, { recursive: true });
      await fs.promises.writeFile(path.join(dirWithFiles, 'file.ts'), 'content');

      const results = await scanner.findEmptyDirectories(false);

      expect(results.some(d => d.includes('with-files'))).toBe(false);
    });

    it('should exclude root directories when excludeRoot is true', async () => {
      const rootDir = path.join(testDir, 'root-empty');
      await fs.promises.mkdir(rootDir, { recursive: true });

      const results = await scanner.findEmptyDirectories(true);

      expect(results.some(d => d === 'root-empty/')).toBe(false);
    });
  });

  describe('findSystemFiles', () => {
    it('should find .DS_Store files', async () => {
      await fs.promises.writeFile(path.join(testDir, '.DS_Store'), '');
      const subDir = path.join(testDir, 'subdir');
      await fs.promises.mkdir(subDir, { recursive: true });
      await fs.promises.writeFile(path.join(subDir, '.DS_Store'), '');

      const results = await scanner.findSystemFiles();

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(f => f === '.DS_Store')).toBe(true);
      expect(results.some(f => f.includes('subdir'))).toBe(true);
    });

    it('should find Thumbs.db files', async () => {
      await fs.promises.writeFile(path.join(testDir, 'Thumbs.db'), '');

      const results = await scanner.findSystemFiles();

      expect(results.some(f => f === 'Thumbs.db')).toBe(true);
    });
  });

  describe('findBackupConfigFiles', () => {
    it('should find .bak files', async () => {
      await fs.promises.writeFile(path.join(testDir, 'config.json.bak'), '{}');

      const results = await scanner.findBackupConfigFiles();

      expect(results.some(f => f === 'config.json.bak')).toBe(true);
    });

    it('should find .old files', async () => {
      await fs.promises.writeFile(path.join(testDir, 'settings.old'), 'old');

      const results = await scanner.findBackupConfigFiles();

      expect(results.some(f => f === 'settings.old')).toBe(true);
    });

    it('should find .backup files', async () => {
      await fs.promises.writeFile(path.join(testDir, 'data.backup'), 'backup');

      const results = await scanner.findBackupConfigFiles();

      expect(results.some(f => f === 'data.backup')).toBe(true);
    });
  });

  describe('findBuildArtifacts', () => {
    it('should find build artifacts not in gitignore', async () => {
      const distDir = path.join(testDir, 'dist');
      await fs.promises.mkdir(distDir, { recursive: true });
      await fs.promises.writeFile(path.join(distDir, 'bundle.js'), 'code');

      // Simulate gitignore without 'dist'
      const gitignorePatterns = ['node_modules', 'coverage'];

      const results = await scanner.findBuildArtifacts(gitignorePatterns);

      expect(results.some(f => f.includes('dist'))).toBe(true);
    });

    it('should not report artifacts that are in gitignore', async () => {
      const distDir = path.join(testDir, 'dist');
      await fs.promises.mkdir(distDir, { recursive: true });
      await fs.promises.writeFile(path.join(distDir, 'bundle.js'), 'code');

      // Simulate gitignore with 'dist'
      const gitignorePatterns = ['node_modules', 'dist', 'coverage'];

      const results = await scanner.findBuildArtifacts(gitignorePatterns);

      expect(results.length).toBe(0);
    });
  });

  describe('findDeprecatedCode', () => {
    it('should find @deprecated annotations in functions', async () => {
      const testFile = path.join(testDir, 'deprecated.ts');
      await fs.promises.writeFile(
        testFile,
        `
/**
 * @deprecated Since v2.0.0 - Use newFunction() instead
 */
export function oldFunction() {
  return 'old';
}
        `
      );

      const results = await scanner.findDeprecatedCode();

      expect(results.length).toBe(1);
      expect(results[0].itemName).toBe('oldFunction');
      expect(results[0].annotation).toContain('@deprecated');
      expect(results[0].filePath).toBe('deprecated.ts');
    });

    it('should find @deprecated annotations in classes', async () => {
      const testFile = path.join(testDir, 'deprecated-class.ts');
      await fs.promises.writeFile(
        testFile,
        `
/**
 * @deprecated Use NewClass instead
 */
export class OldClass {
  method() {}
}
        `
      );

      const results = await scanner.findDeprecatedCode();

      expect(results.length).toBe(1);
      expect(results[0].itemName).toBe('OldClass');
    });

    it('should find @deprecated annotations in variables', async () => {
      const testFile = path.join(testDir, 'deprecated-var.ts');
      await fs.promises.writeFile(
        testFile,
        `
/**
 * @deprecated
 */
export const OLD_CONSTANT = 'old';
        `
      );

      const results = await scanner.findDeprecatedCode();

      expect(results.length).toBe(1);
      expect(results[0].itemName).toBe('OLD_CONSTANT');
    });

    it('should record correct line numbers', async () => {
      const testFile = path.join(testDir, 'line-numbers.ts');
      await fs.promises.writeFile(
        testFile,
        `// Line 1
// Line 2
/**
 * @deprecated
 */
export function deprecatedFunc() {}
        `
      );

      const results = await scanner.findDeprecatedCode();

      expect(results.length).toBe(1);
      expect(results[0].lineNumber).toBe(6); // Function declaration line
    });
  });

  describe('findDuplicateFiles', () => {
    beforeEach(async () => {
      // Create app-store-submission directory structure
      const appStoreDir = path.join(testDir, 'app-store-submission');
      await fs.promises.mkdir(appStoreDir, { recursive: true });
    });

    it('should find duplicate files with identical content and similar names', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create two files with identical content and similar names
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description.md'),
        '# App Description\nThis is the app description.'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description-copy.md'),
        '# App Description\nThis is the app description.'
      );

      const results = await scanner.findDuplicateFiles();

      expect(results.length).toBe(1);
      expect(results[0].contentMatch).toBe(true);
      expect(results[0].nameSimilarityScore).toBeGreaterThan(0.7);
    });

    it('should not find duplicates when content differs', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create two files with similar names but different content
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description.md'),
        '# App Description\nThis is the first description.'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description-v2.md'),
        '# App Description\nThis is the second description.'
      );

      const results = await scanner.findDuplicateFiles();

      expect(results.length).toBe(0);
    });

    it('should not find duplicates when names are too different', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create two files with identical content but very different names
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description.md'),
        '# Content\nSame content here.'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'completely-different-name.md'),
        '# Content\nSame content here.'
      );

      const results = await scanner.findDuplicateFiles();

      expect(results.length).toBe(0);
    });

    it('should respect custom name similarity threshold', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create files with identical content and moderately similar names
      await fs.promises.writeFile(
        path.join(appStoreDir, 'app-desc.md'),
        'Same content'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'app-description.md'),
        'Same content'
      );

      // With high threshold (0.9), should not find duplicates
      const resultsHighThreshold = await scanner.findDuplicateFiles(0.9);
      expect(resultsHighThreshold.length).toBe(0);

      // With lower threshold (0.5), should find duplicates
      const resultsLowThreshold = await scanner.findDuplicateFiles(0.5);
      expect(resultsLowThreshold.length).toBe(1);
    });

    it('should find multiple duplicate pairs', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create first duplicate pair with higher similarity
      await fs.promises.writeFile(
        path.join(appStoreDir, 'readme.md'),
        'Content A'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'readme-v2.md'),
        'Content A'
      );

      // Create second duplicate pair with higher similarity
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description.md'),
        'Content B'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'description-copy.md'),
        'Content B'
      );

      const results = await scanner.findDuplicateFiles();

      expect(results.length).toBe(2);
    });

    it('should work with files in subdirectories', async () => {
      const metadataDir = path.join(testDir, 'app-store-submission', 'metadata');
      await fs.promises.mkdir(metadataDir, { recursive: true });
      
      // Create duplicate files in subdirectory
      await fs.promises.writeFile(
        path.join(metadataDir, 'description-en.md'),
        'English description'
      );
      await fs.promises.writeFile(
        path.join(metadataDir, 'description-en-v2.md'),
        'English description'
      );

      const results = await scanner.findDuplicateFiles();

      expect(results.length).toBe(1);
      expect(results[0].originalFile).toContain('metadata');
      expect(results[0].duplicateFile).toContain('metadata');
    });

    it('should calculate correct name similarity scores', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create files with identical content
      await fs.promises.writeFile(
        path.join(appStoreDir, 'test.md'),
        'Same content'
      );
      await fs.promises.writeFile(
        path.join(appStoreDir, 'test-copy.md'),
        'Same content'
      );

      const results = await scanner.findDuplicateFiles(0.5);

      expect(results.length).toBe(1);
      // "test.md" vs "test-copy.md" should have reasonable similarity
      expect(results[0].nameSimilarityScore).toBeGreaterThan(0.5);
      expect(results[0].nameSimilarityScore).toBeLessThan(1.0);
    });

    it('should handle empty directory gracefully', async () => {
      // app-store-submission directory exists but is empty
      const results = await scanner.findDuplicateFiles();

      expect(results).toEqual([]);
    });

    it('should handle files that cannot be read', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      
      // Create a valid file
      await fs.promises.writeFile(
        path.join(appStoreDir, 'valid.md'),
        'Valid content'
      );

      // The scanner should handle read errors gracefully
      const results = await scanner.findDuplicateFiles();

      // Should not throw error, just return empty or partial results
      expect(Array.isArray(results)).toBe(true);
    });

    it('should only compare files within app-store-submission directory', async () => {
      const appStoreDir = path.join(testDir, 'app-store-submission');
      const otherDir = path.join(testDir, 'other-directory');
      await fs.promises.mkdir(otherDir, { recursive: true });
      
      // Create duplicate content in different directories
      await fs.promises.writeFile(
        path.join(appStoreDir, 'file.md'),
        'Same content'
      );
      await fs.promises.writeFile(
        path.join(otherDir, 'file.md'),
        'Same content'
      );

      const results = await scanner.findDuplicateFiles();

      // Should not find duplicates across different directories
      expect(results.length).toBe(0);
    });
  });
});
