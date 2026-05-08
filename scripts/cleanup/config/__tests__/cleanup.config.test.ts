/**
 * Unit tests for cleanup configuration loader
 * 
 * Tests the configuration loading and validation logic.
 */

import { CleanupConfig, defaultConfig, loadConfig } from '../cleanup.config';

describe('Cleanup Configuration', () => {
  describe('loadConfig', () => {
    it('should return a valid CleanupConfig object', () => {
      const config = loadConfig();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('git');
      expect(config).toHaveProperty('documentation');
      expect(config).toHaveProperty('emptyDirectories');
      expect(config).toHaveProperty('systemFiles');
      expect(config).toHaveProperty('buildArtifacts');
      expect(config).toHaveProperty('configBackups');
      expect(config).toHaveProperty('deprecatedCode');
      expect(config).toHaveProperty('ci');
      expect(config).toHaveProperty('reporting');
      expect(config).toHaveProperty('cli');
    });

    it('should return the default configuration', () => {
      const config = loadConfig();
      
      expect(config).toEqual(defaultConfig);
    });
  });

  describe('defaultConfig', () => {
    describe('git configuration', () => {
      it('should have correct git tag name', () => {
        expect(defaultConfig.git.tagName).toBe('pre-cleanup-v1.0.0');
      });

      it('should have correct git branch name', () => {
        expect(defaultConfig.git.branchName).toBe('cleanup/post-launch-2026');
      });

      it('should exclude .env files from clean check', () => {
        expect(defaultConfig.git.excludeFromCleanCheck).toContain('.env');
        expect(defaultConfig.git.excludeFromCleanCheck).toContain('.env.local');
      });
    });

    describe('documentation configuration', () => {
      it('should have correct archive patterns', () => {
        const patterns = defaultConfig.documentation.archivePatterns;
        
        expect(patterns).toContain('*_SUMMARY.md');
        expect(patterns).toContain('*_FIX.md');
        expect(patterns).toContain('*_ANALYSIS.md');
        expect(patterns).toContain('*_REPORT.md');
      });

      it('should preserve important documentation files', () => {
        const preserved = defaultConfig.documentation.preserveFiles;
        
        expect(preserved).toContain('README.md');
        expect(preserved).toContain('README.en.md');
        expect(preserved).toContain('PRIVACY.md');
        expect(preserved).toContain('SECURITY.md');
        expect(preserved).toContain('CONTRIBUTING.md');
        expect(preserved).toContain('CODE_OF_CONDUCT.md');
        expect(preserved).toContain('AGENTS.md');
      });

      it('should have correct archive directory', () => {
        expect(defaultConfig.documentation.archiveDirectory).toBe('docs/archive/');
      });

      it('should have archive retention period of 180 days', () => {
        expect(defaultConfig.documentation.archiveRetentionDays).toBe(180);
      });
    });

    describe('empty directories configuration', () => {
      it('should ignore system files in empty directory detection', () => {
        const ignored = defaultConfig.emptyDirectories.ignoredFiles;
        
        expect(ignored).toContain('.gitkeep');
        expect(ignored).toContain('.DS_Store');
        expect(ignored).toContain('Thumbs.db');
      });

      it('should exclude src from root directory deletion', () => {
        expect(defaultConfig.emptyDirectories.excludeRootDirectories).toContain('src');
      });
    });

    describe('system files configuration', () => {
      it('should detect common system files', () => {
        const patterns = defaultConfig.systemFiles.patterns;
        
        expect(patterns).toContain('.DS_Store');
        expect(patterns).toContain('Thumbs.db');
      });
    });

    describe('build artifacts configuration', () => {
      it('should detect common build artifact directories', () => {
        const patterns = defaultConfig.buildArtifacts.patterns;
        
        expect(patterns).toContain('node_modules/');
        expect(patterns).toContain('.next/');
        expect(patterns).toContain('.nuxt/');
        expect(patterns).toContain('dist/');
        expect(patterns).toContain('build/');
        expect(patterns).toContain('coverage/');
        expect(patterns).toContain('.expo/cache/');
      });
    });

    describe('config backups configuration', () => {
      it('should detect backup file patterns', () => {
        const patterns = defaultConfig.configBackups.patterns;
        
        expect(patterns).toContain('*.bak');
        expect(patterns).toContain('*.old');
        expect(patterns).toContain('*.backup');
      });
    });

    describe('deprecated code configuration', () => {
      it('should have correct annotation pattern', () => {
        expect(defaultConfig.deprecatedCode.annotationPattern).toEqual(/@deprecated/);
      });

      it('should have migration comment template', () => {
        const template = defaultConfig.deprecatedCode.migrationCommentTemplate;
        
        expect(template).toContain('@deprecated');
        expect(template).toContain('{version}');
        expect(template).toContain('{replacement}');
        expect(template).toContain('{guide}');
      });

      it('should require manual review by default', () => {
        expect(defaultConfig.deprecatedCode.requireManualReview).toBe(true);
      });

      it('should not auto-create issues by default', () => {
        expect(defaultConfig.deprecatedCode.autoCreateIssues).toBe(false);
      });

      it('should have empty whitelist by default', () => {
        expect(defaultConfig.deprecatedCode.whitelist).toEqual([]);
      });
    });

    describe('CI configuration', () => {
      it('should have correct CI checks', () => {
        const checks = defaultConfig.ci.checks;
        
        expect(checks).toContain('typecheck');
        expect(checks).toContain('lint');
        expect(checks).toContain('test:ci');
        expect(checks).toContain('verify:governance');
      });

      it('should have bundle size tolerance of 0.1%', () => {
        expect(defaultConfig.ci.bundleSizeTolerance).toBe(0.1);
      });

      it('should not run E2E tests by default', () => {
        expect(defaultConfig.ci.runE2ETests).toBe(false);
      });
    });

    describe('reporting configuration', () => {
      it('should have correct report file paths', () => {
        expect(defaultConfig.reporting.ciLogPath).toBe('docs/cleanup-ci-log.txt');
        expect(defaultConfig.reporting.summaryPath).toBe('docs/cleanup-summary-2026.md');
        expect(defaultConfig.reporting.deprecatedTrackingPath).toBe('docs/deprecated-tracking.md');
        expect(defaultConfig.reporting.manualReviewPath).toBe('docs/cleanup-manual-review.md');
      });
    });

    describe('CLI configuration', () => {
      it('should default to dry-run mode', () => {
        expect(defaultConfig.cli.defaultDryRun).toBe(true);
      });

      it('should require --force flag for execution', () => {
        expect(defaultConfig.cli.requireForceFlag).toBe(true);
      });
    });
  });

  describe('configuration structure validation', () => {
    it('should have all required top-level properties', () => {
      const requiredProps: (keyof CleanupConfig)[] = [
        'git',
        'documentation',
        'emptyDirectories',
        'systemFiles',
        'buildArtifacts',
        'configBackups',
        'deprecatedCode',
        'ci',
        'reporting',
        'cli',
      ];

      requiredProps.forEach((prop) => {
        expect(defaultConfig).toHaveProperty(prop);
      });
    });

    it('should have all required git properties', () => {
      expect(defaultConfig.git).toHaveProperty('tagName');
      expect(defaultConfig.git).toHaveProperty('branchName');
      expect(defaultConfig.git).toHaveProperty('excludeFromCleanCheck');
    });

    it('should have all required documentation properties', () => {
      expect(defaultConfig.documentation).toHaveProperty('archivePatterns');
      expect(defaultConfig.documentation).toHaveProperty('preserveFiles');
      expect(defaultConfig.documentation).toHaveProperty('archiveDirectory');
      expect(defaultConfig.documentation).toHaveProperty('archiveRetentionDays');
      expect(defaultConfig.documentation).toHaveProperty('permanentArchives');
    });

    it('should have arrays for pattern properties', () => {
      expect(Array.isArray(defaultConfig.documentation.archivePatterns)).toBe(true);
      expect(Array.isArray(defaultConfig.documentation.preserveFiles)).toBe(true);
      expect(Array.isArray(defaultConfig.emptyDirectories.ignoredFiles)).toBe(true);
      expect(Array.isArray(defaultConfig.systemFiles.patterns)).toBe(true);
      expect(Array.isArray(defaultConfig.buildArtifacts.patterns)).toBe(true);
      expect(Array.isArray(defaultConfig.configBackups.patterns)).toBe(true);
      expect(Array.isArray(defaultConfig.ci.checks)).toBe(true);
    });

    it('should have string values for path properties', () => {
      expect(typeof defaultConfig.git.tagName).toBe('string');
      expect(typeof defaultConfig.git.branchName).toBe('string');
      expect(typeof defaultConfig.documentation.archiveDirectory).toBe('string');
      expect(typeof defaultConfig.reporting.ciLogPath).toBe('string');
      expect(typeof defaultConfig.reporting.summaryPath).toBe('string');
    });

    it('should have number values for numeric properties', () => {
      expect(typeof defaultConfig.documentation.archiveRetentionDays).toBe('number');
      expect(typeof defaultConfig.ci.bundleSizeTolerance).toBe('number');
    });

    it('should have boolean values for flag properties', () => {
      expect(typeof defaultConfig.deprecatedCode.requireManualReview).toBe('boolean');
      expect(typeof defaultConfig.deprecatedCode.autoCreateIssues).toBe('boolean');
      expect(typeof defaultConfig.ci.runE2ETests).toBe('boolean');
      expect(typeof defaultConfig.cli.defaultDryRun).toBe('boolean');
      expect(typeof defaultConfig.cli.requireForceFlag).toBe('boolean');
    });
  });
});
