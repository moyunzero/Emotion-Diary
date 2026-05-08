/**
 * Unit tests for CleanupCLI
 * 
 * Tests CLI argument parsing, dry-run report display, and confirmation prompts.
 */

import { CleanupCLI, CLIOptions, DryRunReport, RiskAssessment } from '../CleanupCLI';

// Mock inquirer before importing
jest.mock('inquirer', () => ({
  __esModule: true,
  default: {
    prompt: jest.fn(),
  },
  prompt: jest.fn(),
}));

describe('CleanupCLI', () => {
  let cli: CleanupCLI;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    cli = new CleanupCLI();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('parseArguments', () => {
    it('should parse default arguments (dry-run mode)', () => {
      const args = ['node', 'cleanup'];
      const options = cli.parseArguments(args);

      expect(options.dryRun).toBe(true);
      expect(options.force).toBe(false);
      expect(options.phase).toBeUndefined();
      expect(options.verbose).toBe(false);
      expect(options.skipCI).toBe(false);
    });

    it('should parse --force flag (disable dry-run)', () => {
      const args = ['node', 'cleanup', '--force'];
      const options = cli.parseArguments(args);

      expect(options.dryRun).toBe(false);
      expect(options.force).toBe(true);
    });

    it('should parse --phase option', () => {
      const args = ['node', 'cleanup', '--phase', 'docs'];
      const options = cli.parseArguments(args);

      expect(options.phase).toBe('docs');
    });

    it('should parse --verbose flag', () => {
      const args = ['node', 'cleanup', '--verbose'];
      const options = cli.parseArguments(args);

      expect(options.verbose).toBe(true);
    });

    it('should parse --skip-ci flag', () => {
      const args = ['node', 'cleanup', '--skip-ci'];
      const options = cli.parseArguments(args);

      expect(options.skipCI).toBe(true);
    });

    it('should parse multiple flags', () => {
      const args = ['node', 'cleanup', '--force', '--phase', 'deprecated', '--verbose'];
      const options = cli.parseArguments(args);

      expect(options.dryRun).toBe(false);
      expect(options.force).toBe(true);
      expect(options.phase).toBe('deprecated');
      expect(options.verbose).toBe(true);
    });
  });

  describe('displayDryRunReport', () => {
    it('should display empty report', () => {
      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('Dry-Run Analysis Report')
      )).toBe(true);
    });

    it('should display report with files to remove', () => {
      const report: DryRunReport = {
        phases: [
          {
            phaseName: 'Documentation Cleanup',
            filesToRemove: ['docs/TEST_SUMMARY.md', 'docs/TEST_FIX.md'],
            filesToMove: [],
            directoriesToRemove: [],
            deprecatedItemsToRemove: [],
            warnings: [],
          },
        ],
        totalFilesToRemove: 2,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: -1024,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('Files to remove: 2')
      )).toBe(true);
    });

    it('should display report with files to move', () => {
      const report: DryRunReport = {
        phases: [
          {
            phaseName: 'Documentation Cleanup',
            filesToRemove: [],
            filesToMove: [
              { source: 'docs/OLD.md', destination: 'docs/archive/OLD.md' },
            ],
            directoriesToRemove: [],
            deprecatedItemsToRemove: [],
            warnings: [],
          },
        ],
        totalFilesToRemove: 0,
        totalFilesToMove: 1,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('Files to move: 1')
      )).toBe(true);
    });

    it('should display report with warnings', () => {
      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings: ['Warning 1', 'Warning 2'],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('Warnings:')
      )).toBe(true);
    });

    it('should display risk assessments', () => {
      const risks: RiskAssessment[] = [
        {
          level: 'high',
          category: 'Deprecated Code',
          description: 'Removing deprecated function that may be used',
          affectedFiles: ['src/utils.ts'],
          recommendation: 'Manual review required',
        },
        {
          level: 'low',
          category: 'Documentation',
          description: 'Moving old documentation files',
          affectedFiles: ['docs/OLD.md'],
          recommendation: 'Safe to proceed',
        },
      ];

      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings: [],
        risks,
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('Risk Assessments')
      )).toBe(true);
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('HIGH RISK')
      )).toBe(true);
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('LOW RISK')
      )).toBe(true);
    });

    it('should display bundle size change in bytes', () => {
      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: -512,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('-512 bytes')
      )).toBe(true);
    });

    it('should display bundle size change in KB', () => {
      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: -2048,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('KB')
      )).toBe(true);
    });

    it('should display bundle size change in MB', () => {
      const report: DryRunReport = {
        phases: [],
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: -2097152, // 2 MB
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('MB')
      )).toBe(true);
    });

    it('should truncate long file lists', () => {
      const report: DryRunReport = {
        phases: [
          {
            phaseName: 'Test Phase',
            filesToRemove: [
              'file1.ts',
              'file2.ts',
              'file3.ts',
              'file4.ts',
              'file5.ts',
              'file6.ts',
            ],
            filesToMove: [],
            directoriesToRemove: [],
            deprecatedItemsToRemove: [],
            warnings: [],
          },
        ],
        totalFilesToRemove: 6,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings: [],
        risks: [],
      };

      cli.displayDryRunReport(report);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('... and 3 more')
      )).toBe(true);
    });
  });

  describe('promptForConfirmation', () => {
    it('should prompt for confirmation', async () => {
      // Mock inquirer.prompt directly
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({ confirmed: true });

      const confirmed = await cli.promptForConfirmation();

      expect(confirmed).toBe(true);
      expect(inquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Do you want to proceed with the cleanup?',
          default: false,
        },
      ]);
    });

    it('should return false when user cancels', async () => {
      // Mock inquirer.prompt directly
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({ confirmed: false });

      const confirmed = await cli.promptForConfirmation();

      expect(confirmed).toBe(false);
    });
  });

  describe('run', () => {
    it('should run in dry-run mode by default', async () => {
      const options: CLIOptions = {
        dryRun: true,
        force: false,
        verbose: false,
        skipCI: false,
      };

      const mockOrchestrator = {
        generateDryRunReport: jest.fn().mockResolvedValue({
          phases: [],
          totalFilesToRemove: 0,
          totalFilesToMove: 0,
          totalDirectoriesToRemove: 0,
          estimatedBundleSizeChange: 0,
          warnings: [],
          risks: [],
        }),
      };

      await cli.run(options, mockOrchestrator);

      expect(mockOrchestrator.generateDryRunReport).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.some((call) =>
        call[0].includes('dry-run mode')
      )).toBe(true);
    });

    it('should prompt for confirmation in force mode', async () => {
      const options: CLIOptions = {
        dryRun: false,
        force: true,
        verbose: false,
        skipCI: false,
      };

      const mockOrchestrator = {
        generateDryRunReport: jest.fn().mockResolvedValue({
          phases: [],
          totalFilesToRemove: 0,
          totalFilesToMove: 0,
          totalDirectoriesToRemove: 0,
          estimatedBundleSizeChange: 0,
          warnings: [],
          risks: [],
        }),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      // Mock inquirer.prompt directly
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({ confirmed: true });

      await cli.run(options, mockOrchestrator);

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockOrchestrator.execute).toHaveBeenCalled();
    });

    it('should cancel execution when user declines confirmation', async () => {
      const options: CLIOptions = {
        dryRun: false,
        force: true,
        verbose: false,
        skipCI: false,
      };

      const mockOrchestrator = {
        generateDryRunReport: jest.fn().mockResolvedValue({
          phases: [],
          totalFilesToRemove: 0,
          totalFilesToMove: 0,
          totalDirectoriesToRemove: 0,
          estimatedBundleSizeChange: 0,
          warnings: [],
          risks: [],
        }),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      // Mock inquirer.prompt directly
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({ confirmed: false });

      try {
        await cli.run(options, mockOrchestrator);
      } catch (error: any) {
        // Expected to throw due to process.exit
        expect(error.message).toBe('process.exit called');
      }

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockOrchestrator.execute).not.toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle errors gracefully', async () => {
      const options: CLIOptions = {
        dryRun: true,
        force: false,
        verbose: false,
        skipCI: false,
      };

      const mockOrchestrator = {
        generateDryRunReport: jest.fn().mockRejectedValue(new Error('Test error')),
      };

      try {
        await cli.run(options, mockOrchestrator);
      } catch (error: any) {
        // Expected to throw due to process.exit
        expect(error.message).toBe('process.exit called');
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls.some((call) =>
        call[0].includes('Cleanup failed')
      )).toBe(true);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should display stack trace in verbose mode', async () => {
      const options: CLIOptions = {
        dryRun: true,
        force: false,
        verbose: true,
        skipCI: false,
      };

      const mockOrchestrator = {
        generateDryRunReport: jest.fn().mockRejectedValue(new Error('Test error')),
      };

      try {
        await cli.run(options, mockOrchestrator);
      } catch (error: any) {
        // Expected to throw due to process.exit
        expect(error.message).toBe('process.exit called');
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls.some((call) =>
        call[0].includes('Stack trace')
      )).toBe(true);
    });
  });
});
