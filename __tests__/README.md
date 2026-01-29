# 测试目录结构

本目录包含情绪日记应用的所有测试文件，按照测试类型组织。

## 目录结构

```
__tests__/
├── unit/           # 单元测试
│   ├── services/   # 服务层测试
│   ├── stores/     # Store测试
│   ├── hooks/      # 自定义Hook测试
│   └── utils/      # 工具函数测试
├── property/       # 属性测试（Property-Based Testing）
└── integration/    # 集成测试
```

## 测试类型说明

### 单元测试 (Unit Tests)

单元测试用于验证单个函数、类或组件的行为。测试文件应该：
- 使用 `.test.ts` 或 `.test.tsx` 后缀
- 测试特定的业务逻辑示例
- 测试边缘情况和错误条件
- 保持测试简洁和专注

**示例：**
```typescript
// __tests__/unit/utils/cache.test.ts
describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string>(10);
    cache.set('key1', 'value1', 1000);
    expect(cache.get('key1')).toBe('value1');
  });
});
```

### 属性测试 (Property-Based Tests)

属性测试使用 fast-check 库验证通用的正确性属性。测试文件应该：
- 使用 `.property.test.ts` 后缀
- 验证在所有有效输入下都成立的属性
- 使用 fast-check 的生成器生成测试数据
- 至少运行 100 次迭代

**示例：**
```typescript
// __tests__/property/cache.property.test.ts
import fc from 'fast-check';

describe('Feature: emotion-diary-optimization, Property 3: AI请求缓存一致性', () => {
  it('对于任何AI请求，相同参数应该返回缓存结果', () => {
    fc.assert(
      fc.property(
        fc.record({
          method: fc.constantFrom('predictEmotion', 'generatePodcast'),
          params: fc.object(),
        }),
        async ({ method, params }) => {
          // 测试逻辑
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 集成测试 (Integration Tests)

集成测试验证多个模块协同工作的场景。测试文件应该：
- 使用 `.test.ts` 或 `.test.tsx` 后缀
- 测试完整的用户工作流
- 测试模块间的交互
- 可以使用真实的依赖或最小化的模拟

**示例：**
```typescript
// __tests__/integration/offlineWorkflow.test.ts
describe('离线工作流', () => {
  it('应该在离线时保存条目到队列，并在网络恢复后同步', async () => {
    // 测试完整的离线创建和同步流程
  });
});
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test -- __tests__/unit

# 运行属性测试
npm test -- __tests__/property

# 运行集成测试
npm test -- __tests__/integration

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监视模式（开发时使用）
npm test -- --watch
```

## 测试覆盖率目标

- **工具函数和Hooks**: 100%覆盖
- **服务层**: 90%以上覆盖
- **Store**: 85%以上覆盖
- **组件**: 70%以上覆盖
- **整体**: 80%以上覆盖

## 编写测试的最佳实践

1. **描述性的测试名称**: 使用清晰的描述说明测试的内容
2. **AAA模式**: Arrange（准备）、Act（执行）、Assert（断言）
3. **独立性**: 每个测试应该独立运行，不依赖其他测试
4. **最小化模拟**: 尽可能使用真实的实现，只在必要时使用模拟
5. **测试行为而非实现**: 关注公共API和行为，而不是内部实现细节
6. **属性测试优先**: 对于数据转换、缓存等通用逻辑，优先使用属性测试

## 属性测试注解格式

属性测试必须使用以下格式注解验证的需求：

```typescript
describe('Feature: emotion-diary-optimization, Property X: 属性名称', () => {
  it('属性描述', () => {
    // **验证需求: X.Y, X.Z**
    // 测试实现
  });
});
```

## 相关文档

- [Jest 文档](https://jestjs.io/)
- [fast-check 文档](https://fast-check.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
