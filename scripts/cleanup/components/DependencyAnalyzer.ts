import { execSync } from 'child_process';
import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import type { DeprecatedItem } from './FileScanner';

/**
 * DependencyAnalyzer - Uses depcheck and madge to verify code usage
 * 
 * This component provides dependency analysis capabilities:
 * - Check if files are imported anywhere in the codebase
 * - Detect circular dependencies
 * - Verify deprecated items are not used
 * - Check whitelist for protected items
 * - Generate manual review reports
 * 
 * **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.7, 8.1, 8.2**
 */

export interface FileUsage {
  isUsed: boolean;
  importedBy: string[];
  dynamicImports: string[];
}

export interface CircularDependency {
  chain: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  affectedFiles: string[];
  recommendation: string;
}

export interface ManualReviewReport {
  items: DeprecatedItem[];
  risks: RiskAssessment[];
  recommendations: string[];
  outputPath: string;
}

export class DependencyAnalyzer {
  private projectRoot: string;
  private whitelist: string[];

  constructor(projectRoot: string = process.cwd(), whitelist: string[] = []) {
    this.projectRoot = projectRoot;
    this.whitelist = whitelist;
  }

  /**
   * Check if a file is imported anywhere in the codebase using madge
   * 
   * @param filePath - Relative file path to check
   * @returns Usage information including static and dynamic imports
   * 
   * **Validates: Requirements 5.2, 8.1**
   */
  async checkFileUsage(filePath: string): Promise<FileUsage> {
    try {
      // Normalize the file path (remove extension for madge)
      const normalizedPath = this.normalizePathForMadge(filePath);
      
      // Use madge to get dependency tree
      // madge outputs JSON with file dependencies
      const madgeOutput = execSync(
        `npx madge --json "${this.projectRoot}"`,
        { 
          encoding: 'utf-8',
          cwd: this.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const dependencyTree = JSON.parse(madgeOutput);
      
      // Find all files that import the target file
      const importedBy: string[] = [];
      
      for (const [sourceFile, dependencies] of Object.entries(dependencyTree)) {
        const deps = dependencies as string[];
        
        // Check if any dependency matches our target file
        for (const dep of deps) {
          if (this.pathsMatch(dep, normalizedPath)) {
            importedBy.push(sourceFile);
          }
        }
      }

      // Check for dynamic imports by searching file contents
      const dynamicImports = await this.findDynamicImports(filePath);

      return {
        isUsed: importedBy.length > 0 || dynamicImports.length > 0,
        importedBy,
        dynamicImports,
      };
    } catch (error: any) {
      // If madge fails, fall back to grep-based search
      console.warn(`Warning: madge failed for ${filePath}, using fallback method:`, error.message);
      return this.checkFileUsageFallback(filePath);
    }
  }

  /**
   * Check for circular dependencies using madge --circular
   * 
   * @returns List of circular dependency chains
   * 
   * **Validates: Requirements 8.2**
   */
  async checkCircularDependencies(): Promise<CircularDependency[]> {
    try {
      // Run madge with --circular flag to detect circular dependencies
      const output = execSync(
        `npx madge --circular --json "${this.projectRoot}"`,
        {
          encoding: 'utf-8',
          cwd: this.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const circularDeps = JSON.parse(output);
      
      // madge returns an array of arrays, where each inner array is a circular chain
      return circularDeps.map((chain: string[]) => ({ chain }));
    } catch (error: any) {
      // If no circular dependencies found, madge exits with code 1
      // Check if the error is due to no circular deps or actual failure
      if (error.stdout && error.stdout.includes('[]')) {
        return [];
      }
      
      console.warn('Warning: Failed to check circular dependencies:', error.message);
      return [];
    }
  }

  /**
   * Verify a deprecated item is not used in the codebase
   * Distinguishes between static imports, dynamic imports, and comments
   * 
   * @param itemName - Name of deprecated function/class/variable
   * @returns Usage status with categorized references
   * 
   * **Validates: Requirements 5.3, 5.4**
   */
  async verifyDeprecatedItemUnused(itemName: string): Promise<{
    isUnused: boolean;
    staticImports: string[];
    dynamicImports: string[];
    commentReferences: string[];
  }> {
    const staticImports: string[] = [];
    const dynamicImports: string[] = [];
    const commentReferences: string[] = [];

    try {
      // Find all TypeScript/JavaScript files
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: [
          'node_modules/**',
          '.git/**',
          'coverage/**',
          'dist/**',
          'build/**',
          '.expo/**',
        ],
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        const fullPath = path.join(this.projectRoot, file);
        const content = await fs.promises.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;

          // Check if line contains the item name
          if (!line.includes(itemName)) {
            continue;
          }

          // Categorize the reference
          const trimmedLine = line.trim();

          // Check if it's a comment (single-line or multi-line)
          if (
            trimmedLine.startsWith('//') ||
            trimmedLine.startsWith('/*') ||
            trimmedLine.startsWith('*') ||
            this.isInsideComment(content, line, i)
          ) {
            commentReferences.push(`${file}:${lineNumber}`);
            continue;
          }

          // Check for dynamic imports: import('...') or require('...')
          if (
            /import\s*\(\s*['"`].*['"`]\s*\)/.test(line) ||
            /require\s*\(\s*['"`].*['"`]\s*\)/.test(line)
          ) {
            dynamicImports.push(`${file}:${lineNumber}`);
            continue;
          }

          // Check for static imports
          if (
            /^import\s+.*from\s+['"`]/.test(trimmedLine) ||
            /^import\s+['"`]/.test(trimmedLine) ||
            /^export\s+.*from\s+['"`]/.test(trimmedLine)
          ) {
            staticImports.push(`${file}:${lineNumber}`);
            continue;
          }

          // Check for actual usage (not import statement)
          // This includes function calls, variable references, etc.
          const usagePattern = new RegExp(`\\b${this.escapeRegex(itemName)}\\b`);
          if (usagePattern.test(line)) {
            staticImports.push(`${file}:${lineNumber}`);
          }
        }
      }

      return {
        isUnused: staticImports.length === 0 && dynamicImports.length === 0,
        staticImports,
        dynamicImports,
        commentReferences,
      };
    } catch (error: any) {
      console.warn(`Warning: Failed to verify deprecated item "${itemName}":`, error.message);
      // On error, assume it's used to be safe
      return {
        isUnused: false,
        staticImports: [],
        dynamicImports: [],
        commentReferences: [],
      };
    }
  }

  /**
   * Check if an item is in the whitelist (never delete)
   * 
   * @param itemPath - File path or function name to check
   * @returns Whether the item is whitelisted
   * 
   * **Validates: Requirements 5.5**
   */
  isWhitelisted(itemPath: string): boolean {
    return this.whitelist.some(pattern => {
      // Support glob patterns in whitelist
      if (pattern.includes('*')) {
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );
        return regex.test(itemPath);
      }
      
      // Exact match or substring match
      return itemPath === pattern || itemPath.includes(pattern);
    });
  }

  /**
   * Generate manual review report for high-risk deprecated items
   * 
   * @param items - Deprecated items requiring manual review
   * @returns Manual review report with risk assessments
   * 
   * **Validates: Requirements 5.7**
   */
  async generateManualReviewReport(items: DeprecatedItem[]): Promise<ManualReviewReport> {
    const risks: RiskAssessment[] = [];
    const recommendations: string[] = [];

    // Assess risk for each item
    for (const item of items) {
      const risk = this.assessRisk(item);
      risks.push(risk);
    }

    // Generate recommendations based on risk levels
    const highRiskCount = risks.filter(r => r.level === 'high').length;
    const mediumRiskCount = risks.filter(r => r.level === 'medium').length;
    const lowRiskCount = risks.filter(r => r.level === 'low').length;

    if (highRiskCount > 0) {
      recommendations.push(
        `⚠️  ${highRiskCount} high-risk items require careful manual review before removal`
      );
      recommendations.push(
        'Consider creating migration guides for high-risk deprecated items'
      );
    }

    if (mediumRiskCount > 0) {
      recommendations.push(
        `⚡ ${mediumRiskCount} medium-risk items should be reviewed for usage patterns`
      );
    }

    if (lowRiskCount > 0) {
      recommendations.push(
        `✓ ${lowRiskCount} low-risk items can likely be removed safely`
      );
    }

    // Generate report file
    const outputPath = path.join(this.projectRoot, 'docs/cleanup-manual-review.md');
    await this.writeManualReviewReport(outputPath, items, risks, recommendations);

    return {
      items,
      risks,
      recommendations,
      outputPath,
    };
  }

  /**
   * Run depcheck to verify unused dependencies
   * 
   * @returns List of unused dependencies
   * 
   * **Validates: Requirements 8.1**
   */
  async checkUnusedDependencies(): Promise<string[]> {
    try {
      // Run depcheck to find unused dependencies
      const output = execSync(
        'npx depcheck --json',
        {
          encoding: 'utf-8',
          cwd: this.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const result = JSON.parse(output);
      
      // depcheck returns { dependencies: [], devDependencies: [], ... }
      const unusedDeps = [
        ...(result.dependencies || []),
        ...(result.devDependencies || []),
      ];

      return unusedDeps;
    } catch (error: any) {
      console.warn('Warning: depcheck failed:', error.message);
      return [];
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Normalize file path for madge comparison
   * Removes file extension and normalizes separators
   */
  private normalizePathForMadge(filePath: string): string {
    // Remove extension
    const withoutExt = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
    // Normalize path separators
    return withoutExt.replace(/\\/g, '/');
  }

  /**
   * Check if two paths match (accounting for different formats)
   */
  private pathsMatch(path1: string, path2: string): boolean {
    const normalized1 = this.normalizePathForMadge(path1);
    const normalized2 = this.normalizePathForMadge(path2);
    
    return normalized1 === normalized2 ||
           normalized1.endsWith(normalized2) ||
           normalized2.endsWith(normalized1);
  }

  /**
   * Find dynamic imports by searching file contents
   */
  private async findDynamicImports(filePath: string): Promise<string[]> {
    const dynamicImports: string[] = [];
    const normalizedPath = this.normalizePathForMadge(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', 'coverage/**', 'dist/**', 'build/**'],
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        const fullPath = path.join(this.projectRoot, file);
        const content = await fs.promises.readFile(fullPath, 'utf-8');

        // Check for dynamic imports: import('path') or require('path')
        const dynamicImportRegex = /(?:import|require)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        let match;

        while ((match = dynamicImportRegex.exec(content)) !== null) {
          const importPath = match[1];
          
          // Check if the import path matches our target file
          if (
            importPath.includes(fileName) ||
            importPath.includes(normalizedPath)
          ) {
            dynamicImports.push(file);
            break; // Only count each file once
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to find dynamic imports for ${filePath}:`, error);
    }

    return dynamicImports;
  }

  /**
   * Fallback method to check file usage using grep-like search
   */
  private async checkFileUsageFallback(filePath: string): Promise<FileUsage> {
    const importedBy: string[] = [];
    const dynamicImports: string[] = [];
    const fileName = path.basename(filePath, path.extname(filePath));

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', 'coverage/**', 'dist/**', 'build/**'],
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        // Skip the file itself
        if (file === filePath) {
          continue;
        }

        const fullPath = path.join(this.projectRoot, file);
        const content = await fs.promises.readFile(fullPath, 'utf-8');

        // Check for static imports
        const staticImportRegex = new RegExp(
          `(?:import|export)\\s+.*from\\s+['"\`].*${this.escapeRegex(fileName)}.*['"\`]`,
          'g'
        );

        if (staticImportRegex.test(content)) {
          importedBy.push(file);
          continue;
        }

        // Check for dynamic imports
        const dynamicImportRegex = new RegExp(
          `(?:import|require)\\s*\\(\\s*['"\`].*${this.escapeRegex(fileName)}.*['"\`]\\s*\\)`,
          'g'
        );

        if (dynamicImportRegex.test(content)) {
          dynamicImports.push(file);
        }
      }
    } catch (error) {
      console.warn(`Warning: Fallback file usage check failed for ${filePath}:`, error);
    }

    return {
      isUsed: importedBy.length > 0 || dynamicImports.length > 0,
      importedBy,
      dynamicImports,
    };
  }

  /**
   * Check if a line is inside a multi-line comment
   */
  private isInsideComment(content: string, line: string, lineIndex: number): boolean {
    const lines = content.split('\n');
    let insideComment = false;

    for (let i = 0; i <= lineIndex; i++) {
      const currentLine = lines[i].trim();

      // Check for comment start
      if (currentLine.includes('/*')) {
        insideComment = true;
      }

      // Check for comment end
      if (currentLine.includes('*/')) {
        insideComment = false;
      }
    }

    return insideComment;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Assess risk level for a deprecated item
   */
  private assessRisk(item: DeprecatedItem): RiskAssessment {
    const usageCount = item.usageLocations.length;
    
    // High risk: widely used or in critical paths
    if (usageCount > 10) {
      return {
        level: 'high',
        category: 'Widely Used',
        description: `"${item.itemName}" is used in ${usageCount} locations`,
        affectedFiles: item.usageLocations,
        recommendation: 'Create migration guide and update all usages before removal',
      };
    }

    // High risk: in core directories
    const isCoreFile = item.filePath.startsWith('app/') ||
                       item.filePath.startsWith('components/') ||
                       item.filePath.startsWith('store/');
    
    if (isCoreFile && usageCount > 0) {
      return {
        level: 'high',
        category: 'Core Component',
        description: `"${item.itemName}" is in core directory and still used`,
        affectedFiles: item.usageLocations,
        recommendation: 'Carefully review all usages and test thoroughly after removal',
      };
    }

    // Medium risk: used but not widely
    if (usageCount > 0 && usageCount <= 10) {
      return {
        level: 'medium',
        category: 'Limited Usage',
        description: `"${item.itemName}" is used in ${usageCount} location(s)`,
        affectedFiles: item.usageLocations,
        recommendation: 'Review usages and consider migration path',
      };
    }

    // Low risk: not used
    return {
      level: 'low',
      category: 'Unused',
      description: `"${item.itemName}" appears to be unused`,
      affectedFiles: [],
      recommendation: 'Safe to remove after verification',
    };
  }

  /**
   * Write manual review report to file
   */
  private async writeManualReviewReport(
    outputPath: string,
    items: DeprecatedItem[],
    risks: RiskAssessment[],
    recommendations: string[]
  ): Promise<void> {
    const lines: string[] = [];

    lines.push('# Manual Review Report - Deprecated Code');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`Total deprecated items: ${items.length}`);
    lines.push(`- High risk: ${risks.filter(r => r.level === 'high').length}`);
    lines.push(`- Medium risk: ${risks.filter(r => r.level === 'medium').length}`);
    lines.push(`- Low risk: ${risks.filter(r => r.level === 'low').length}`);
    lines.push('');
    lines.push('## Recommendations');
    lines.push('');
    recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
    lines.push('## Detailed Risk Assessment');
    lines.push('');

    // Group items by risk level
    const highRisk = items.filter((_, i) => risks[i].level === 'high');
    const mediumRisk = items.filter((_, i) => risks[i].level === 'medium');
    const lowRisk = items.filter((_, i) => risks[i].level === 'low');

    if (highRisk.length > 0) {
      lines.push('### ⚠️  High Risk Items');
      lines.push('');
      highRisk.forEach((item, index) => {
        const risk = risks.find(r => r.affectedFiles === item.usageLocations);
        lines.push(`#### ${item.itemName}`);
        lines.push('');
        lines.push(`- **File**: \`${item.filePath}:${item.lineNumber}\``);
        lines.push(`- **Annotation**: ${item.annotation}`);
        lines.push(`- **Risk**: ${risk?.description || 'Unknown'}`);
        lines.push(`- **Recommendation**: ${risk?.recommendation || 'Manual review required'}`);
        if (item.usageLocations.length > 0) {
          lines.push(`- **Used in**: ${item.usageLocations.length} location(s)`);
          item.usageLocations.slice(0, 5).forEach(loc => {
            lines.push(`  - \`${loc}\``);
          });
          if (item.usageLocations.length > 5) {
            lines.push(`  - ... and ${item.usageLocations.length - 5} more`);
          }
        }
        lines.push('');
      });
    }

    if (mediumRisk.length > 0) {
      lines.push('### ⚡ Medium Risk Items');
      lines.push('');
      mediumRisk.forEach((item) => {
        const risk = risks.find(r => r.affectedFiles === item.usageLocations);
        lines.push(`#### ${item.itemName}`);
        lines.push('');
        lines.push(`- **File**: \`${item.filePath}:${item.lineNumber}\``);
        lines.push(`- **Annotation**: ${item.annotation}`);
        lines.push(`- **Risk**: ${risk?.description || 'Unknown'}`);
        lines.push(`- **Recommendation**: ${risk?.recommendation || 'Manual review required'}`);
        if (item.usageLocations.length > 0) {
          lines.push(`- **Used in**:`);
          item.usageLocations.forEach(loc => {
            lines.push(`  - \`${loc}\``);
          });
        }
        lines.push('');
      });
    }

    if (lowRisk.length > 0) {
      lines.push('### ✓ Low Risk Items');
      lines.push('');
      lowRisk.forEach((item) => {
        lines.push(`- \`${item.itemName}\` in \`${item.filePath}:${item.lineNumber}\``);
      });
      lines.push('');
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Write report
    await fs.promises.writeFile(outputPath, lines.join('\n'), 'utf-8');
  }
}
