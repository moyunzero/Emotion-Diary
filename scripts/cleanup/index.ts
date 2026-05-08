#!/usr/bin/env ts-node

/**
 * Post-Launch Cleanup Tool
 * 
 * Main entry point for the cleanup tool. This tool helps remove redundant code,
 * unused files, and improve project maintainability after the App Store launch.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 6.1, 6.2**
 * 
 * Usage:
 *   yarn cleanup:run                    # Dry-run mode (default)
 *   yarn cleanup:run --force            # Execute actual cleanup
 *   yarn cleanup:run --phase docs       # Run specific phase only
 *   yarn cleanup:run --verbose          # Enable verbose output
 *   yarn cleanup:run --skip-ci          # Skip CI checks (dangerous!)
 * 
 * Examples:
 *   # Analyze what would be cleaned (safe, no changes)
 *   yarn cleanup:run
 * 
 *   # Execute cleanup after reviewing dry-run report
 *   yarn cleanup:run --force
 * 
 *   # Run only documentation cleanup phase
 *   yarn cleanup:run --force --phase docs
 */

import { CleanupCLI } from './cli/CleanupCLI';
import { loadConfig } from './config/cleanup.config';
import { PhaseOrchestrator } from './orchestrator/PhaseOrchestrator';

/**
 * Main entry point
 * 
 * Coordinates the cleanup process:
 * 1. Parse CLI arguments
 * 2. Load configuration
 * 3. Initialize components
 * 4. Execute cleanup via orchestrator
 */
async function main(): Promise<void> {
  try {
    // Initialize CLI
    const cli = new CleanupCLI();
    
    // Parse command-line arguments
    const options = cli.parseArguments(process.argv);
    
    // Load configuration
    const config = loadConfig();
    
    // Initialize orchestrator
    const orchestrator = new PhaseOrchestrator(process.cwd(), config);
    
    // Run cleanup
    await cli.run(options, orchestrator);
    
    // Exit successfully
    process.exit(0);
  } catch (error: any) {
    // Handle top-level errors
    console.error('\n❌ Cleanup tool failed:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Ensure your working tree is clean (git status)');
    console.error('  2. Check that all dependencies are installed (yarn install)');
    console.error('  3. Verify CI checks pass before cleanup (yarn typecheck && yarn lint && yarn test:ci)');
    console.error('  4. Review the dry-run report before using --force');
    console.error('  5. Check docs/cleanup-ci-log.txt for detailed CI results');
    console.error('\n📚 For more help, see: docs/cleanup-tool-usage.md\n');
    
    // Exit with error code
    process.exit(1);
  }
}

// Run main function
main();
