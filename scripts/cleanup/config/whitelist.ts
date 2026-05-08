/**
 * Whitelist Configuration
 * 
 * Defines files and functions that should NEVER be auto-removed by the cleanup system.
 * This includes core business logic, user-facing documentation, and active configuration files.
 * 
 * Requirements: 2.4, 4.5, 5.5
 */

/**
 * Whitelist entry for a file or function
 */
export interface WhitelistEntry {
  /** File path or glob pattern */
  path: string;
  /** Reason for whitelisting (for documentation) */
  reason: string;
  /** Optional: specific function/class names within the file */
  items?: string[];
}

/**
 * Core business logic files that should never be removed
 * 
 * These files contain essential application functionality and data models.
 */
export const coreBusinessLogic: WhitelistEntry[] = [
  // Core data models
  {
    path: 'types.ts',
    reason: 'Root-level domain model definitions (MoodEntry, MoodLevel, Status, etc.)',
  },
  {
    path: 'constants.ts',
    reason: 'Root-level constants including MOOD_CONFIG and core app settings',
  },
  
  // Store modules (Zustand state management)
  {
    path: 'store/useAppStore.ts',
    reason: 'Root Zustand store composition',
  },
  {
    path: 'store/modules/entries.ts',
    reason: 'Core mood entry management logic',
  },
  {
    path: 'store/modules/user.ts',
    reason: 'User authentication and profile management',
  },
  {
    path: 'store/modules/ai.ts',
    reason: 'AI features (emotion prediction, podcast, prescription)',
  },
  {
    path: 'store/modules/audio.ts',
    reason: 'Audio recording and playback functionality',
  },
  {
    path: 'store/modules/weather.ts',
    reason: 'Weather-themed emotion visualization',
  },
  {
    path: 'store/modules/storage.ts',
    reason: 'Data persistence and cloud sync logic',
  },
  {
    path: 'store/modules/types.ts',
    reason: 'Store module type definitions',
  },
  
  // Core pages (Expo Router)
  {
    path: 'app/_layout.tsx',
    reason: 'Root layout with font loading and Store initialization',
  },
  {
    path: 'app/(tabs)/_layout.tsx',
    reason: 'Bottom tab navigation layout',
  },
  {
    path: 'app/(tabs)/index.tsx',
    reason: 'Home page (Dashboard)',
  },
  {
    path: 'app/(tabs)/record.tsx',
    reason: 'Mood recording page',
  },
  {
    path: 'app/(tabs)/insights.tsx',
    reason: 'Insights page (心灵花园)',
  },
  {
    path: 'app/profile.tsx',
    reason: 'User profile and settings page',
  },
  {
    path: 'app/review-export.tsx',
    reason: 'Mood review and export functionality',
  },
  
  // Core components
  {
    path: 'components/Dashboard.tsx',
    reason: 'Main dashboard component',
  },
  {
    path: 'components/Record.tsx',
    reason: 'Mood recording component',
  },
  {
    path: 'components/Insights.tsx',
    reason: 'Insights and garden visualization component',
  },
  {
    path: 'components/EditEntryModal/**',
    reason: 'Mood entry editing modal and related components',
  },
  {
    path: 'components/ReviewExport/**',
    reason: 'Review export functionality components',
  },
  {
    path: 'components/entries/**',
    reason: 'Entry-related UI components',
  },
  {
    path: 'components/ai/**',
    reason: 'AI feature UI components',
  },
  
  // Services
  {
    path: 'services/**',
    reason: 'Domain services (e.g., companionship days calculation)',
  },
  
  // Library integrations
  {
    path: 'lib/supabase.ts',
    reason: 'Supabase client initialization',
  },
  
  // Utilities
  {
    path: 'utils/**',
    reason: 'Utility functions used across the application',
  },
  {
    path: 'shared/**',
    reason: 'Cross-layer shared utilities',
  },
  
  // Hooks
  {
    path: 'hooks/**',
    reason: 'Reusable React hooks',
  },
  
  // Styles
  {
    path: 'styles/**',
    reason: 'StyleSheet factories and theme-related styles',
  },
  
  // Constants
  {
    path: 'constants/**',
    reason: 'Modular constants (colors, etc.)',
  },
  
  // Types
  {
    path: 'types/**',
    reason: 'Supplementary type definitions',
  },
  
  // Features
  {
    path: 'features/**',
    reason: 'Feature modules (e.g., profile)',
  },
];

/**
 * User-facing documentation that should never be removed
 * 
 * These files are essential for users, contributors, and maintainers.
 */
export const userFacingDocumentation: WhitelistEntry[] = [
  {
    path: 'README.md',
    reason: 'Main project documentation (Chinese)',
  },
  {
    path: 'README.en.md',
    reason: 'Main project documentation (English)',
  },
  {
    path: 'PRIVACY.md',
    reason: 'Privacy policy (required for App Store)',
  },
  {
    path: 'SECURITY.md',
    reason: 'Security policy and best practices',
  },
  {
    path: 'CONTRIBUTING.md',
    reason: 'Contribution guidelines',
  },
  {
    path: 'CODE_OF_CONDUCT.md',
    reason: 'Community code of conduct',
  },
  {
    path: 'AGENTS.md',
    reason: 'Developer quick start guide',
  },
  {
    path: 'LICENSE',
    reason: 'MIT license file',
  },
];

/**
 * Active configuration files that should never be removed
 * 
 * These files are essential for building, testing, and running the application.
 */
export const activeConfigFiles: WhitelistEntry[] = [
  // Build and runtime configuration
  {
    path: 'app.json',
    reason: 'Expo app configuration',
  },
  {
    path: 'eas.json',
    reason: 'EAS Build configuration',
  },
  {
    path: 'package.json',
    reason: 'NPM package configuration and scripts',
  },
  {
    path: 'yarn.lock',
    reason: 'Yarn dependency lock file',
  },
  
  // TypeScript configuration
  {
    path: 'tsconfig.json',
    reason: 'TypeScript compiler configuration',
  },
  {
    path: 'expo-env.d.ts',
    reason: 'Expo TypeScript environment definitions',
  },
  
  // Build tools
  {
    path: 'babel.config.js',
    reason: 'Babel transpiler configuration',
  },
  {
    path: 'metro.config.js',
    reason: 'Metro bundler configuration',
  },
  
  // Code quality
  {
    path: 'eslint.config.js',
    reason: 'ESLint linting configuration',
  },
  {
    path: 'knip.json',
    reason: 'Knip unused code detection configuration',
  },
  
  // Testing
  {
    path: 'jest.config.js',
    reason: 'Jest testing framework configuration',
  },
  {
    path: 'jest.ci.config.js',
    reason: 'Jest CI-specific configuration',
  },
  {
    path: 'jest.setup.js',
    reason: 'Jest test setup and global mocks',
  },
  
  // Environment
  {
    path: '.env.example',
    reason: 'Environment variable template',
  },
  {
    path: '.gitignore',
    reason: 'Git ignore patterns',
  },
  {
    path: '.editorconfig',
    reason: 'Editor configuration for consistent formatting',
  },
  {
    path: '.npmrc',
    reason: 'NPM configuration',
  },
  {
    path: '.nvmrc',
    reason: 'Node version specification',
  },
  {
    path: '.yarnrc',
    reason: 'Yarn configuration',
  },
];

/**
 * App Store submission materials that should never be removed
 * 
 * These files are required for App Store submissions and updates.
 */
export const appStoreSubmission: WhitelistEntry[] = [
  {
    path: 'app-store-submission/**',
    reason: 'App Store submission materials (metadata, screenshots, checklists)',
  },
];

/**
 * Assets that should never be removed
 * 
 * These files are referenced by the application or build process.
 */
export const assets: WhitelistEntry[] = [
  {
    path: 'assets/**',
    reason: 'Application assets (images, fonts, etc.)',
  },
];

/**
 * Scripts that should never be removed
 * 
 * These scripts are used for verification, governance, and maintenance.
 */
export const scripts: WhitelistEntry[] = [
  {
    path: 'scripts/verify-*.js',
    reason: 'Configuration verification scripts',
  },
  {
    path: 'scripts/verify-governance.js',
    reason: 'Governance verification script (used in CI)',
  },
  {
    path: 'scripts/verify-governance-smoke.js',
    reason: 'Governance smoke test (used in CI)',
  },
  {
    path: 'scripts/governance/**',
    reason: 'Governance configuration and rules',
  },
  {
    path: 'scripts/cleanup/**',
    reason: 'Cleanup system implementation',
  },
];

/**
 * OpenSpec documentation that should never be removed
 * 
 * These files define the project specifications and development workflow.
 */
export const openspecDocumentation: WhitelistEntry[] = [
  {
    path: 'openspec/**',
    reason: 'OpenSpec specification-driven development documentation',
  },
];

/**
 * Database and backend configuration
 * 
 * These files are required for Supabase integration.
 */
export const databaseConfig: WhitelistEntry[] = [
  {
    path: 'supabase/**',
    reason: 'Supabase database schemas and SQL scripts',
  },
];

/**
 * Test files that should never be removed
 * 
 * These files ensure code quality and prevent regressions.
 */
export const testFiles: WhitelistEntry[] = [
  {
    path: '__tests__/**',
    reason: 'Jest unit tests, property-based tests, and integration tests',
  },
  {
    path: '**/*.test.ts',
    reason: 'Co-located test files',
  },
  {
    path: '**/*.test.tsx',
    reason: 'Co-located component test files',
  },
];

/**
 * Combined whitelist of all protected files and functions
 * 
 * This is the master whitelist used by FileScanner and DependencyAnalyzer.
 */
export const whitelist: WhitelistEntry[] = [
  ...coreBusinessLogic,
  ...userFacingDocumentation,
  ...activeConfigFiles,
  ...appStoreSubmission,
  ...assets,
  ...scripts,
  ...openspecDocumentation,
  ...databaseConfig,
  ...testFiles,
];

/**
 * Check if a file path is whitelisted
 * 
 * @param filePath - File path to check
 * @returns true if the file is whitelisted, false otherwise
 */
export function isWhitelisted(filePath: string): boolean {
  return whitelist.some((entry) => {
    // Handle glob patterns
    if (entry.path.includes('*')) {
      // Escape special regex characters except * and /
      let pattern = entry.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace ** with pattern that matches any number of path segments
      pattern = pattern.replace(/\*\*/g, '(.+)');
      
      // Replace * with pattern that matches any characters except /
      pattern = pattern.replace(/\*/g, '([^/]+)');
      
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(filePath);
    }
    
    // Exact match or directory prefix match
    return filePath === entry.path || filePath.startsWith(entry.path + '/');
  });
}

/**
 * Get the whitelist entry for a file path
 * 
 * @param filePath - File path to check
 * @returns WhitelistEntry if found, undefined otherwise
 */
export function getWhitelistEntry(filePath: string): WhitelistEntry | undefined {
  return whitelist.find((entry) => {
    // Handle glob patterns
    if (entry.path.includes('*')) {
      // Escape special regex characters except * and /
      let pattern = entry.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace ** with pattern that matches any number of path segments
      pattern = pattern.replace(/\*\*/g, '(.+)');
      
      // Replace * with pattern that matches any characters except /
      pattern = pattern.replace(/\*/g, '([^/]+)');
      
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(filePath);
    }
    
    // Exact match or directory prefix match
    return filePath === entry.path || filePath.startsWith(entry.path + '/');
  });
}

/**
 * Check if a specific function/class within a file is whitelisted
 * 
 * @param filePath - File path
 * @param itemName - Function or class name
 * @returns true if the item is whitelisted, false otherwise
 */
export function isItemWhitelisted(filePath: string, itemName: string): boolean {
  const entry = getWhitelistEntry(filePath);
  if (!entry) {
    return false;
  }
  
  // If no specific items are listed, the entire file is whitelisted
  if (!entry.items || entry.items.length === 0) {
    return true;
  }
  
  // Check if the specific item is whitelisted
  return entry.items.includes(itemName);
}
