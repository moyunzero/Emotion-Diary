/**
 * 示例测试文件
 * 用于验证测试基础设施配置正确
 */

describe('测试基础设施验证', () => {
  describe('Jest配置', () => {
    it('应该能够运行基本的测试', () => {
      expect(true).toBe(true);
    });

    it('应该支持TypeScript', () => {
      const greeting: string = 'Hello, Jest!';
      expect(greeting).toBe('Hello, Jest!');
    });

    it('应该支持异步测试', async () => {
      const promise = Promise.resolve('async result');
      await expect(promise).resolves.toBe('async result');
    });
  });

  describe('基本数据结构', () => {
    it('应该能够测试对象', () => {
      const obj = { name: 'test', value: 42 };
      expect(obj).toEqual({ name: 'test', value: 42 });
    });

    it('应该能够测试数组', () => {
      const arr = [1, 2, 3];
      expect(arr).toHaveLength(3);
      expect(arr).toContain(2);
    });
  });
});
