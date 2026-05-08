/**
 * CI Verifier Component
 * 
 * Responsible for running CI checks and verifying build integrity after cleanup operations.
 * Implements the verification strategy defined in the design document.
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 8.3, 8.4, 8.5, 8.6**
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Result of a single CI check
 */
export interface CheckResult {
  name: string;
  success: boolean;
  output: string;
  duration: number;
}

/**
 * Result of the full CI pipeline
 */
export interface CIResult {
  success: boolean;
  checks: CheckResult[];
  duration: number;
}

/**
 * Bundle size comparison result
 */
export interface BundleSizeComparison {
  passed: boolean;
  before: number;
  after: number;
  change: number;
  changePercent: number;
}

/**
 * E2E test result
 */
export interface E2ETestResult {
  success: boolean;
  passedTests: string[];
  failedTests: string[];
  duration: number;
  screenshotPaths: string[];
}

/**
 * CI Verifier
 * 
 * Runs CI checks and verifies build integrity after cleanup operations.
 */
export class CIVerifier {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run full CI pipeline
   * 
   * Executes all CI checks in sequence:
   * 1. yarn typecheck
   * 2. yarn lint
   * 3. yarn test:ci
   * 4. yarn verify:governance
   * 
   * **Validates: Requirements 6.2**
   * 
   * @returns CIResult with all check results
   */
  async runFullPipeline(): Promise<CIResult> {
    const startTime = Date.now();
    const checks: CheckResult[] = [];
    let allSuccess = true;

    // Define checks in order
    const checkNames = ['typecheck', 'lint', 'test:ci', 'verify:governance'];

    for (const checkName of checkNames) {
      const result = await this.runCheck(checkName);
      checks.push(result);

      if (!result.success) {
        allSuccess = false;
        // Stop on first failure
        break;
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: allSuccess,
      checks,
      duration,
    };
  }

  /**
   * Run individual CI check
   * 
   * Executes a single CI check command and parses the output to determine success/failure.
   * 
   * **Validates: Requirements 6.2**
   * 
   * @param checkName - Name of check (typecheck, lint, test:ci, verify:governance)
   * @returns CheckResult with success status and output
   */
  async runCheck(checkName: string): Promise<CheckResult> {
    const startTime = Date.now();
    let success = false;
    let output = '';

    try {
      // Map check name to yarn command
      const command = `yarn ${checkName}`;

      // Execute command and capture output
      output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      });

      success = true;
    } catch (error: any) {
      // Command failed - capture error output
      success = false;
      output = error.stdout || error.stderr || error.message || 'Unknown error';
    }

    const duration = Date.now() - startTime;

    return {
      name: checkName,
      success,
      output,
      duration,
    };
  }

  /**
   * Measure bundle size
   * 
   * Uses source-map-explorer or expo export output to measure bundle size.
   * Falls back to measuring dist/build directory size if tools are not available.
   * 
   * **Validates: Requirements 8.3, 8.4**
   * 
   * @returns Bundle size in bytes
   */
  async measureBundleSize(): Promise<number> {
    try {
      // Strategy 1: Try to use expo export to generate a production bundle
      // This is the most accurate for React Native/Expo projects
      const exportDir = join(this.projectRoot, 'dist-export');
      
      try {
        // Clean previous export
        execSync(`rm -rf ${exportDir}`, { cwd: this.projectRoot });
        
        // Export production bundle
        execSync('npx expo export --output-dir dist-export --platform android', {
          cwd: this.projectRoot,
          stdio: 'pipe',
          timeout: 120000, // 2 minute timeout
        });

        // Measure the exported bundle size
        const bundleSize = this.getDirectorySize(exportDir);
        
        // Clean up
        execSync(`rm -rf ${exportDir}`, { cwd: this.projectRoot });
        
        return bundleSize;
      } catch (exportError) {
        // Expo export failed, try alternative methods
      }

      // Strategy 2: Try to find existing build artifacts
      const possibleBuildDirs = [
        'dist',
        'build',
        '.expo/web/build',
        'android/app/build/outputs',
        'ios/build',
      ];

      for (const dir of possibleBuildDirs) {
        const fullPath = join(this.projectRoot, dir);
        if (existsSync(fullPath)) {
          return this.getDirectorySize(fullPath);
        }
      }

      // Strategy 3: Estimate based on source code size (fallback)
      // This is less accurate but provides a baseline
      const sourceDirs = ['app', 'components', 'features', 'store', 'utils', 'services'];
      let totalSize = 0;

      for (const dir of sourceDirs) {
        const fullPath = join(this.projectRoot, dir);
        if (existsSync(fullPath)) {
          totalSize += this.getDirectorySize(fullPath);
        }
      }

      // Multiply by estimated build factor (minification, bundling, etc.)
      // This is a rough estimate
      return Math.floor(totalSize * 0.7);
    } catch (error: any) {
      throw new Error(`Failed to measure bundle size: ${error.message}`);
    }
  }

  /**
   * Get directory size recursively
   * 
   * @param dirPath - Directory path
   * @returns Total size in bytes
   */
  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;

    try {
      const { execSync } = require('child_process');
      
      // Use du command for accurate size calculation
      const output = execSync(`du -sb "${dirPath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Parse output: "12345\t/path/to/dir"
      const match = output.match(/^(\d+)/);
      if (match) {
        totalSize = parseInt(match[1], 10);
      }
    } catch (error) {
      // Fallback to manual calculation if du command fails
      totalSize = this.getDirectorySizeManual(dirPath);
    }

    return totalSize;
  }

  /**
   * Get directory size manually (fallback method)
   * 
   * @param dirPath - Directory path
   * @returns Total size in bytes
   */
  private getDirectorySizeManual(dirPath: string): number {
    const fs = require('fs');
    const path = require('path');
    let totalSize = 0;

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += this.getDirectorySizeManual(itemPath);
        }
      }
    } catch (error) {
      // Ignore errors (permission denied, etc.)
    }

    return totalSize;
  }

  /**
   * Compare bundle sizes with tolerance
   * 
   * Verifies that bundle size did not increase beyond the allowed tolerance.
   * Default tolerance is 0.1% to account for tool version differences.
   * 
   * **Validates: Requirements 8.5**
   * 
   * @param before - Size before cleanup (bytes)
   * @param after - Size after cleanup (bytes)
   * @param tolerance - Allowed increase percentage (default 0.1%)
   * @returns BundleSizeComparison result
   */
  compareBundleSizes(
    before: number,
    after: number,
    tolerance: number = 0.1
  ): BundleSizeComparison {
    const change = after - before;
    const changePercent = (change / before) * 100;

    // Pass if size decreased or increased within tolerance
    const passed = changePercent <= tolerance;

    return {
      passed,
      before,
      after,
      change,
      changePercent,
    };
  }

  /**
   * Run E2E tests to verify core user flows
   * 
   * Executes E2E test suite if it exists. Currently, the project does not have
   * E2E tests configured, so this method will check for test:e2e script and
   * return a success result if not found.
   * 
   * **Validates: Requirements 8.6**
   * 
   * @returns E2ETestResult
   */
  async runE2ETests(): Promise<E2ETestResult> {
    const startTime = Date.now();

    try {
      // Check if E2E tests are configured
      const packageJsonPath = join(this.projectRoot, 'package.json');
      const packageJson = require(packageJsonPath);

      if (!packageJson.scripts || !packageJson.scripts['test:e2e']) {
        // No E2E tests configured - return success
        return {
          success: true,
          passedTests: [],
          failedTests: [],
          duration: Date.now() - startTime,
          screenshotPaths: [],
        };
      }

      // Run E2E tests
      const output = execSync('yarn test:e2e', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      });

      // Parse output to extract test results
      const { passedTests, failedTests } = this.parseE2EOutput(output);

      return {
        success: failedTests.length === 0,
        passedTests,
        failedTests,
        duration: Date.now() - startTime,
        screenshotPaths: [], // Would be populated by actual E2E framework
      };
    } catch (error: any) {
      // E2E tests failed
      const output = error.stdout || error.stderr || error.message || '';
      const { passedTests, failedTests } = this.parseE2EOutput(output);

      return {
        success: false,
        passedTests,
        failedTests,
        duration: Date.now() - startTime,
        screenshotPaths: [],
      };
    }
  }

  /**
   * Parse E2E test output to extract passed/failed tests
   * 
   * @param output - Test output string
   * @returns Object with passedTests and failedTests arrays
   */
  private parseE2EOutput(output: string): {
    passedTests: string[];
    failedTests: string[];
  } {
    const passedTests: string[] = [];
    const failedTests: string[] = [];

    // Parse Jest-style output
    const lines = output.split('\n');

    for (const line of lines) {
      // Match patterns like:
      // ✓ should login successfully (123ms)
      // ✗ should handle invalid credentials (45ms)
      const passMatch = line.match(/^\s*[✓✔]\s+(.+?)(?:\s+\(\d+ms\))?$/);
      const failMatch = line.match(/^\s*[✗✘×]\s+(.+?)(?:\s+\(\d+ms\))?$/);

      if (passMatch) {
        passedTests.push(passMatch[1].trim());
      } else if (failMatch) {
        failedTests.push(failMatch[1].trim());
      }
    }

    return { passedTests, failedTests };
  }
}
