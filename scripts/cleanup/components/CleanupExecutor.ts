import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import type { DeprecatedItem, DocumentationFile } from './FileScanner';

/**
 * CleanupExecutor - Executes file operations safely with git integration
 * 
 * This component handles:
 * - Moving files to archive directory
 * - Cleaning up old archived files based on retention policy
 * - Removing files using git rm
 * - Removing empty directories
 * - Removing deprecated code using TypeScript AST manipulation
 * - Adding migration comments to deprecated code
 * - Creating GitHub issues for deprecated items (optional)
 * 
 * All operations support dry-run mode for safe preview.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.3, 4.1, 4.2, 4.3, 5.5, 5.6**
 */

export interface ArchiveResult {
  success: boolean;
  archivedFiles: string[];
  errors: string[];
  dryRun: boolean;
}

export interface RemovalResult {
  success: boolean;
  removedItems: string[];
  errors: string[];
  dryRun: boolean;
}

export class CleanupExecutor {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Move files to archive directory
   * 
   * @param files - Files to archive
   * @param preserveStructure - Keep subdirectory structure in archive
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  async archiveFiles(
    files: DocumentationFile[],
    preserveStructure: boolean,
    dryRun: boolean
  ): Promise<ArchiveResult> {
    const archivedFiles: string[] = [];
    const errors: string[] = [];

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Archiving ${files.length} files...`);

    for (const file of files) {
      try {
        const sourcePath = path.join(this.projectRoot, file.path);
        const destPath = preserveStructure
          ? path.join(this.projectRoot, file.archivePath)
          : path.join(this.projectRoot, 'docs/archive', path.basename(file.path));

        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
          errors.push(`Source file not found: ${file.path}`);
          continue;
        }

        if (dryRun) {
          console.log(`  Would move: ${file.path} -> ${destPath}`);
          archivedFiles.push(file.path);
        } else {
          // Create destination directory if it doesn't exist
          const destDir = path.dirname(destPath);
          await fs.promises.mkdir(destDir, { recursive: true });

          // Move file
          await fs.promises.rename(sourcePath, destPath);
          
          // Stage the changes in git
          try {
            execSync(`git rm "${file.path}"`, { cwd: this.projectRoot, stdio: 'pipe' });
            execSync(`git add "${path.relative(this.projectRoot, destPath)}"`, { 
              cwd: this.projectRoot, 
              stdio: 'pipe' 
            });
          } catch (gitError) {
            // If git commands fail, it might not be a git repo or file not tracked
            console.warn(`  Warning: Could not stage git changes for ${file.path}`);
          }

          console.log(`  ✓ Moved: ${file.path} -> ${destPath}`);
          archivedFiles.push(file.path);
        }
      } catch (error) {
        const errorMsg = `Failed to archive ${file.path}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }
    }

    const success = errors.length === 0;
    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Archive complete: ${archivedFiles.length} files, ${errors.length} errors`);

    return {
      success,
      archivedFiles,
      errors,
      dryRun,
    };
  }

  /**
   * Remove files using git rm
   * 
   * @param filePaths - Files to remove
   * @param commitMessage - Git commit message
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  async removeFiles(
    filePaths: string[],
    commitMessage: string,
    dryRun: boolean
  ): Promise<RemovalResult> {
    const removedItems: string[] = [];
    const errors: string[] = [];

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Removing ${filePaths.length} files...`);

    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(this.projectRoot, filePath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          errors.push(`File not found: ${filePath}`);
          continue;
        }

        if (dryRun) {
          console.log(`  Would remove: ${filePath}`);
          removedItems.push(filePath);
        } else {
          // Try to use git rm first
          try {
            execSync(`git rm -f "${filePath}"`, { cwd: this.projectRoot, stdio: 'pipe' });
            console.log(`  ✓ Removed (git): ${filePath}`);
          } catch (gitError) {
            // If git rm fails, fall back to regular file deletion
            await fs.promises.unlink(fullPath);
            console.log(`  ✓ Removed (fs): ${filePath}`);
          }

          removedItems.push(filePath);
        }
      } catch (error) {
        const errorMsg = `Failed to remove ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }
    }

    const success = errors.length === 0;
    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Removal complete: ${removedItems.length} files, ${errors.length} errors`);

    return {
      success,
      removedItems,
      errors,
      dryRun,
    };
  }

  /**
   * Remove empty directories
   * 
   * @param directories - Directories to remove
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 3.3**
   */
  async removeEmptyDirectories(
    directories: string[],
    dryRun: boolean
  ): Promise<RemovalResult> {
    const removedItems: string[] = [];
    const errors: string[] = [];

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Removing ${directories.length} empty directories...`);

    // Sort directories by depth (deepest first) to avoid issues with nested directories
    const sortedDirs = directories.sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      return depthB - depthA;
    });

    for (const dir of sortedDirs) {
      try {
        const fullPath = path.join(this.projectRoot, dir);

        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
          errors.push(`Directory not found: ${dir}`);
          continue;
        }

        // Verify directory is still empty (might have been removed as parent of another)
        const entries = await fs.promises.readdir(fullPath);
        const ignoredFiles = ['.gitkeep', '.DS_Store', 'Thumbs.db'];
        const meaningfulEntries = entries.filter(entry => !ignoredFiles.includes(entry));

        if (meaningfulEntries.length > 0) {
          errors.push(`Directory not empty: ${dir} (contains ${meaningfulEntries.length} items)`);
          continue;
        }

        if (dryRun) {
          console.log(`  Would remove directory: ${dir}`);
          removedItems.push(dir);
        } else {
          // Remove the directory
          await fs.promises.rm(fullPath, { recursive: true, force: true });
          console.log(`  ✓ Removed directory: ${dir}`);
          removedItems.push(dir);
        }
      } catch (error) {
        const errorMsg = `Failed to remove directory ${dir}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`  ✗ ${errorMsg}`);
      }
    }

    const success = errors.length === 0;
    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Directory removal complete: ${removedItems.length} directories, ${errors.length} errors`);

    return {
      success,
      removedItems,
      errors,
      dryRun,
    };
  }

  /**
   * Remove deprecated code from a file using TypeScript AST manipulation
   * 
   * @param item - Deprecated item to remove
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 5.5**
   */
  async removeDeprecatedCode(
    item: DeprecatedItem,
    dryRun: boolean
  ): Promise<void> {
    const fullPath = path.join(this.projectRoot, item.filePath);

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Removing deprecated code: ${item.itemName} in ${item.filePath}`);

    try {
      const sourceCode = await fs.promises.readFile(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        fullPath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      // Find the node to remove
      let nodeToRemove: ts.Node | null = null;
      let nodeStart = 0;
      let nodeEnd = 0;

      const visit = (node: ts.Node) => {
        const jsDocTags = ts.getJSDocTags(node);
        const hasDeprecatedTag = jsDocTags.some(tag => tag.tagName.text === 'deprecated');

        if (hasDeprecatedTag) {
          const nodeName = this.getNodeName(node);
          if (nodeName === item.itemName) {
            nodeToRemove = node;
            
            // Include JSDoc comment in removal
            const jsDocComments = ts.getJSDocCommentsAndTags(node);
            if (jsDocComments.length > 0) {
              nodeStart = jsDocComments[0].pos;
            } else {
              nodeStart = node.pos;
            }
            nodeEnd = node.end;
            return;
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      if (!nodeToRemove) {
        console.warn(`  Warning: Could not find deprecated item ${item.itemName} in ${item.filePath}`);
        return;
      }

      if (dryRun) {
        const removedCode = sourceCode.substring(nodeStart, nodeEnd);
        console.log(`  Would remove code (${nodeEnd - nodeStart} characters):`);
        console.log(`  ${removedCode.split('\n').slice(0, 5).join('\n  ')}${removedCode.split('\n').length > 5 ? '\n  ...' : ''}`);
      } else {
        // Remove the code
        const newSourceCode = sourceCode.substring(0, nodeStart) + sourceCode.substring(nodeEnd);
        
        // Write the modified code back to the file
        await fs.promises.writeFile(fullPath, newSourceCode, 'utf-8');
        
        console.log(`  ✓ Removed deprecated code: ${item.itemName}`);
      }
    } catch (error) {
      const errorMsg = `Failed to remove deprecated code ${item.itemName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`  ✗ ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Add migration comment to deprecated code
   * 
   * @param item - Deprecated item still in use
   * @param migrationGuide - URL or description
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 5.6**
   */
  async addMigrationComment(
    item: DeprecatedItem,
    migrationGuide: string,
    dryRun: boolean
  ): Promise<void> {
    const fullPath = path.join(this.projectRoot, item.filePath);

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Adding migration comment: ${item.itemName} in ${item.filePath}`);

    try {
      const sourceCode = await fs.promises.readFile(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        fullPath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );

      // Find the node to add migration comment to
      let targetNode: ts.Node | null = null;
      let commentInsertPos = 0;

      const visit = (node: ts.Node) => {
        const jsDocTags = ts.getJSDocTags(node);
        const hasDeprecatedTag = jsDocTags.some(tag => tag.tagName.text === 'deprecated');

        if (hasDeprecatedTag) {
          const nodeName = this.getNodeName(node);
          if (nodeName === item.itemName) {
            targetNode = node;
            
            // Find the position to insert the migration comment
            const jsDocComments = ts.getJSDocCommentsAndTags(node);
            if (jsDocComments.length > 0) {
              // Insert after the existing JSDoc comment
              commentInsertPos = jsDocComments[jsDocComments.length - 1].end;
            } else {
              // Insert before the node
              commentInsertPos = node.pos;
            }
            return;
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      if (!targetNode) {
        console.warn(`  Warning: Could not find deprecated item ${item.itemName} in ${item.filePath}`);
        return;
      }

      // Check if migration comment already exists
      const existingComment = sourceCode.substring(Math.max(0, commentInsertPos - 500), commentInsertPos);
      if (existingComment.includes('Migration guide:')) {
        console.log(`  ℹ Migration comment already exists for ${item.itemName}`);
        return;
      }

      // Create migration comment template
      const migrationComment = `\n/**\n * @deprecated Since v2.1.0 - Use alternative instead\n * Migration guide: ${migrationGuide}\n */\n`;

      if (dryRun) {
        console.log(`  Would add migration comment:`);
        console.log(`  ${migrationComment.trim()}`);
      } else {
        // Insert the migration comment
        const newSourceCode = 
          sourceCode.substring(0, commentInsertPos) + 
          migrationComment + 
          sourceCode.substring(commentInsertPos);
        
        // Write the modified code back to the file
        await fs.promises.writeFile(fullPath, newSourceCode, 'utf-8');
        
        console.log(`  ✓ Added migration comment to ${item.itemName}`);
      }
    } catch (error) {
      const errorMsg = `Failed to add migration comment to ${item.itemName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`  ✗ ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Create GitHub issue for deprecated item tracking (optional, requires token)
   * 
   * @param item - Deprecated item to track
   * @returns Issue URL
   * 
   * Note: This is a placeholder implementation. Actual GitHub API integration
   * requires authentication and is optional for the cleanup process.
   */
  async createDeprecatedItemIssue(item: DeprecatedItem): Promise<string> {
    console.log(`\n[OPTIONAL] Creating GitHub issue for deprecated item: ${item.itemName}`);
    
    // Check if GitHub token is available
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log(`  ℹ GitHub token not found. Skipping issue creation.`);
      console.log(`  ℹ To enable issue creation, set GITHUB_TOKEN environment variable.`);
      return '';
    }

    try {
      // This is a placeholder for GitHub API integration
      // In a real implementation, you would use @octokit/rest or similar
      console.log(`  ℹ GitHub issue creation not yet implemented`);
      console.log(`  ℹ Issue would be created with:`);
      console.log(`    - Title: [Deprecated] Remove ${item.itemName}`);
      console.log(`    - Body: Deprecated item in ${item.filePath} (line ${item.lineNumber})`);
      console.log(`    - Labels: deprecated, cleanup`);
      if (item.removalDate) {
        console.log(`    - Milestone: Remove by ${item.removalDate}`);
      }
      
      return 'https://github.com/example/repo/issues/123'; // Placeholder URL
    } catch (error) {
      console.error(`  ✗ Failed to create GitHub issue: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  /**
   * Clean up old archived files based on retention policy
   * 
   * @param retentionDays - Number of days to keep archived files (default 180)
   * @param permanentArchives - Files to never auto-delete from archive
   * @param dryRun - If true, only simulate and report
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  async cleanupOldArchives(
    retentionDays: number,
    permanentArchives: string[],
    dryRun: boolean
  ): Promise<RemovalResult> {
    const removedItems: string[] = [];
    const errors: string[] = [];
    const archiveDir = path.join(this.projectRoot, 'docs/archive');

    console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Cleaning up archives older than ${retentionDays} days...`);

    // Check if archive directory exists
    if (!fs.existsSync(archiveDir)) {
      console.log(`  ℹ Archive directory does not exist: ${archiveDir}`);
      return {
        success: true,
        removedItems: [],
        errors: [],
        dryRun,
      };
    }

    try {
      // Recursively scan archive directory for files
      const files = await this.scanDirectoryRecursive(archiveDir);
      
      console.log(`  Found ${files.length} files in archive directory`);

      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      for (const filePath of files) {
        try {
          const relativePath = path.relative(this.projectRoot, filePath);
          const fileName = path.basename(filePath);

          // Check if file is in permanent archives list
          if (permanentArchives.includes(relativePath) || permanentArchives.includes(fileName)) {
            console.log(`  ℹ Skipping permanent archive: ${relativePath}`);
            continue;
          }

          // Get file stats
          const stats = await fs.promises.stat(filePath);
          const fileAge = now - stats.mtime.getTime();
          const fileAgeDays = Math.floor(fileAge / (1000 * 60 * 60 * 24));

          // Check if file is older than retention period
          if (fileAge > retentionMs) {
            if (dryRun) {
              console.log(`  Would remove: ${relativePath} (${fileAgeDays} days old)`);
              removedItems.push(relativePath);
            } else {
              // Try to use git rm first
              try {
                execSync(`git rm -f "${relativePath}"`, { cwd: this.projectRoot, stdio: 'pipe' });
                console.log(`  ✓ Removed (git): ${relativePath} (${fileAgeDays} days old)`);
              } catch (gitError) {
                // If git rm fails, fall back to regular file deletion
                await fs.promises.unlink(filePath);
                console.log(`  ✓ Removed (fs): ${relativePath} (${fileAgeDays} days old)`);
              }

              removedItems.push(relativePath);
            }
          } else {
            console.log(`  ℹ Keeping: ${relativePath} (${fileAgeDays} days old, within retention period)`);
          }
        } catch (error) {
          const errorMsg = `Failed to process ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }

      const success = errors.length === 0;
      console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Archive cleanup complete: ${removedItems.length} files removed, ${errors.length} errors`);

      return {
        success,
        removedItems,
        errors,
        dryRun,
      };
    } catch (error) {
      const errorMsg = `Failed to scan archive directory: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`  ✗ ${errorMsg}`);

      return {
        success: false,
        removedItems,
        errors,
        dryRun,
      };
    }
  }

  /**
   * Recursively scan a directory for all files
   * Helper method for archive cleanup
   */
  private async scanDirectoryRecursive(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectoryRecursive(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return files;
  }

  /**
   * Get the name of a TypeScript node (function, class, variable, etc.)
   * Helper method for AST manipulation
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
}
