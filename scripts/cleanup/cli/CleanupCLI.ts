/**
 * Cleanup CLI Interface
 * 
 * Provides command-line interface for the post-launch cleanup tool.
 * Supports dry-run mode (default), force execution, phase-specific runs,
 * and verbose output.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 6.1, 6.2**
 */

import { Command } from 'commander';
import inquirer from 'inquirer';

/**
 * CLI options parsed from command-line arguments
 */
export interface CLIOptions {
  dryRun: boolean; // Default: true
  force: boolean; // Default: false (requires explicit --force to execute)
  phase?: string; // Optional: run specific phase only
  verbose: boolean; // Default: false
  skipCI: boolean; // Default: false (skip CI checks, dangerous!)
}

/**
 * Dry-run report for a single phase
 */
export interface DryRunPhaseReport {
  phaseName: string;
  filesToRemove: string[];
  filesToMove: { source: string; destination: string }[];
  directoriesToRemove: string[];
  deprecatedItemsToRemove: DeprecatedItem[];
  warnings: string[];
}

/**
 * Complete dry-run report
 */
export interface DryRunReport {
  phases: DryRunPhaseReport[];
  totalFilesToRemove: number;
  totalFilesToMove: number;
  totalDirectoriesToRemove: number;
  estimatedBundleSizeChange: number;
  warnings: string[];
  risks: RiskAssessment[];
}

/**
 * Risk assessment for cleanup operations
 */
export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  affectedFiles: string[];
  recommendation: string;
}

/**
 * Deprecated item information
 */
export interface DeprecatedItem {
  filePath: string;
  itemName: string;
  lineNumber: number;
  annotation: string;
  isUsed: boolean;
  usageLocations: string[];
  removalDate?: string;
  migrationGuide?: string;
  permanent?: boolean;
}

/**
 * Cleanup CLI
 * 
 * Main CLI interface for the cleanup tool. Handles argument parsing,
 * dry-run reporting, and user confirmation.
 */
export class CleanupCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Setup CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('cleanup')
      .description('Post-launch cleanup tool for 心晴MO')
      .version('1.0.0')
      .option(
        '--dry-run',
        'Run in dry-run mode (analyze only, no changes)',
        true
      )
      .option(
        '--force',
        'Execute actual cleanup (requires explicit flag)',
        false
      )
      .option(
        '--phase <phase>',
        'Run specific phase only (backup, docs, directories, config, deprecated, verification)'
      )
      .option(
        '--verbose',
        'Enable verbose output',
        false
      )
      .option(
        '--skip-ci',
        'Skip CI checks (dangerous! use only for testing)',
        false
      );
  }

  /**
   * Parse CLI arguments and return options
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3**
   * 
   * @param args - Command-line arguments (default: process.argv)
   * @returns Parsed CLI options
   */
  parseArguments(args: string[] = process.argv): CLIOptions {
    this.program.parse(args);
    const options = this.program.opts();

    // Determine dry-run mode
    // If --force is provided, disable dry-run
    // Otherwise, always run in dry-run mode
    const dryRun = !options.force;

    return {
      dryRun,
      force: options.force || false,
      phase: options.phase,
      verbose: options.verbose || false,
      skipCI: options.skipCi || false,
    };
  }

  /**
   * Run cleanup with options
   * 
   * Orchestrates the cleanup process:
   * 1. Parse CLI arguments
   * 2. If dry-run mode, analyze and display report
   * 3. If force mode, prompt for confirmation and execute
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 6.1, 6.2**
   * 
   * @param options - CLI options
   * @param orchestrator - Phase orchestrator (injected for testability)
   */
  async run(
    options: CLIOptions,
    orchestrator?: any // PhaseOrchestrator will be implemented in task 12.1
  ): Promise<void> {
    try {
      // Display welcome message
      this.displayWelcome(options);

      // Validate options
      this.validateOptions(options);

      if (options.dryRun) {
        // Dry-run mode: analyze and display report
        console.log('\n🔍 Running in dry-run mode (analysis only, no changes)...\n');

        // Generate dry-run report
        const report = await this.generateDryRunReport(options, orchestrator);

        // Display report
        this.displayDryRunReport(report);

        // Provide instructions for actual execution
        console.log('\n💡 To execute the cleanup, run:');
        console.log('   yarn cleanup:run --force\n');
      } else {
        // Force mode: prompt for confirmation and execute
        console.log('\n⚠️  Running in FORCE mode (will make actual changes)...\n');

        // Generate dry-run report first
        const report = await this.generateDryRunReport(options, orchestrator);

        // Display report
        this.displayDryRunReport(report);

        // Prompt for confirmation
        const confirmed = await this.promptForConfirmation();

        if (!confirmed) {
          console.log('\n❌ Cleanup cancelled by user.\n');
          process.exit(0);
        }

        // Execute cleanup
        console.log('\n🚀 Starting cleanup execution...\n');

        if (orchestrator) {
          await orchestrator.execute(options);
        } else {
          console.log('⚠️  Orchestrator not provided. Skipping execution.');
        }

        console.log('\n✅ Cleanup completed successfully!\n');
      }
    } catch (error: any) {
      console.error('\n❌ Cleanup failed:', error.message);
      if (options.verbose) {
        console.error('\nStack trace:', error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Display welcome message
   * 
   * @param options - CLI options
   */
  private displayWelcome(options: CLIOptions): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║          心晴MO Post-Launch Cleanup Tool v1.0.0            ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (options.dryRun) {
      console.log('\n📋 Mode: DRY-RUN (analysis only, no changes)');
    } else {
      console.log('\n⚠️  Mode: FORCE (will make actual changes)');
    }

    if (options.phase) {
      console.log(`📌 Phase: ${options.phase} only`);
    }

    if (options.verbose) {
      console.log('🔊 Verbose output enabled');
    }

    if (options.skipCI) {
      console.log('⚠️  CI checks disabled (dangerous!)');
    }
  }

  /**
   * Validate CLI options
   * 
   * @param options - CLI options
   * @throws Error if options are invalid
   */
  private validateOptions(options: CLIOptions): void {
    // Validate phase name if provided
    if (options.phase) {
      const validPhases = [
        'backup',
        'docs',
        'directories',
        'config',
        'deprecated',
        'verification',
      ];

      if (!validPhases.includes(options.phase)) {
        throw new Error(
          `Invalid phase: ${options.phase}. Valid phases: ${validPhases.join(', ')}`
        );
      }
    }

    // Warn if skipCI is enabled
    if (options.skipCI && !options.dryRun) {
      console.warn(
        '\n⚠️  WARNING: CI checks are disabled. This is dangerous and may break the build!'
      );
    }
  }

  /**
   * Generate dry-run report
   * 
   * Analyzes what would be changed without making actual changes.
   * 
   * @param options - CLI options
   * @param orchestrator - Phase orchestrator
   * @returns Dry-run report
   */
  private async generateDryRunReport(
    options: CLIOptions,
    orchestrator?: any
  ): Promise<DryRunReport> {
    // If orchestrator is provided, use it to generate report
    if (orchestrator && orchestrator.generateDryRunReport) {
      return await orchestrator.generateDryRunReport(options);
    }

    // Otherwise, return a placeholder report
    // This will be replaced when PhaseOrchestrator is implemented
    return {
      phases: [],
      totalFilesToRemove: 0,
      totalFilesToMove: 0,
      totalDirectoriesToRemove: 0,
      estimatedBundleSizeChange: 0,
      warnings: ['Orchestrator not available. Dry-run report is incomplete.'],
      risks: [],
    };
  }

  /**
   * Display dry-run report
   * 
   * Shows analysis results in a user-friendly format with risk assessments.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3**
   * 
   * @param report - Dry-run report
   */
  displayDryRunReport(report: DryRunReport): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Dry-Run Analysis Report                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   • Files to remove: ${report.totalFilesToRemove}`);
    console.log(`   • Files to move: ${report.totalFilesToMove}`);
    console.log(`   • Directories to remove: ${report.totalDirectoriesToRemove}`);
    console.log(
      `   • Estimated bundle size change: ${this.formatBundleSizeChange(report.estimatedBundleSizeChange)}`
    );

    // Warnings
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach((warning) => {
        console.log(`   • ${warning}`);
      });
    }

    // Risk assessments
    if (report.risks.length > 0) {
      console.log('\n🔍 Risk Assessments:\n');
      this.displayRiskAssessments(report.risks);
    }

    // Phase details
    if (report.phases.length > 0) {
      console.log('\n📋 Phase Details:\n');
      report.phases.forEach((phase, index) => {
        this.displayPhaseReport(phase, index + 1);
      });
    }
  }

  /**
   * Display risk assessments
   * 
   * @param risks - Risk assessments
   */
  private displayRiskAssessments(risks: RiskAssessment[]): void {
    // Group risks by level
    const risksByLevel = {
      high: risks.filter((r) => r.level === 'high'),
      medium: risks.filter((r) => r.level === 'medium'),
      low: risks.filter((r) => r.level === 'low'),
    };

    // Display high risks first
    if (risksByLevel.high.length > 0) {
      console.log('   🔴 HIGH RISK:');
      risksByLevel.high.forEach((risk) => {
        this.displayRisk(risk);
      });
    }

    // Display medium risks
    if (risksByLevel.medium.length > 0) {
      console.log('   🟡 MEDIUM RISK:');
      risksByLevel.medium.forEach((risk) => {
        this.displayRisk(risk);
      });
    }

    // Display low risks
    if (risksByLevel.low.length > 0) {
      console.log('   🟢 LOW RISK:');
      risksByLevel.low.forEach((risk) => {
        this.displayRisk(risk);
      });
    }
  }

  /**
   * Display a single risk assessment
   * 
   * @param risk - Risk assessment
   */
  private displayRisk(risk: RiskAssessment): void {
    console.log(`      • ${risk.category}: ${risk.description}`);
    if (risk.affectedFiles.length > 0) {
      console.log(`        Affected files: ${risk.affectedFiles.length}`);
      if (risk.affectedFiles.length <= 5) {
        risk.affectedFiles.forEach((file) => {
          console.log(`          - ${file}`);
        });
      } else {
        risk.affectedFiles.slice(0, 3).forEach((file) => {
          console.log(`          - ${file}`);
        });
        console.log(`          ... and ${risk.affectedFiles.length - 3} more`);
      }
    }
    console.log(`        Recommendation: ${risk.recommendation}`);
    console.log('');
  }

  /**
   * Display phase report
   * 
   * @param phase - Phase report
   * @param phaseNumber - Phase number
   */
  private displayPhaseReport(phase: DryRunPhaseReport, phaseNumber: number): void {
    console.log(`   Phase ${phaseNumber}: ${phase.phaseName}`);

    if (phase.filesToRemove.length > 0) {
      console.log(`      Files to remove: ${phase.filesToRemove.length}`);
      if (phase.filesToRemove.length <= 5) {
        phase.filesToRemove.forEach((file) => {
          console.log(`         - ${file}`);
        });
      } else {
        phase.filesToRemove.slice(0, 3).forEach((file) => {
          console.log(`         - ${file}`);
        });
        console.log(`         ... and ${phase.filesToRemove.length - 3} more`);
      }
    }

    if (phase.filesToMove.length > 0) {
      console.log(`      Files to move: ${phase.filesToMove.length}`);
      if (phase.filesToMove.length <= 5) {
        phase.filesToMove.forEach((move) => {
          console.log(`         - ${move.source} → ${move.destination}`);
        });
      } else {
        phase.filesToMove.slice(0, 3).forEach((move) => {
          console.log(`         - ${move.source} → ${move.destination}`);
        });
        console.log(`         ... and ${phase.filesToMove.length - 3} more`);
      }
    }

    if (phase.directoriesToRemove.length > 0) {
      console.log(`      Directories to remove: ${phase.directoriesToRemove.length}`);
      if (phase.directoriesToRemove.length <= 5) {
        phase.directoriesToRemove.forEach((dir) => {
          console.log(`         - ${dir}`);
        });
      } else {
        phase.directoriesToRemove.slice(0, 3).forEach((dir) => {
          console.log(`         - ${dir}`);
        });
        console.log(`         ... and ${phase.directoriesToRemove.length - 3} more`);
      }
    }

    if (phase.deprecatedItemsToRemove.length > 0) {
      console.log(
        `      Deprecated items to remove: ${phase.deprecatedItemsToRemove.length}`
      );
      if (phase.deprecatedItemsToRemove.length <= 5) {
        phase.deprecatedItemsToRemove.forEach((item) => {
          console.log(`         - ${item.itemName} (${item.filePath}:${item.lineNumber})`);
        });
      } else {
        phase.deprecatedItemsToRemove.slice(0, 3).forEach((item) => {
          console.log(`         - ${item.itemName} (${item.filePath}:${item.lineNumber})`);
        });
        console.log(
          `         ... and ${phase.deprecatedItemsToRemove.length - 3} more`
        );
      }
    }

    if (phase.warnings.length > 0) {
      console.log('      Warnings:');
      phase.warnings.forEach((warning) => {
        console.log(`         ⚠️  ${warning}`);
      });
    }

    console.log('');
  }

  /**
   * Format bundle size change
   * 
   * @param change - Bundle size change in bytes
   * @returns Formatted string
   */
  private formatBundleSizeChange(change: number): string {
    if (change === 0) {
      return 'No change';
    }

    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : '-';

    if (absChange < 1024) {
      return `${sign}${absChange} bytes`;
    } else if (absChange < 1024 * 1024) {
      return `${sign}${(absChange / 1024).toFixed(2)} KB`;
    } else {
      return `${sign}${(absChange / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Prompt for confirmation before executing
   * 
   * Asks user to confirm before making actual changes.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3**
   * 
   * @returns User confirmation (true = proceed, false = cancel)
   */
  async promptForConfirmation(): Promise<boolean> {
    console.log('\n⚠️  You are about to make actual changes to the codebase.');
    console.log('   This will:');
    console.log('   • Create a git tag and branch for backup');
    console.log('   • Remove files and directories');
    console.log('   • Move files to archive');
    console.log('   • Update documentation');
    console.log('   • Run CI checks after each phase');
    console.log('   • Automatically revert on CI failure\n');

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Do you want to proceed with the cleanup?',
        default: false,
      },
    ]);

    return answers.confirmed;
  }
}
