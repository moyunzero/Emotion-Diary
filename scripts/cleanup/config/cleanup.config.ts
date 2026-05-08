/**
 * Cleanup Configuration
 * 
 * Defines default configuration values for the post-launch cleanup tool.
 * This configuration follows the requirements from the design document.
 */

export interface CleanupConfig {
  // Git configuration
  git: {
    tagName: string; // "pre-cleanup-v1.0.0"
    branchName: string; // "cleanup/post-launch-2026"
    excludeFromCleanCheck: string[]; // [".env", ".env.local"]
  };
  
  // Documentation patterns
  documentation: {
    archivePatterns: string[]; // ["*_SUMMARY.md", "*_FIX.md", ...]
    preserveFiles: string[]; // ["README.md", "PRIVACY.md", ...]
    archiveDirectory: string; // "docs/archive/"
    archiveRetentionDays: number; // 180 (days to keep archived files)
    permanentArchives: string[]; // Files to never auto-delete from archive
  };
  
  // Empty directory detection
  emptyDirectories: {
    ignoredFiles: string[]; // [".gitkeep", ".DS_Store", "Thumbs.db"]
    excludeRootDirectories: string[]; // ["src"]
  };
  
  // System files
  systemFiles: {
    patterns: string[]; // [".DS_Store", "Thumbs.db"]
  };
  
  // Build artifacts
  buildArtifacts: {
    patterns: string[]; // ["node_modules/", ".next/", "dist/", ...]
  };
  
  // Config backups
  configBackups: {
    patterns: string[]; // ["*.bak", "*.old", "*.backup"]
  };
  
  // Deprecated code
  deprecatedCode: {
    annotationPattern: RegExp; // /@deprecated/
    migrationCommentTemplate: string;
    whitelist: string[]; // Files/functions to never auto-remove
    requireManualReview: boolean; // Force manual review for all deprecated items
    autoCreateIssues: boolean; // Auto-create GitHub issues for tracking
  };
  
  // CI verification
  ci: {
    checks: string[]; // ["typecheck", "lint", "test:ci", "test:e2e", "verify:governance"]
    bundleSizeTolerance: number; // 0.1 (0.1%)
    runE2ETests: boolean; // Default: true
  };
  
  // Reporting
  reporting: {
    ciLogPath: string; // "docs/cleanup-ci-log.txt"
    summaryPath: string; // "docs/cleanup-summary-2026.md"
    deprecatedTrackingPath: string; // "docs/deprecated-tracking.md"
    manualReviewPath: string; // "docs/cleanup-manual-review.md"
  };
  
  // CLI defaults
  cli: {
    defaultDryRun: boolean; // true (always dry-run by default)
    requireForceFlag: boolean; // true (require --force for actual execution)
  };
}

/**
 * Default cleanup configuration
 * 
 * These values are based on the requirements and design document for
 * the post-launch cleanup initiative.
 */
export const defaultConfig: CleanupConfig = {
  git: {
    tagName: 'pre-cleanup-v1.0.0',
    branchName: 'cleanup/post-launch-2026',
    excludeFromCleanCheck: ['.env', '.env.local'],
  },
  
  documentation: {
    archivePatterns: [
      '*_SUMMARY.md',
      '*_FIX.md',
      '*_ANALYSIS.md',
      '*_REPORT.md',
    ],
    preserveFiles: [
      'README.md',
      'README.en.md',
      'PRIVACY.md',
      'SECURITY.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'AGENTS.md',
    ],
    archiveDirectory: 'docs/archive/',
    archiveRetentionDays: 180,
    permanentArchives: [],
  },
  
  emptyDirectories: {
    ignoredFiles: ['.gitkeep', '.DS_Store', 'Thumbs.db'],
    excludeRootDirectories: ['src'],
  },
  
  systemFiles: {
    patterns: ['.DS_Store', 'Thumbs.db'],
  },
  
  buildArtifacts: {
    patterns: [
      'node_modules/',
      '.next/',
      '.nuxt/',
      'dist/',
      'build/',
      'coverage/',
      '.expo/cache/',
    ],
  },
  
  configBackups: {
    patterns: ['*.bak', '*.old', '*.backup'],
  },
  
  deprecatedCode: {
    annotationPattern: /@deprecated/,
    migrationCommentTemplate: `/**
 * @deprecated Since v{version} - Use \`{replacement}\` instead
 * Migration guide: {guide}
 */`,
    whitelist: [],
    requireManualReview: true,
    autoCreateIssues: false,
  },
  
  ci: {
    checks: ['typecheck', 'lint', 'test:ci', 'verify:governance'],
    bundleSizeTolerance: 0.1, // 0.1%
    runE2ETests: false, // No E2E tests in current project
  },
  
  reporting: {
    ciLogPath: 'docs/cleanup-ci-log.txt',
    summaryPath: 'docs/cleanup-summary-2026.md',
    deprecatedTrackingPath: 'docs/deprecated-tracking.md',
    manualReviewPath: 'docs/cleanup-manual-review.md',
  },
  
  cli: {
    defaultDryRun: true,
    requireForceFlag: true,
  },
};

/**
 * Load cleanup configuration
 * 
 * Returns the default configuration. In the future, this can be extended
 * to support custom configuration files.
 * 
 * @returns CleanupConfig
 */
export function loadConfig(): CleanupConfig {
  return defaultConfig;
}
