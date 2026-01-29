/**
 * 性能监控工具
 * 提供性能指标收集和分析功能
 */

import React from 'react';

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 性能监控类
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 100;
  private timers: Map<string, number> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始计时
   */
  start(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * 结束计时并记录指标
   */
  end(name: string, metadata?: Record<string, unknown>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Performance timer "${name}" not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return duration;
  }

  /**
   * 测量异步函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.start(name);
    try {
      const result = fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取指定名称的指标
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * 获取平均执行时间
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * 获取最大执行时间
   */
  getMaxDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    return Math.max(...metrics.map((m) => m.duration));
  }

  /**
   * 获取最小执行时间
   */
  getMinDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    return Math.min(...metrics.map((m) => m.duration));
  }

  /**
   * 获取性能报告
   */
  getReport(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
  }> {
    const report: Record<string, {
      count: number;
      average: number;
      min: number;
      max: number;
    }> = {};

    const names = new Set(this.metrics.map((m) => m.name));

    names.forEach((name) => {
      const metrics = this.getMetricsByName(name);
      report[name] = {
        count: metrics.length,
        average: this.getAverageDuration(name),
        min: this.getMinDuration(name),
        max: this.getMaxDuration(name),
      };
    });

    return report;
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    const report = this.getReport();
    console.log('=== Performance Report ===');
    Object.entries(report).forEach(([name, stats]) => {
      console.log(`\n${name}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Average: ${stats.average.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
    });
    console.log('\n========================');
  }
}

/**
 * 导出单例实例
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * 性能装饰器（用于类方法）
 */
export function measurePerformance(_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: { constructor: { name: string } }, ...args: unknown[]) {
    const name = `${this.constructor.name}.${propertyKey}`;
    return performanceMonitor.measure(name, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

/**
 * React Hook: 测量组件渲染性能
 * 注意：Hook 必须无条件调用，内部逻辑可以条件执行
 */
export const usePerformanceMonitor = (componentName: string): void => {
  const startTimeRef = React.useRef<number>(Date.now());
  
  React.useEffect(() => {
    if (__DEV__) {
      const duration = Date.now() - startTimeRef.current;
      performanceMonitor.end(componentName, { duration });
    }
  });

  if (__DEV__) {
    performanceMonitor.start(componentName);
  }
};
