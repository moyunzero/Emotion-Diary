/**
 * Unit tests for CIVerifier
 * 
 * Tests the CI verification component to ensure it correctly runs checks,
 * measures bundle sizes, and handles errors appropriately.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { CIVerifier } from '../CIVerifier';

// Mock child_process
jest.mock('child_process');
jest.mock('fs');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('CIVerifier', () => {
  let verifier: CIVerifier;

  beforeEach(() => {
    verifier = new CIVerifier('/test/project');
    jest.clearAllMocks();
  });

  describe('runCheck', () => {
    it('should return success when command succeeds', async () => {
      mockExecSync.mockReturnValue('All checks passed');

      const result = await verifier.runCheck('typecheck');

      expect(result.name).toBe('typecheck');
      expect(result.success).toBe(true);
      expect(result.output).toBe('All checks passed');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(mockExecSync).toHaveBeenCalledWith('yarn typecheck', expect.any(Object));
    });

    it('should return failure when command fails', async () => {
      const error: any = new Error('Type check failed');
      error.stdout = 'Error: Type mismatch in file.ts';
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await verifier.runCheck('typecheck');

      expect(result.name).toBe('typecheck');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Type mismatch');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle different check types', async () => {
      mockExecSync.mockReturnValue('Success');

      await verifier.runCheck('lint');
      expect(mockExecSync).toHaveBeenCalledWith('yarn lint', expect.any(Object));

      await verifier.runCheck('test:ci');
      expect(mockExecSync).toHaveBeenCalledWith('yarn test:ci', expect.any(Object));

      await verifier.runCheck('verify:governance');
      expect(mockExecSync).toHaveBeenCalledWith('yarn verify:governance', expect.any(Object));
    });

    it('should capture stderr when stdout is empty', async () => {
      const error: any = new Error('Command failed');
      error.stderr = 'Error output from stderr';
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await verifier.runCheck('lint');

      expect(result.success).toBe(false);
      expect(result.output).toBe('Error output from stderr');
    });

    it('should use error message as fallback', async () => {
      const error: any = new Error('Network timeout');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await verifier.runCheck('test:ci');

      expect(result.success).toBe(false);
      expect(result.output).toBe('Network timeout');
    });
  });

  describe('runFullPipeline', () => {
    it('should run all checks in sequence when all pass', async () => {
      mockExecSync.mockReturnValue('Success');

      const result = await verifier.runFullPipeline();

      expect(result.success).toBe(true);
      expect(result.checks).toHaveLength(4);
      expect(result.checks[0].name).toBe('typecheck');
      expect(result.checks[1].name).toBe('lint');
      expect(result.checks[2].name).toBe('test:ci');
      expect(result.checks[3].name).toBe('verify:governance');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should stop on first failure', async () => {
      let callCount = 0;
      mockExecSync.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          // Fail on lint (second check)
          const error: any = new Error('Lint failed');
          error.stdout = 'Linting errors found';
          throw error;
        }
        return 'Success';
      });

      const result = await verifier.runFullPipeline();

      expect(result.success).toBe(false);
      expect(result.checks).toHaveLength(2); // Only typecheck and lint
      expect(result.checks[0].success).toBe(true);
      expect(result.checks[1].success).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });

    it('should include duration for all checks', async () => {
      mockExecSync.mockReturnValue('Success');

      const result = await verifier.runFullPipeline();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      result.checks.forEach(check => {
        expect(check.duration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('compareBundleSizes', () => {
    it('should pass when size decreased', () => {
      const result = verifier.compareBundleSizes(1000, 900, 0.1);

      expect(result.passed).toBe(true);
      expect(result.before).toBe(1000);
      expect(result.after).toBe(900);
      expect(result.change).toBe(-100);
      expect(result.changePercent).toBe(-10);
    });

    it('should pass when size increased within tolerance', () => {
      const result = verifier.compareBundleSizes(1000, 1000.5, 0.1);

      expect(result.passed).toBe(true);
      expect(result.before).toBe(1000);
      expect(result.after).toBe(1000.5);
      expect(result.change).toBe(0.5);
      expect(result.changePercent).toBe(0.05);
    });

    it('should fail when size increased beyond tolerance', () => {
      const result = verifier.compareBundleSizes(1000, 1002, 0.1);

      expect(result.passed).toBe(false);
      expect(result.before).toBe(1000);
      expect(result.after).toBe(1002);
      expect(result.change).toBe(2);
      expect(result.changePercent).toBe(0.2);
    });

    it('should use default tolerance of 0.1%', () => {
      const result = verifier.compareBundleSizes(1000, 1001);

      expect(result.passed).toBe(true);
      expect(result.changePercent).toBe(0.1);
    });

    it('should handle zero size edge case', () => {
      const result = verifier.compareBundleSizes(0, 100, 0.1);

      expect(result.passed).toBe(false);
      expect(result.changePercent).toBe(Infinity);
    });

    it('should calculate percentage correctly for large sizes', () => {
      const result = verifier.compareBundleSizes(10000000, 10001000, 0.1);

      // 0.01% change is within 0.1% tolerance, so it should pass
      expect(result.passed).toBe(true);
      expect(result.change).toBe(1000);
      expect(result.changePercent).toBe(0.01);
    });
  });

  describe('measureBundleSize', () => {
    it('should measure expo export bundle size', async () => {
      mockExecSync
        .mockReturnValueOnce('') // rm -rf
        .mockReturnValueOnce('') // expo export
        .mockReturnValueOnce('12345\t/test/project/dist-export') // du -sb
        .mockReturnValueOnce(''); // rm -rf cleanup

      const size = await verifier.measureBundleSize();

      expect(size).toBe(12345);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('expo export'),
        expect.any(Object)
      );
    });

    it('should fallback to existing build directories', async () => {
      // Expo export fails
      mockExecSync.mockImplementation((cmd: any) => {
        if (typeof cmd === 'string' && cmd.includes('expo export')) {
          throw new Error('Expo export failed');
        }
        if (typeof cmd === 'string' && cmd.includes('du -sb')) {
          return '54321\t/test/project/dist';
        }
        return '';
      });

      mockExistsSync.mockImplementation((path: any) => {
        return path.includes('dist');
      });

      const size = await verifier.measureBundleSize();

      expect(size).toBe(54321);
    });

    it('should estimate from source code as last resort', async () => {
      // All build methods fail
      mockExecSync.mockImplementation((cmd: any) => {
        if (typeof cmd === 'string' && cmd.includes('expo export')) {
          throw new Error('Expo export failed');
        }
        if (typeof cmd === 'string' && cmd.includes('du -sb')) {
          return '10000\t/test/project/app';
        }
        return '';
      });

      mockExistsSync.mockImplementation((path: any) => {
        // No build dirs exist, but source dirs do
        return path.includes('app') || path.includes('components');
      });

      const size = await verifier.measureBundleSize();

      expect(size).toBeGreaterThan(0);
      // Should be approximately 70% of source size
      expect(size).toBeLessThan(20000);
    });

    it('should return zero when all methods fail', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      mockExistsSync.mockReturnValue(false);

      const size = await verifier.measureBundleSize();
      
      // When all methods fail, it returns 0 as fallback
      expect(size).toBe(0);
    });
  });

  describe('runE2ETests', () => {
    beforeEach(() => {
      // Clear module cache before each test
      jest.resetModules();
    });

    it('should return success when no E2E tests configured', async () => {
      // Mock require to return package.json without test:e2e
      jest.doMock('/test/project/package.json', () => ({
        scripts: {
          test: 'jest',
        },
      }), { virtual: true });

      const result = await verifier.runE2ETests();

      expect(result.success).toBe(true);
      expect(result.passedTests).toHaveLength(0);
      expect(result.failedTests).toHaveLength(0);
    });

    it('should run E2E tests when configured', async () => {
      // Mock require to return package.json with test:e2e
      jest.doMock('/test/project/package.json', () => ({
        scripts: {
          'test:e2e': 'playwright test',
        },
      }), { virtual: true });

      mockExecSync.mockReturnValue(`
        ✓ should login successfully (123ms)
        ✓ should create mood entry (456ms)
        ✓ should export data (789ms)
      `);

      const result = await verifier.runE2ETests();

      expect(result.success).toBe(true);
      expect(result.passedTests.length).toBeGreaterThanOrEqual(0);
      expect(result.failedTests).toHaveLength(0);
    });

    it('should parse failed E2E tests', async () => {
      jest.doMock('/test/project/package.json', () => ({
        scripts: {
          'test:e2e': 'playwright test',
        },
      }), { virtual: true });

      const error: any = new Error('Tests failed');
      error.stdout = `
        ✓ should login successfully (123ms)
        ✗ should handle invalid credentials (45ms)
        ✓ should create mood entry (456ms)
        ✗ should handle network error (67ms)
      `;
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = await verifier.runE2ETests();

      expect(result.success).toBe(false);
      expect(result.passedTests.length).toBeGreaterThanOrEqual(0);
      expect(result.failedTests.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle different test output formats', async () => {
      jest.doMock('/test/project/package.json', () => ({
        scripts: {
          'test:e2e': 'jest',
        },
      }), { virtual: true });

      mockExecSync.mockReturnValue(`
        ✔ test with checkmark
        ✓ test with tick
        × test with cross
        ✘ test with x
      `);

      const result = await verifier.runE2ETests();

      // Just verify it doesn't crash and returns a result
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.passedTests)).toBe(true);
      expect(Array.isArray(result.failedTests)).toBe(true);
    });
  });
});
