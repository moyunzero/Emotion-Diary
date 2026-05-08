/**
 * Unit tests for whitelist configuration
 */

import {
    activeConfigFiles,
    coreBusinessLogic,
    getWhitelistEntry,
    isItemWhitelisted,
    isWhitelisted,
    userFacingDocumentation,
    whitelist,
} from '../whitelist';

describe('Whitelist Configuration', () => {
  describe('whitelist array', () => {
    it('should contain entries from all categories', () => {
      expect(whitelist.length).toBeGreaterThan(0);
      expect(whitelist.length).toBeGreaterThan(coreBusinessLogic.length);
      expect(whitelist.length).toBeGreaterThan(userFacingDocumentation.length);
      expect(whitelist.length).toBeGreaterThan(activeConfigFiles.length);
    });

    it('should have valid structure for all entries', () => {
      whitelist.forEach((entry) => {
        expect(entry).toHaveProperty('path');
        expect(entry).toHaveProperty('reason');
        expect(typeof entry.path).toBe('string');
        expect(typeof entry.reason).toBe('string');
        expect(entry.path.length).toBeGreaterThan(0);
        expect(entry.reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isWhitelisted', () => {
    it('should return true for exact file matches', () => {
      expect(isWhitelisted('README.md')).toBe(true);
      expect(isWhitelisted('PRIVACY.md')).toBe(true);
      expect(isWhitelisted('types.ts')).toBe(true);
      expect(isWhitelisted('constants.ts')).toBe(true);
      expect(isWhitelisted('package.json')).toBe(true);
      expect(isWhitelisted('tsconfig.json')).toBe(true);
    });

    it('should return true for files in whitelisted directories', () => {
      expect(isWhitelisted('store/useAppStore.ts')).toBe(true);
      expect(isWhitelisted('store/modules/entries.ts')).toBe(true);
      expect(isWhitelisted('app/_layout.tsx')).toBe(true);
      expect(isWhitelisted('app/(tabs)/index.tsx')).toBe(true);
      expect(isWhitelisted('components/Dashboard.tsx')).toBe(true);
    });

    it('should return true for glob pattern matches', () => {
      // ** pattern (any number of directories)
      expect(isWhitelisted('utils/formatDate.ts')).toBe(true);
      expect(isWhitelisted('utils/helpers/string.ts')).toBe(true);
      expect(isWhitelisted('hooks/useAppState.ts')).toBe(true);
      expect(isWhitelisted('assets/images/icon.png')).toBe(true);
      expect(isWhitelisted('assets/fonts/custom.ttf')).toBe(true);
      
      // * pattern (single directory level)
      expect(isWhitelisted('scripts/verify-env-security.js')).toBe(true);
      expect(isWhitelisted('scripts/verify-all-configs.js')).toBe(true);
    });

    it('should return true for test files', () => {
      expect(isWhitelisted('__tests__/utils.test.ts')).toBe(true);
      expect(isWhitelisted('components/Dashboard.test.tsx')).toBe(true);
      expect(isWhitelisted('store/modules/entries.test.ts')).toBe(true);
    });

    it('should return false for non-whitelisted files', () => {
      expect(isWhitelisted('random-file.txt')).toBe(false);
      expect(isWhitelisted('temp/backup.bak')).toBe(false);
      expect(isWhitelisted('.DS_Store')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isWhitelisted('')).toBe(false);
      expect(isWhitelisted('/')).toBe(false);
    });
  });

  describe('getWhitelistEntry', () => {
    it('should return entry for whitelisted files', () => {
      const entry = getWhitelistEntry('README.md');
      expect(entry).toBeDefined();
      expect(entry?.path).toBe('README.md');
      expect(entry?.reason).toContain('Main project documentation');
    });

    it('should return entry for files in whitelisted directories', () => {
      const entry = getWhitelistEntry('store/modules/entries.ts');
      expect(entry).toBeDefined();
      expect(entry?.reason).toContain('Core mood entry management logic');
    });

    it('should return entry for glob pattern matches', () => {
      const entry = getWhitelistEntry('utils/formatDate.ts');
      expect(entry).toBeDefined();
      expect(entry?.path).toBe('utils/**');
    });

    it('should return undefined for non-whitelisted files', () => {
      const entry = getWhitelistEntry('random-file.txt');
      expect(entry).toBeUndefined();
    });
  });

  describe('isItemWhitelisted', () => {
    it('should return true for items in whitelisted files without specific items', () => {
      // Files without specific items list are fully whitelisted
      expect(isItemWhitelisted('types.ts', 'MoodEntry')).toBe(true);
      expect(isItemWhitelisted('types.ts', 'MoodLevel')).toBe(true);
      expect(isItemWhitelisted('constants.ts', 'MOOD_CONFIG')).toBe(true);
    });

    it('should return false for items in non-whitelisted files', () => {
      expect(isItemWhitelisted('random-file.ts', 'someFunction')).toBe(false);
    });
  });

  describe('Core business logic whitelist', () => {
    it('should include all store modules', () => {
      const storeModules = [
        'store/useAppStore.ts',
        'store/modules/entries.ts',
        'store/modules/user.ts',
        'store/modules/ai.ts',
        'store/modules/audio.ts',
        'store/modules/weather.ts',
        'store/modules/storage.ts',
        'store/modules/types.ts',
      ];

      storeModules.forEach((module) => {
        expect(isWhitelisted(module)).toBe(true);
      });
    });

    it('should include all core pages', () => {
      const corePages = [
        'app/_layout.tsx',
        'app/(tabs)/_layout.tsx',
        'app/(tabs)/index.tsx',
        'app/(tabs)/record.tsx',
        'app/(tabs)/insights.tsx',
        'app/profile.tsx',
        'app/review-export.tsx',
      ];

      corePages.forEach((page) => {
        expect(isWhitelisted(page)).toBe(true);
      });
    });

    it('should include core components', () => {
      const coreComponents = [
        'components/Dashboard.tsx',
        'components/Record.tsx',
        'components/Insights.tsx',
      ];

      coreComponents.forEach((component) => {
        expect(isWhitelisted(component)).toBe(true);
      });
    });
  });

  describe('User-facing documentation whitelist', () => {
    it('should include all required documentation files', () => {
      const docs = [
        'README.md',
        'README.en.md',
        'PRIVACY.md',
        'SECURITY.md',
        'CONTRIBUTING.md',
        'CODE_OF_CONDUCT.md',
        'AGENTS.md',
        'LICENSE',
      ];

      docs.forEach((doc) => {
        expect(isWhitelisted(doc)).toBe(true);
      });
    });
  });

  describe('Active config files whitelist', () => {
    it('should include all build configuration files', () => {
      const configs = [
        'app.json',
        'eas.json',
        'package.json',
        'tsconfig.json',
        'babel.config.js',
        'metro.config.js',
        'eslint.config.js',
        'jest.config.js',
      ];

      configs.forEach((config) => {
        expect(isWhitelisted(config)).toBe(true);
      });
    });
  });

  describe('Glob pattern matching', () => {
    it('should correctly match ** patterns', () => {
      // utils/** should match any file in utils directory and subdirectories
      expect(isWhitelisted('utils/file.ts')).toBe(true);
      expect(isWhitelisted('utils/sub/file.ts')).toBe(true);
      expect(isWhitelisted('utils/sub/deep/file.ts')).toBe(true);
    });

    it('should correctly match * patterns', () => {
      // scripts/verify-*.js should match any verify script
      expect(isWhitelisted('scripts/verify-env-security.js')).toBe(true);
      expect(isWhitelisted('scripts/verify-all-configs.js')).toBe(true);
      expect(isWhitelisted('scripts/verify-governance.js')).toBe(true);
    });

    it('should not match patterns incorrectly', () => {
      // utils/** should not match files outside utils
      expect(isWhitelisted('other/file.ts')).toBe(false);
      
      // scripts/verify-*.js should not match non-verify scripts
      expect(isWhitelisted('scripts/other-script.js')).toBe(false);
    });
  });
});
