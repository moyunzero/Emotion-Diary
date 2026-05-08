"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScanner = void 0;
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
class FileScanner {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    /**
     * Find documentation files matching cleanup patterns
     * Patterns: *_SUMMARY.md, *_FIX.md, *_ANALYSIS.md, *_REPORT.md
     *
     * **Validates: Requirements 2.1**
     */
    async findDocumentationFiles() {
        const patterns = [
            '*_SUMMARY.md',
            '*_FIX.md',
            '*_ANALYSIS.md',
            '*_REPORT.md',
        ];
        const results = [];
        for (const pattern of patterns) {
            const files = await (0, glob_1.glob)(pattern, {
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
    async findEmptyDirectories(excludeRoot = true) {
        const emptyDirs = [];
        const ignoredFiles = ['.gitkeep', '.DS_Store', 'Thumbs.db'];
        // Get all directories
        const allDirs = await (0, glob_1.glob)('**/', {
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
                const meaningfulEntries = entries.filter(entry => !ignoredFiles.includes(entry));
                if (meaningfulEntries.length === 0) {
                    emptyDirs.push(dir);
                }
            }
            catch (error) {
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
    async findSystemFiles() {
        const patterns = ['.DS_Store', 'Thumbs.db'];
        const systemFiles = [];
        for (const pattern of patterns) {
            const files = await (0, glob_1.glob)(`**/${pattern}`, {
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
    async findBackupConfigFiles() {
        const patterns = ['*.bak', '*.old', '*.backup'];
        const backupFiles = [];
        for (const pattern of patterns) {
            const files = await (0, glob_1.glob)(`**/${pattern}`, {
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
    async findBuildArtifacts(gitignorePatterns) {
        const buildArtifactPatterns = [
            'node_modules/',
            '.next/',
            '.nuxt/',
            'dist/',
            'build/',
            'coverage/',
            '.expo/cache/',
        ];
        const artifacts = [];
        for (const pattern of buildArtifactPatterns) {
            // Check if pattern is in gitignore
            const isInGitignore = gitignorePatterns.some(gitPattern => gitPattern.includes(pattern.replace(/\/$/, '')));
            if (!isInGitignore) {
                // This build artifact is not in .gitignore, check if it exists in git
                const files = await (0, glob_1.glob)(`${pattern}**/*`, {
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

    async findDeprecatedCode() {
        const deprecatedItems = [];
        // Find all TypeScript/JavaScript files
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
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

    async parseDeprecatedAnnotations(fullPath, relativePath) {
        const items = [];
        try {
            const sourceCode = await fs.promises.readFile(fullPath, 'utf-8');
            const sourceFile = ts.createSourceFile(fullPath, sourceCode, ts.ScriptTarget.Latest, true);
            const visit = (node) => {
                // Check for JSDoc comments with @deprecated tag
                const jsDocTags = ts.getJSDocTags(node);
                const deprecatedTag = jsDocTags.find(tag => tag.tagName.text === 'deprecated');
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
        }
        catch (error) {
            // File might have syntax errors or be unreadable, skip it
            console.warn(`Warning: Could not parse ${relativePath}:`, error);
        }
        return items;
    }
    /**
     * Get the name of a TypeScript node (function, class, variable, etc.)
     */
    getNodeName(node) {
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

    extractDeprecatedAnnotation(node, sourceCode) {
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
}
exports.FileScanner = FileScanner;
