import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * FileScanner - Identifies files and directories for cleanup using static analysis
 * 
 * This component scans the project for:
 * - Documentation files matching cleanup patterns
 * - Empty directories
 * - System files (.DS_Store, Thumbs.db)
 * - Backup config files
 * - Build artifacts
 * - Deprecated code with @deprecated annotations
 */
/**
 * @deprecated Since v2.1.0 - Use alternative instead
 * Migration guide: Please migrate to the recommended alternative
 */


export interface DocumentationFile {
  path: string;
  pattern: string; // Which pattern matched
  archivePath: string; // Destination in docs/archive/
}

export interface DeprecatedItem {
  filePath: string;
  itemName: string;
  lineNumber: number;
  annotation: string;
  isUsed: boolean;
  usageLocations: string[];
  removalDate?: string; // ISO date string for planned removal
  migrationGuide?: string; // URL or description
  permanent?: boolean; // If true, never auto-remove even if unused
}

export interface DuplicateFilePair {
  originalFile: string;
  duplicateFile: string;
  contentMatch: boolean;
  nameSimilarityScore: number; // 0-1, where 1 is identical
}

export class FileScanner {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Find documentation files matching cleanup patterns
   * Patterns: *_SUMMARY.md, *_FIX.md, *_ANALYSIS.md, *_REPORT.md
   * 
   * **Validates: Requirements 2.1**
   */
  async findDocumentationFiles(): Promise<DocumentationFile[]> {
    const patterns = [
      '*_SUMMARY.md',
      '*_FIX.md',
      '*_ANALYSIS.md',
      '*_REPORT.md',
    ];

    const results: DocumentationFile[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', 'docs/archive/**'],
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        const relativePath = file;
        const archivePath = path.join('docs/archive', relativePath);
        
        results.push({
          path: relativePath,
          pattern,
          archivePath,
        });
      }
    }

    return results;
  }

  /**
   * Find empty directories (containing only .gitkeep, .DS_Store, Thumbs.db)
   * 
   * @param excludeRoot - Don't delete top-level directories like 'src/'
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  async findEmptyDirectories(excludeRoot: boolean = true): Promise<string[]> {
    const emptyDirs: string[] = [];
    const ignoredFiles = ['.gitkeep', '.DS_Store', 'Thumbs.db'];

    // Get all directories
    const allDirs = await glob('**/', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', '.git/**', '.expo/**', 'coverage/**', 'dist/**', 'build/**'],
      absolute: false,
    });

    for (const dir of allDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      
      // Skip root-level directories if excludeRoot is true
      if (excludeRoot && !dir.includes('/')) {
        continue;
      }

      try {
        const entries = await fs.promises.readdir(fullPath);
        
        // Check if directory is empty or only contains ignored files
        const meaningfulEntries = entries.filter(
          entry => !ignoredFiles.includes(entry)
        );

        if (meaningfulEntries.length === 0) {
          emptyDirs.push(dir);
        }
      } catch {
        // Directory might have been deleted or inaccessible, skip it
        continue;
      }
    }

    return emptyDirs;
  }

  /**
   * Find system files (.DS_Store, Thumbs.db)
   * 
   * **Validates: Requirements 4.1**
   */
  async findSystemFiles(): Promise<string[]> {
    const patterns = ['.DS_Store', 'Thumbs.db'];
    const systemFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(`**/${pattern}`, {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**'],
        nodir: true,
        absolute: false,
        dot: true, // Include hidden files
      });

      systemFiles.push(...files);
    }

    return systemFiles;
  }

  /**
   * Find backup config files (*.bak, *.old, *.backup)
   * 
   * **Validates: Requirements 4.5**
   */
  async findBackupConfigFiles(): Promise<string[]> {
    const patterns = ['*.bak', '*.old', '*.backup'];
    const backupFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(`**/${pattern}`, {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', 'coverage/**', 'dist/**', 'build/**'],
        nodir: true,
        absolute: false,
      });

      backupFiles.push(...files);
    }

    return backupFiles;
  }

  /**
   * Find accidentally committed build artifacts
   * 
   * @param gitignorePatterns - Patterns from .gitignore to check against
   * 
   * **Validates: Requirements 4.2, 4.3**
   */
  async findBuildArtifacts(gitignorePatterns: string[]): Promise<string[]> {
    const buildArtifactPatterns = [
      'node_modules/',
      '.next/',
      '.nuxt/',
      'dist/',
      'build/',
      'coverage/',
      '.expo/cache/',
    ];

    const artifacts: string[] = [];

    for (const pattern of buildArtifactPatterns) {
      // Check if pattern is in gitignore
      const isInGitignore = gitignorePatterns.some(gitPattern => 
        gitPattern.includes(pattern.replace(/\/$/, ''))
      );

      if (!isInGitignore) {
        // This build artifact is not in .gitignore, check if it exists in git
        const files = await glob(`${pattern}**/*`, {
          cwd: this.projectRoot,
          ignore: ['.git/**'],
          nodir: true,
          absolute: false,
        });

        if (files.length > 0) {
          artifacts.push(...files);
        }
      }
    }

    return artifacts;
  }

  /**
   * Find deprecated code using @deprecated annotations
   * Uses TypeScript AST to parse annotations
   * 
   * **Validates: Requirements 5.1, 5.2**
   */
/**
 * @deprecated Since v2.1.0 - Use alternative instead
 * Migration guide: Please migrate to the recommended alternative
 */

  async findDeprecatedCode(): Promise<DeprecatedItem[]> {
    const deprecatedItems: DeprecatedItem[] = [];

    // Find all TypeScript/JavaScript files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: [
        'node_modules/**',
        '.git/**',
        'coverage/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
      ],
      nodir: true,
      absolute: false,
    });

    for (const file of files) {
      const fullPath = path.join(this.projectRoot, file);
      const items = await this.parseDeprecatedAnnotations(fullPath, file);
      deprecatedItems.push(...items);
    }

    return deprecatedItems;
  }

  /**
   * Parse @deprecated annotations from a TypeScript/JavaScript file
   * 
   * @param fullPath - Absolute path to the file
   * @param relativePath - Relative path for reporting
   */
/**
 * @deprecated Since v2.1.0 - Use alternative instead
 * Migration guide: Please migrate to the recommended alternative
 */

  private async parseDeprecatedAnnotations(
    fullPath: string,
    relativePath: string
  ): Promise<DeprecatedItem[]> {
    const items: DeprecatedItem[] = [];

    try {
      const sourceCode = await fs.promises.readFile(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        fullPath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      const visit = (node: ts.Node) => {
        // Check for JSDoc comments with @deprecated tag
        const jsDocTags = ts.getJSDocTags(node);
        const deprecatedTag = jsDocTags.find(
          tag => tag.tagName.text === 'deprecated'
        );

        if (deprecatedTag) {
          const itemName = this.getNodeName(node);
          if (itemName) {
            const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const annotation = this.extractDeprecatedAnnotation(node, sourceCode);

            items.push({
              filePath: relativePath,
              itemName,
              lineNumber,
              annotation,
              isUsed: false, // Will be determined by DependencyAnalyzer
              usageLocations: [],
            });
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    } catch (error) {
      // File might have syntax errors or be unreadable, skip it
      console.warn(`Warning: Could not parse ${relativePath}:`, error);
    }

    return items;
  }

  /**
   * Get the name of a TypeScript node (function, class, variable, etc.)
   */
  private getNodeName(node: ts.Node): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    }
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    if (ts.isPropertyDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    if (ts.isInterfaceDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isTypeAliasDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isEnumDeclaration(node) && node.name) {
      return node.name.text;
    }

    return null;
  }

  /**
   * Extract the full @deprecated annotation text from JSDoc comment
   */
/**
 * @deprecated Since v2.1.0 - Use alternative instead
 * Migration guide: Please migrate to the recommended alternative
 */

  private extractDeprecatedAnnotation(node: ts.Node, sourceCode: string): string {
    const jsDocComments = ts.getJSDocCommentsAndTags(node);
    
    for (const comment of jsDocComments) {
      if (ts.isJSDoc(comment)) {
        const commentText = sourceCode.substring(comment.pos, comment.end);
        const deprecatedMatch = commentText.match(/@deprecated[^\n]*/);
        if (deprecatedMatch) {
          return deprecatedMatch[0].trim();
        }
      }
    }

    return '@deprecated';
  }

  /**
   * Find duplicate files in app-store-submission directory
   * Identifies duplicates by: content is identical AND file names are highly similar
   * 
   * @param nameSimilarityThreshold - Minimum similarity score (0-1) for names (default 0.7)
   * @returns List of duplicate file pairs
   * 
   * **Validates: Requirements 2.5, 2.6**
   */
  async findDuplicateFiles(nameSimilarityThreshold: number = 0.7): Promise<DuplicateFilePair[]> {
    const duplicates: DuplicateFilePair[] = [];
    
    // Find all files in app-store-submission directory
    const files = await glob('app-store-submission/**/*', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', '.git/**'],
      nodir: true,
      absolute: false,
    });

    // Compare each file with every other file
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];

        // Check content match
        const contentMatch = await this.compareFileContents(file1, file2);
        
        // Check name similarity
        const nameSimilarity = this.calculateNameSimilarity(file1, file2);

        // Only mark as duplicate if BOTH content matches AND names are similar
        if (contentMatch && nameSimilarity >= nameSimilarityThreshold) {
          duplicates.push({
            originalFile: file1,
            duplicateFile: file2,
            contentMatch: true,
            nameSimilarityScore: nameSimilarity,
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Compare file contents for exact match
   * 
   * @param file1 - First file path (relative to project root)
   * @param file2 - Second file path (relative to project root)
   * @returns True if contents are identical
   */
  private async compareFileContents(file1: string, file2: string): Promise<boolean> {
    try {
      const fullPath1 = path.join(this.projectRoot, file1);
      const fullPath2 = path.join(this.projectRoot, file2);

      const content1 = await fs.promises.readFile(fullPath1, 'utf-8');
      const content2 = await fs.promises.readFile(fullPath2, 'utf-8');

      return content1 === content2;
    } catch {
      // If files can't be read, they're not duplicates
      return false;
    }
  }

  /**
   * Calculate name similarity using Levenshtein distance
   * Returns a score between 0 and 1, where 1 is identical
   * 
   * @param file1 - First file path
   * @param file2 - Second file path
   * @returns Similarity score (0-1)
   */
  private calculateNameSimilarity(file1: string, file2: string): number {
    // Extract just the filename (without directory path)
    const name1 = path.basename(file1);
    const name2 = path.basename(file2);

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(name1, name2);
    
    // Convert distance to similarity score (0-1)
    const maxLength = Math.max(name1.length, name2.length);
    if (maxLength === 0) return 1; // Both empty strings
    
    const similarity = 1 - (distance / maxLength);
    return similarity;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const dp: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      dp[0][j] = j;
    }

    // Fill the dp table
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[len1][len2];
  }
}
