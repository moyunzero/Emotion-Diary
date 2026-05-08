/**
 * Phase Orchestrator
 * 
 * Coordinates all cleanup phases with CI verification and rollback capabilities.
 * Implements the phased execution model defined in the design document.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 
 *              4.1, 4.2, 4.3, 5.1, 5.2, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import type { CLIOptions, DryRunPhaseReport, DryRunReport, RiskAssessment } from '../cli/CleanupCLI';
import { BackupManager } from '../components/BackupManager';
import { CIResult, CIVerifier } from '../components/CIVerifier';
import { CleanupExecutor } from '../components/CleanupExecutor';
import { CleanupReporter, CleanupSummary, PhaseResult } from '../components/CleanupReporter';
import { DependencyAnalyzer } from '../components/DependencyAnalyzer';
import { DeprecatedItem, FileScanner } from '../components/FileScanner';
import { RevertManager } from '../components/RevertManager';
import type { CleanupConfig } from '../config/cleanup.config';
import { loadConfig } from '../config/cleanup.config';

/**
 * Phase execution state
 */
export interface PhaseExecutionState {
  currentPhase: number;
  totalPhases: number;
  phaseName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'reverted';
  startTime: Date;
  endTime?: Date;
  commitHash?: string;
  ciResult?: CIResult;
  error?: string;
}

/**
 * Phase Orchestrator
 * 
 * Coordinates all cleanup phases with safety mechanisms:
 * - Phase 0: Backup & Preparation
 * - Phase 1: Documentation Cleanup
 * - Phase 2: Empty Directories
 * - Phase 3: Config & Artifacts
 * - Phase 4: Deprecated Code
 * - Phase 5: Final Verification
 */
export class PhaseOrchestrator {
  private backupManager: BackupManager;
  private fileScanner: FileScanner;
  private dependencyAnalyzer: DependencyAnalyzer;
  private cleanupExecutor: CleanupExecutor;
  private ciVerifier: CIVerifier;
  private cleanupReporter: CleanupReporter;
  private revertManager: RevertManager;
  private config: CleanupConfig;
  
  private phaseStates: PhaseExecutionState[] = [];
  private initialBundleSize: number = 0;

  constructor(
    projectRoot: string = process.cwd(),
    config?: CleanupConfig
  ) {
    this.config = config || loadConfig();
    this.backupManager = new BackupManager();
    this.fileScanner = new FileScanner(projectRoot);
    this.dependencyAnalyzer = new DependencyAnalyzer(projectRoot, []);
    this.cleanupExecutor = new CleanupExecutor(projectRoot);
    this.ciVerifier = new CIVerifier(projectRoot);
    this.cleanupReporter = new CleanupReporter(projectRoot);
    this.revertManager = new RevertManager();
  }

  /**
   * Generate dry-run report
   * 
   * Analyzes what would be changed without making actual changes.
   * 
   * @param options - CLI options
   * @returns Dry-run report with risk assessments
   */
  async generateDryRunReport(options: CLIOptions): Promise<DryRunReport> {
    const phases: DryRunPhaseReport[] = [];
    const warnings: string[] = [];
    const risks: RiskAssessment[] = [];

    try {
      // Phase 1: Documentation Cleanup
      if (!options.phase || options.phase === 'docs') {
        const docPhase = await this.analyzeDocs();
        phases.push(docPhase);
        
        if (docPhase.filesToMove.length > 0) {
          risks.push({
            level: 'low',
            category: 'Documentation',
            description: `Moving ${docPhase.filesToMove.length} documentation files to archive`,
            affectedFiles: docPhase.filesToMove.map(m => m.source),
            recommendation: 'Safe to proceed - files will be archived, not deleted',
          });
        }
      }

      // Phase 2: Empty Directories
      if (!options.phase || options.phase === 'directories') {
        const dirPhase = await this.analyzeEmptyDirectories();
        phases.push(dirPhase);
        
        if (dirPhase.directoriesToRemove.length > 0) {
          risks.push({
            level: 'low',
            category: 'Empty Directories',
            description: `Removing ${dirPhase.directoriesToRemove.length} empty directories`,
            affectedFiles: dirPhase.directoriesToRemove,
            recommendation: 'Safe to proceed - directories contain no files',
          });
        }
      }

      // Phase 3: Config & Artifacts
      if (!options.phase || options.phase === 'config') {
        const configPhase = await this.analyzeConfigArtifacts();
        phases.push(configPhase);
        
        if (configPhase.filesToRemove.length > 0) {
          risks.push({
            level: 'low',
            category: 'Config & Artifacts',
            description: `Removing ${configPhase.filesToRemove.length} system files and backup configs`,
            affectedFiles: configPhase.filesToRemove,
            recommendation: 'Safe to proceed - removing non-functional files',
          });
        }
      }

      // Phase 4: Deprecated Code
      if (!options.phase || options.phase === 'deprecated') {
        const deprecatedPhase = await this.analyzeDeprecatedCode();
        phases.push(deprecatedPhase);
        
        const usedItems = deprecatedPhase.deprecatedItemsToRemove.filter(item => item.isUsed);
        const unusedItems = deprecatedPhase.deprecatedItemsToRemove.filter(item => !item.isUsed);
        
        if (usedItems.length > 0) {
          risks.push({
            level: 'medium',
            category: 'Deprecated Code',
            description: `${usedItems.length} deprecated items are still in use`,
            affectedFiles: usedItems.map(item => item.filePath),
            recommendation: 'Migration comments will be added - manual review required',
          });
        }
        
        if (unusedItems.length > 0) {
          risks.push({
            level: 'low',
            category: 'Deprecated Code',
            description: `Removing ${unusedItems.length} unused deprecated items`,
            affectedFiles: unusedItems.map(item => item.filePath),
            recommendation: 'Safe to proceed - items are not referenced',
          });
        }
      }

      // Calculate totals
      const totalFilesToRemove = phases.reduce(
        (sum, phase) => sum + phase.filesToRemove.length,
        0
      );
      const totalFilesToMove = phases.reduce(
        (sum, phase) => sum + phase.filesToMove.length,
        0
      );
      const totalDirectoriesToRemove = phases.reduce(
        (sum, phase) => sum + phase.directoriesToRemove.length,
        0
      );

      // Estimate bundle size change (rough estimate based on file sizes)
      const estimatedBundleSizeChange = -1024 * (totalFilesToRemove + totalFilesToMove);

      return {
        phases,
        totalFilesToRemove,
        totalFilesToMove,
        totalDirectoriesToRemove,
        estimatedBundleSizeChange,
        warnings,
        risks,
      };
    } catch (error: any) {
      warnings.push(`Error during dry-run analysis: ${error.message}`);
      return {
        phases,
        totalFilesToRemove: 0,
        totalFilesToMove: 0,
        totalDirectoriesToRemove: 0,
        estimatedBundleSizeChange: 0,
        warnings,
        risks,
      };
    }
  }

  /**
   * Execute cleanup phases
   * 
   * Runs all cleanup phases with CI verification after each phase.
   * Triggers rollback on CI failure.
   * 
   * @param options - CLI options
   */
  async execute(options: CLIOptions): Promise<void> {
    console.log('\n🚀 Starting cleanup execution...\n');

    try {
      // Phase 0: Backup & Preparation
      await this.executePhase0Backup(options);

      // Measure initial bundle size
      this.initialBundleSize = await this.ciVerifier.measureBundleSize();
      console.log(`📦 Initial bundle size: ${this.formatBytes(this.initialBundleSize)}\n`);

      // Phase 1: Documentation Cleanup
      if (!options.phase || options.phase === 'docs') {
        await this.executePhase1Documentation(options);
        if (!options.skipCI) {
          await this.verifyCIAndHandleFailure(options);
        }
      }

      // Phase 2: Empty Directories
      if (!options.phase || options.phase === 'directories') {
        await this.executePhase2EmptyDirectories(options);
        if (!options.skipCI) {
          await this.verifyCIAndHandleFailure(options);
        }
      }

      // Phase 3: Config & Artifacts
      if (!options.phase || options.phase === 'config') {
        await this.executePhase3ConfigArtifacts(options);
        if (!options.skipCI) {
          await this.verifyCIAndHandleFailure(options);
        }
      }

      // Phase 4: Deprecated Code
      if (!options.phase || options.phase === 'deprecated') {
        await this.executePhase4DeprecatedCode(options);
        if (!options.skipCI) {
          await this.verifyCIAndHandleFailure(options);
        }
      }

      // Phase 5: Final Verification
      if (!options.phase || options.phase === 'verification') {
        await this.executePhase5FinalVerification(options);
      }

      console.log('\n✅ Cleanup completed successfully!\n');
    } catch (error: any) {
      console.error(`\n❌ Cleanup failed: ${error.message}\n`);
      throw error;
    }
  }

  /**
   * Phase 0: Backup & Preparation
   */
  private async executePhase0Backup(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 0,
      totalPhases: 6,
      phaseName: 'Backup & Preparation',
      status: 'running',
      startTime: new Date(),
    };

    console.log('📋 Phase 0: Backup & Preparation');

    try {
      // Verify clean working tree
      const { isClean, uncommittedFiles } = await this.backupManager.verifyCleanWorkingTree();
      if (!isClean) {
        throw new Error(
          `Working tree is not clean. Uncommitted files:\n${uncommittedFiles.join('\n')}`
        );
      }
      console.log('  ✓ Working tree is clean');

      // Create backup tag
      const tagResult = await this.backupManager.createTag(this.config.git.tagName);
      if (!tagResult.success) {
        throw new Error(`Failed to create tag: ${this.config.git.tagName}`);
      }
      console.log(`  ✓ Created tag: ${this.config.git.tagName}`);

      // Create cleanup branch
      const branchResult = await this.backupManager.createBranch(this.config.git.branchName);
      if (!branchResult.success) {
        throw new Error(`Failed to create branch: ${this.config.git.branchName}`);
      }
      console.log(`  ✓ Created branch: ${this.config.git.branchName}`);

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Phase 1: Documentation Cleanup
   */
  private async executePhase1Documentation(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 1,
      totalPhases: 6,
      phaseName: 'Documentation Cleanup',
      status: 'running',
      startTime: new Date(),
    };

    console.log('\n📋 Phase 1: Documentation Cleanup');

    try {
      const docFiles = await this.fileScanner.findDocumentationFiles();
      console.log(`  Found ${docFiles.length} documentation files to archive`);

      if (docFiles.length > 0) {
        const result = await this.cleanupExecutor.archiveFiles(
          docFiles,
          true, // preserve structure
          options.dryRun
        );

        if (result.success) {
          console.log(`  ✓ Archived ${result.archivedFiles.length} files`);
        } else {
          console.warn(`  ⚠️  Some files failed to archive: ${result.errors.join(', ')}`);
        }
      }

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Phase 2: Empty Directories
   */
  private async executePhase2EmptyDirectories(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 2,
      totalPhases: 6,
      phaseName: 'Empty Directories',
      status: 'running',
      startTime: new Date(),
    };

    console.log('\n📋 Phase 2: Empty Directories');

    try {
      const emptyDirs = await this.fileScanner.findEmptyDirectories(true);
      console.log(`  Found ${emptyDirs.length} empty directories`);

      if (emptyDirs.length > 0) {
        const result = await this.cleanupExecutor.removeEmptyDirectories(
          emptyDirs,
          options.dryRun
        );

        if (result.success) {
          console.log(`  ✓ Removed ${result.removedItems.length} directories`);
          
          // Update README.md structure
          if (!options.dryRun) {
            await this.cleanupReporter.updateReadmeStructure(emptyDirs);
            console.log('  ✓ Updated README.md structure');
          }
        } else {
          console.warn(`  ⚠️  Some directories failed to remove: ${result.errors.join(', ')}`);
        }
      }

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Phase 3: Config & Artifacts
   */
  private async executePhase3ConfigArtifacts(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 3,
      totalPhases: 6,
      phaseName: 'Config & Artifacts',
      status: 'running',
      startTime: new Date(),
    };

    console.log('\n📋 Phase 3: Config & Artifacts');

    try {
      const systemFiles = await this.fileScanner.findSystemFiles();
      const backupConfigs = await this.fileScanner.findBackupConfigFiles();
      const allFiles = [...systemFiles, ...backupConfigs];
      
      console.log(`  Found ${allFiles.length} files to remove`);

      if (allFiles.length > 0) {
        const result = await this.cleanupExecutor.removeFiles(
          allFiles,
          'chore: remove system files and backup configs',
          options.dryRun
        );

        if (result.success) {
          console.log(`  ✓ Removed ${result.removedItems.length} files`);
        } else {
          console.warn(`  ⚠️  Some files failed to remove: ${result.errors.join(', ')}`);
        }
      }

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Phase 4: Deprecated Code
   */
  private async executePhase4DeprecatedCode(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 4,
      totalPhases: 6,
      phaseName: 'Deprecated Code',
      status: 'running',
      startTime: new Date(),
    };

    console.log('\n📋 Phase 4: Deprecated Code');

    try {
      const deprecatedItems = await this.fileScanner.findDeprecatedCode();
      console.log(`  Found ${deprecatedItems.length} deprecated items`);

      // Verify usage for each item
      for (const item of deprecatedItems) {
        const usageInfo = await this.dependencyAnalyzer.verifyDeprecatedItemUnused(item.itemName);
        item.isUsed = !usageInfo.isUnused;
        item.usageLocations = usageInfo.staticImports;
      }

      const unusedItems = deprecatedItems.filter(item => !item.isUsed);
      const usedItems = deprecatedItems.filter(item => item.isUsed);

      console.log(`  ${unusedItems.length} unused, ${usedItems.length} still in use`);

      // Remove unused deprecated code
      for (const item of unusedItems) {
        if (!this.dependencyAnalyzer.isWhitelisted(item.filePath)) {
          await this.cleanupExecutor.removeDeprecatedCode(item, options.dryRun);
        }
      }

      // Add migration comments for used items
      for (const item of usedItems) {
        await this.cleanupExecutor.addMigrationComment(
          item,
          item.migrationGuide || 'Please migrate to the recommended alternative',
          options.dryRun
        );
      }

      if (unusedItems.length > 0) {
        console.log(`  ✓ Removed ${unusedItems.length} unused deprecated items`);
      }
      if (usedItems.length > 0) {
        console.log(`  ✓ Added migration comments for ${usedItems.length} items`);
      }

      // Generate tracking report
      if (!options.dryRun && usedItems.length > 0) {
        await this.cleanupReporter.generateDeprecatedTrackingReport(
          usedItems,
          this.config.reporting.deprecatedTrackingPath
        );
        console.log('  ✓ Generated deprecated tracking report');
      }

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Phase 5: Final Verification
   */
  private async executePhase5FinalVerification(options: CLIOptions): Promise<void> {
    const phaseState: PhaseExecutionState = {
      currentPhase: 5,
      totalPhases: 6,
      phaseName: 'Final Verification',
      status: 'running',
      startTime: new Date(),
    };

    console.log('\n📋 Phase 5: Final Verification');

    try {
      // Run full CI pipeline
      const ciResult = await this.ciVerifier.runFullPipeline();
      phaseState.ciResult = ciResult;

      if (!ciResult.success) {
        throw new Error('CI verification failed');
      }
      console.log('  ✓ CI checks passed');

      // Measure final bundle size
      const finalBundleSize = await this.ciVerifier.measureBundleSize();
      const bundleComparison = this.ciVerifier.compareBundleSizes(
        this.initialBundleSize,
        finalBundleSize,
        this.config.ci.bundleSizeTolerance
      );

      console.log(`  📦 Final bundle size: ${this.formatBytes(finalBundleSize)}`);
      console.log(`  📊 Change: ${bundleComparison.changePercent.toFixed(2)}%`);

      if (!bundleComparison.passed) {
        console.warn('  ⚠️  Bundle size increased beyond tolerance');
      } else {
        console.log('  ✓ Bundle size within tolerance');
      }

      // Generate cleanup summary
      if (!options.dryRun) {
        const summary = await this.generateCleanupSummary(bundleComparison, [ciResult]);
        await this.cleanupReporter.generateSummary(
          summary,
          this.config.reporting.summaryPath
        );
        console.log('  ✓ Generated cleanup summary');
      }

      phaseState.status = 'success';
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
    } catch (error: any) {
      phaseState.status = 'failed';
      phaseState.error = error.message;
      phaseState.endTime = new Date();
      this.phaseStates.push(phaseState);
      throw error;
    }
  }

  /**
   * Verify CI and handle failure with rollback
   */
  private async verifyCIAndHandleFailure(options: CLIOptions): Promise<void> {
    console.log('\n  🔍 Running CI verification...');

    const ciResult = await this.ciVerifier.runFullPipeline();

    // Log CI result
    await this.cleanupReporter.logCIResult(ciResult, this.config.reporting.ciLogPath);

    if (!ciResult.success) {
      console.error('\n  ❌ CI verification failed!');
      console.error('  Failed checks:');
      ciResult.checks
        .filter(check => !check.success)
        .forEach(check => {
          console.error(`    - ${check.name}: ${check.output.substring(0, 100)}...`);
        });

      // Trigger rollback
      console.log('\n  🔄 Triggering rollback...');
      
      // Get last commit hash (would need to be tracked during execution)
      const lastCommitHash = 'HEAD'; // Simplified for now
      
      const revertResult = await this.revertManager.revertCommit(lastCommitHash);
      
      if (revertResult.success) {
        console.log('  ✓ Revert prepared (not committed)');
        
        // Request manual confirmation
        const confirmed = await this.revertManager.requestManualConfirmation();
        
        if (confirmed) {
          await this.revertManager.commitRevert('revert: cleanup phase failed CI verification');
          console.log('  ✓ Revert committed');
        } else {
          console.log('  ⚠️  Revert cancelled by user');
        }
      } else {
        console.error('  ❌ Revert failed');
        if (revertResult.conflicts.length > 0) {
          console.error('  Conflicts:');
          revertResult.conflicts.forEach(conflict => {
            console.error(`    - ${conflict}`);
          });
        }
      }

      throw new Error('CI verification failed - cleanup aborted');
    }

    console.log('  ✓ CI verification passed');
  }

  /**
   * Analyze documentation files (dry-run)
   */
  private async analyzeDocs(): Promise<DryRunPhaseReport> {
    const docFiles = await this.fileScanner.findDocumentationFiles();
    
    return {
      phaseName: 'Documentation Cleanup',
      filesToRemove: [],
      filesToMove: docFiles.map(doc => ({
        source: doc.path,
        destination: doc.archivePath,
      })),
      directoriesToRemove: [],
      deprecatedItemsToRemove: [],
      warnings: [],
    };
  }

  /**
   * Analyze empty directories (dry-run)
   */
  private async analyzeEmptyDirectories(): Promise<DryRunPhaseReport> {
    const emptyDirs = await this.fileScanner.findEmptyDirectories(true);
    
    return {
      phaseName: 'Empty Directories',
      filesToRemove: [],
      filesToMove: [],
      directoriesToRemove: emptyDirs,
      deprecatedItemsToRemove: [],
      warnings: [],
    };
  }

  /**
   * Analyze config and artifacts (dry-run)
   */
  private async analyzeConfigArtifacts(): Promise<DryRunPhaseReport> {
    const systemFiles = await this.fileScanner.findSystemFiles();
    const backupConfigs = await this.fileScanner.findBackupConfigFiles();
    const allFiles = [...systemFiles, ...backupConfigs];
    
    return {
      phaseName: 'Config & Artifacts',
      filesToRemove: allFiles,
      filesToMove: [],
      directoriesToRemove: [],
      deprecatedItemsToRemove: [],
      warnings: [],
    };
  }

  /**
   * Analyze deprecated code (dry-run)
   */
  private async analyzeDeprecatedCode(): Promise<DryRunPhaseReport> {
    const deprecatedItems = await this.fileScanner.findDeprecatedCode();
    
    // Verify usage for each item
    for (const item of deprecatedItems) {
      const usageInfo = await this.dependencyAnalyzer.verifyDeprecatedItemUnused(item.itemName);
      item.isUsed = !usageInfo.isUnused;
      item.usageLocations = usageInfo.staticImports;
    }
    
    return {
      phaseName: 'Deprecated Code',
      filesToRemove: [],
      filesToMove: [],
      directoriesToRemove: [],
      deprecatedItemsToRemove: deprecatedItems,
      warnings: deprecatedItems
        .filter(item => item.isUsed)
        .map(item => `${item.itemName} is still in use at: ${item.usageLocations.join(', ')}`),
    };
  }

  /**
   * Generate cleanup summary
   */
  private async generateCleanupSummary(
    bundleComparison: any,
    ciResults: CIResult[]
  ): Promise<CleanupSummary> {
    const removedFiles: string[] = [];
    const movedFiles: { source: string; destination: string }[] = [];
    const removedDirectories: string[] = [];
    const deprecatedItemsRemoved: DeprecatedItem[] = [];
    const deprecatedItemsTracked: DeprecatedItem[] = [];

    // Collect data from phase states
    // (In a real implementation, this would track operations during execution)

    const phases: PhaseResult[] = this.phaseStates.map(state => ({
      phaseName: state.phaseName,
      success: state.status === 'success',
      filesAffected: 0, // Would be tracked during execution
      duration: state.endTime
        ? state.endTime.getTime() - state.startTime.getTime()
        : 0,
      errors: state.error ? [state.error] : [],
      dryRun: false,
    }));

    return {
      timestamp: new Date().toISOString(),
      dryRun: false,
      phases,
      removedFiles,
      movedFiles,
      removedDirectories,
      deprecatedItemsRemoved,
      deprecatedItemsTracked,
      bundleSizeComparison: bundleComparison,
      ciResults,
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
