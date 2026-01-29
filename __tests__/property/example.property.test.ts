/**
 * 示例属性测试文件
 * 用于验证 fast-check 配置正确
 */

import fc from 'fast-check';

describe('属性测试基础设施验证', () => {
  describe('fast-check 基本功能', () => {
    it('应该能够生成随机整数', () => {
      fc.assert(
        fc.property(fc.integer(), (n) => {
          expect(typeof n).toBe('number');
          expect(Number.isInteger(n)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('应该能够生成随机字符串', () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          expect(typeof s).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('应该验证数学属性：加法交换律', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          expect(a + b).toBe(b + a);
        }),
        { numRuns: 100 }
      );
    });

    it('应该验证数组属性：反转两次等于原数组', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const reversed = [...arr].reverse().reverse();
          expect(reversed).toEqual(arr);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('复杂数据生成', () => {
    it('应该能够生成对象', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string(),
            age: fc.integer({ min: 0, max: 120 }),
          }),
          (obj) => {
            expect(obj).toHaveProperty('id');
            expect(obj).toHaveProperty('name');
            expect(obj).toHaveProperty('age');
            expect(obj.age).toBeGreaterThanOrEqual(0);
            expect(obj.age).toBeLessThanOrEqual(120);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('应该能够生成日期', () => {
      fc.assert(
        fc.property(fc.date({ noInvalidDate: true }), (date) => {
          expect(date).toBeInstanceOf(Date);
          expect(date.getTime()).not.toBeNaN();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('异步属性测试', () => {
    it('应该支持异步属性', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const result = await Promise.resolve(s.toUpperCase());
          expect(result).toBe(s.toUpperCase());
        }),
        { numRuns: 100 }
      );
    });
  });
});
