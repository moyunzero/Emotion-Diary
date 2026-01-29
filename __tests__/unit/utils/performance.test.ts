/**
 * 性能监控工具测试
 */

import { performanceMonitor } from '../../../utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  describe('start and end', () => {
    it('should measure duration correctly', () => {
      performanceMonitor.start('test');
      
      // 模拟一些工作
      const start = Date.now();
      while (Date.now() - start < 10) {
        // 等待至少 10ms
      }
      
      const duration = performanceMonitor.end('test');
      
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should return 0 for non-existent timer', () => {
      const duration = performanceMonitor.end('non-existent');
      expect(duration).toBe(0);
    });

    it('should store metadata', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test', { userId: '123', action: 'load' });
      
      const metrics = performanceMonitor.getMetricsByName('test');
      expect(metrics[0].metadata).toEqual({ userId: '123', action: 'load' });
    });
  });

  describe('measure', () => {
    it('should measure async function', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };
      
      const result = await performanceMonitor.measure('async-test', asyncFn);
      
      expect(result).toBe('result');
      const metrics = performanceMonitor.getMetricsByName('async-test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should handle async function errors', async () => {
      const asyncFn = async () => {
        throw new Error('Test error');
      };
      
      await expect(
        performanceMonitor.measure('error-test', asyncFn)
      ).rejects.toThrow('Test error');
      
      const metrics = performanceMonitor.getMetricsByName('error-test');
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('measureSync', () => {
    it('should measure sync function', () => {
      const syncFn = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const result = performanceMonitor.measureSync('sync-test', syncFn);
      
      expect(result).toBe(499500);
      const metrics = performanceMonitor.getMetricsByName('sync-test');
      expect(metrics).toHaveLength(1);
    });

    it('should handle sync function errors', () => {
      const syncFn = () => {
        throw new Error('Sync error');
      };
      
      expect(() => {
        performanceMonitor.measureSync('sync-error-test', syncFn);
      }).toThrow('Sync error');
      
      const metrics = performanceMonitor.getMetricsByName('sync-error-test');
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      performanceMonitor.start('test1');
      performanceMonitor.end('test1');
      
      performanceMonitor.start('test2');
      performanceMonitor.end('test2');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should limit metrics to maxMetrics', () => {
      // 添加超过 maxMetrics (100) 的指标
      for (let i = 0; i < 150; i++) {
        performanceMonitor.start(`test${i}`);
        performanceMonitor.end(`test${i}`);
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getMetricsByName', () => {
    it('should filter metrics by name', () => {
      performanceMonitor.start('test1');
      performanceMonitor.end('test1');
      
      performanceMonitor.start('test2');
      performanceMonitor.end('test2');
      
      performanceMonitor.start('test1');
      performanceMonitor.end('test1');
      
      const metrics = performanceMonitor.getMetricsByName('test1');
      expect(metrics).toHaveLength(2);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      // 添加一些测试数据
      performanceMonitor.start('test');
      performanceMonitor.end('test'); // ~0ms
      
      performanceMonitor.start('test');
      const start = Date.now();
      while (Date.now() - start < 10) {} // ~10ms
      performanceMonitor.end('test');
      
      performanceMonitor.start('test');
      const start2 = Date.now();
      while (Date.now() - start2 < 20) {} // ~20ms
      performanceMonitor.end('test');
    });

    it('should calculate average duration', () => {
      const avg = performanceMonitor.getAverageDuration('test');
      expect(avg).toBeGreaterThan(0);
    });

    it('should get max duration', () => {
      const max = performanceMonitor.getMaxDuration('test');
      expect(max).toBeGreaterThanOrEqual(20);
    });

    it('should get min duration', () => {
      const min = performanceMonitor.getMinDuration('test');
      expect(min).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for non-existent metrics', () => {
      expect(performanceMonitor.getAverageDuration('non-existent')).toBe(0);
      expect(performanceMonitor.getMaxDuration('non-existent')).toBe(0);
      expect(performanceMonitor.getMinDuration('non-existent')).toBe(0);
    });
  });

  describe('getReport', () => {
    it('should generate performance report', () => {
      performanceMonitor.start('test1');
      performanceMonitor.end('test1');
      
      performanceMonitor.start('test2');
      performanceMonitor.end('test2');
      
      const report = performanceMonitor.getReport();
      
      expect(report).toHaveProperty('test1');
      expect(report).toHaveProperty('test2');
      expect(report.test1).toHaveProperty('count');
      expect(report.test1).toHaveProperty('average');
      expect(report.test1).toHaveProperty('min');
      expect(report.test1).toHaveProperty('max');
    });
  });

  describe('clear', () => {
    it('should clear all metrics and timers', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test');
      
      performanceMonitor.clear();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });
});
