/**
 * Unit tests for DependencyAnalyzer
 * 
 * Tests the dependency analysis functionality including:
 * - File usage detection
 * - Circular dependency detection
 * - Deprecated item verification
 * - Whitelist checking
 * - Manual review report generation
 */

import { DependencyAnalyzer } from '../DependencyAnalyzer';
import type { DeprecatedItem } from '../FileScanner';

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer(process.cwd(), []);
  });

  describe('constructor', () => {
    it('should initialize with project root and empty whitelist', () => {
      expect(analyzer).toBeDefined();
    });

    it('should accept custom whitelist', () => {
      const customAnalyzer = new DependencyAnalyzer(process.cwd(), ['test.ts', 'utils/*']);
      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('isWhitelisted', () => {
    it('should return false for non-whitelisted items', () => {
      const result = analyzer.isWhitelisted('some/random/file.ts');
      expect(result).toBe(false);
    });

    it('should return true for exact match', () => {
      const customAnalyzer = new DependencyAnalyzer(process.cwd(), ['test.ts']);
      const result = customAnalyzer.isWhitelisted('test.ts');
      expect(result).toBe(true);
    });

    it('should return true for substring match', () => {
      const customAnalyzer = new DependencyAnalyzer(process.cwd(), ['utils']);
      const result = customAnalyzer.isWhitelisted('src/utils/helper.ts');
      expect(result).toBe(true);
    });

    it('should support glob patterns with wildcards', () => {
      const customAnalyzer = new DependencyAnalyzer(process.cwd(), ['utils/*.ts']);
      const result = customAnalyzer.isWhitelisted('utils/helper.ts');
      expect(result).toBe(true);
    });

    it('should not match when pattern does not match', () => {
      const customAnalyzer = new DependencyAnalyzer(process.cwd(), ['utils/*.ts']);
      const result = customAnalyzer.isWhitelisted('components/Button.tsx');
      expect(result).toBe(false);
    });
  });

  describe('checkFileUsage', () => {
    it('should handle non-existent files gracefully', async () => {
      const result = await analyzer.checkFileUsage('non-existent-file.ts');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isUsed');
      expect(result).toHaveProperty('importedBy');
      expect(result).toHaveProperty('dynamicImports');
    });

    it('should return FileUsage structure', async () => {
      // Test with a real file from the project
      const result = await analyzer.checkFileUsage('scripts/cleanup/components/DependencyAnalyzer.ts');
      
      expect(result).toBeDefined();
      expect(typeof result.isUsed).toBe('boolean');
      expect(Array.isArray(result.importedBy)).toBe(true);
      expect(Array.isArray(result.dynamicImports)).toBe(true);
    });
  });

  describe('checkCircularDependencies', () => {
    it('should return an array of circular dependencies', async () => {
      const result = await analyzer.checkCircularDependencies();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no circular dependencies exist', async () => {
      const result = await analyzer.checkCircularDependencies();
      
      // The project should not have circular dependencies
      expect(result).toEqual([]);
    });
  });

  describe('verifyDeprecatedItemUnused', () => {
    it('should return usage status structure', async () => {
      const result = await analyzer.verifyDeprecatedItemUnused('nonExistentFunction');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isUnused');
      expect(result).toHaveProperty('staticImports');
      expect(result).toHaveProperty('dynamicImports');
      expect(result).toHaveProperty('commentReferences');
      expect(typeof result.isUnused).toBe('boolean');
      expect(Array.isArray(result.staticImports)).toBe(true);
      expect(Array.isArray(result.dynamicImports)).toBe(true);
      expect(Array.isArray(result.commentReferences)).toBe(true);
    });

    it('should mark truly unused items as unused', async () => {
      // Use a very unique string that won't appear in the codebase
      const result = await analyzer.verifyDeprecatedItemUnused('veryUniqueDeprecatedFunction12345XYZ');
      
      expect(result.isUnused).toBe(true);
      expect(result.staticImports).toEqual([]);
      expect(result.dynamicImports).toEqual([]);
    });
  });

  describe('checkUnusedDependencies', () => {
    it('should return an array of unused dependencies', async () => {
      const result = await analyzer.checkUnusedDependencies();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle depcheck failures gracefully', async () => {
      // Even if depcheck fails, should return empty array
      const result = await analyzer.checkUnusedDependencies();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateManualReviewReport', () => {
    it('should generate report for empty items list', async () => {
      const items: DeprecatedItem[] = [];
      const result = await analyzer.generateManualReviewReport(items);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('outputPath');
      expect(result.items).toEqual([]);
      expect(Array.isArray(result.risks)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should generate report with risk assessments', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'test/file.ts',
          itemName: 'oldFunction',
          lineNumber: 10,
          annotation: '@deprecated Use newFunction instead',
          isUsed: false,
          usageLocations: [],
        },
        {
          filePath: 'app/core.ts',
          itemName: 'criticalFunction',
          lineNumber: 20,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: ['app/page1.ts:5', 'app/page2.ts:10'],
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      
      expect(result.items).toEqual(items);
      expect(result.risks.length).toBe(2);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check risk levels
      const riskLevels = result.risks.map(r => r.level);
      expect(riskLevels).toContain('low'); // oldFunction is unused
      expect(riskLevels.some(level => level === 'medium' || level === 'high')).toBe(true); // criticalFunction is used
    });

    it('should categorize risks correctly', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/helper.ts',
          itemName: 'unusedHelper',
          lineNumber: 5,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
        },
        {
          filePath: 'app/main.ts',
          itemName: 'widelyUsedFunction',
          lineNumber: 15,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: Array(15).fill('file.ts:1'), // 15 usages = high risk
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      
      const lowRisk = result.risks.find(r => r.level === 'low');
      const highRisk = result.risks.find(r => r.level === 'high');
      
      expect(lowRisk).toBeDefined();
      expect(lowRisk?.category).toBe('Unused');
      
      expect(highRisk).toBeDefined();
      expect(highRisk?.category).toBe('Widely Used');
    });

    it('should provide recommendations based on risk levels', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'test.ts',
          itemName: 'highRiskItem',
          lineNumber: 1,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: Array(20).fill('file.ts:1'),
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('high-risk'))).toBe(true);
    });
  });

  describe('risk assessment logic', () => {
    it('should assess low risk for unused items', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/old.ts',
          itemName: 'unusedFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: false,
          usageLocations: [],
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      const risk = result.risks[0];
      
      expect(risk.level).toBe('low');
      expect(risk.category).toBe('Unused');
    });

    it('should assess high risk for widely used items', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/popular.ts',
          itemName: 'popularFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: Array(15).fill('file.ts:1'),
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      const risk = result.risks[0];
      
      expect(risk.level).toBe('high');
      expect(risk.category).toBe('Widely Used');
    });

    it('should assess high risk for core component items', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'app/core.ts',
          itemName: 'coreFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: ['app/page.ts:5'],
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      const risk = result.risks[0];
      
      expect(risk.level).toBe('high');
      expect(risk.category).toBe('Core Component');
    });

    it('should assess medium risk for limited usage items', async () => {
      const items: DeprecatedItem[] = [
        {
          filePath: 'utils/helper.ts',
          itemName: 'helperFunction',
          lineNumber: 10,
          annotation: '@deprecated',
          isUsed: true,
          usageLocations: ['file1.ts:5', 'file2.ts:10'],
        },
      ];

      const result = await analyzer.generateManualReviewReport(items);
      const risk = result.risks[0];
      
      expect(risk.level).toBe('medium');
      expect(risk.category).toBe('Limited Usage');
    });
  });
});
