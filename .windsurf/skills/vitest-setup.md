# Vitest 测试配置与最佳实践

## 概述

Vitest 是 Vue 3 项目的现代化单元测试框架，与 Vite 深度集成。本 skill 提供 Electron + Vue 3 应用中 vitest 的完整配置和使用指南。

## 基础配置

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**配置说明**：
- `globals: true` - 无需导入 describe、it、expect 等
- `environment: "jsdom"` - 使用 jsdom 模拟浏览器环境
- `alias` - 支持 @ 路径别名

### package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "0.34.6",
    "@vitest/ui": "0.34.6",
    "jsdom": "^29.0.0"
  }
}
```

## Node.js 版本要求

**重要**：vitest 必须使用与 Electron 相同的 Node.js 版本。

### 版本管理

1. **创建 .nvmrc**
   ```
   22.18.0
   ```

2. **配置 package.json**
   ```json
   {
     "engines": {
       "node": "22.18.0"
     }
   }
   ```

3. **运行测试前**
   ```bash
   nvm use      # 切换到正确版本
   pnpm install # 安装依赖
   npm run test # 运行测试
   ```

## 测试编写

### 基础测试

```typescript
// src/utils/__tests__/example.test.ts
import { describe, it, expect } from "vitest";
import { add } from "../example";

describe("add function", () => {
  it("should add two numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should handle negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
});
```

### Vue 组件测试

```typescript
// src/components/__tests__/HelloWorld.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HelloWorld from "../HelloWorld.vue";

describe("HelloWorld Component", () => {
  it("renders properly", () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: "Hello Vitest",
      },
    });
    expect(wrapper.text()).toContain("Hello Vitest");
  });
});
```

### 异步测试

```typescript
describe("async operations", () => {
  it("should handle promises", async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it("should handle async/await", async () => {
    const data = await asyncFunction();
    expect(data.id).toBe(1);
  });
});
```

## 常用断言

```typescript
// 基础断言
expect(value).toBe(expected);           // 严格相等
expect(value).toEqual(expected);        // 深度相等
expect(value).toStrictEqual(expected);  // 严格深度相等

// 布尔值
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// 数字
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// 字符串
expect(text).toContain("substring");
expect(text).toMatch(/regex/);

// 数组
expect(array).toContain(item);
expect(array).toHaveLength(3);

// 对象
expect(obj).toHaveProperty("key");
expect(obj).toHaveProperty("key", value);

// 异常
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow(Error);
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm run test

# 监听模式（文件变化时自动重新运行）
npm run test -- --watch

# 运行特定文件
npm run test -- src/utils/__tests__/example.test.ts

# 运行匹配模式的测试
npm run test -- --grep "add function"

# 生成覆盖率报告
npm run test:coverage

# 打开 UI 界面
npm run test:ui
```

### 调试测试

```bash
# 在 Node 调试器中运行
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# 或使用 VS Code 调试配置
# .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

## 常见问题

### Q: 运行测试时出现 Node.js 版本错误

**原因**：vitest 运行时使用的 Node.js 版本与 Electron 不一致

**解决**：
```bash
nvm use      # 切换到 .nvmrc 指定的版本
npm run test
```

### Q: 导入路径出现错误

**原因**：vitest 无法解析 @ 别名

**解决**：确保 vitest.config.ts 中配置了 alias：
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Q: Vue 组件测试失败

**原因**：缺少必要的依赖或配置

**解决**：
```bash
pnpm add -D @vue/test-utils
```

### Q: 异步测试超时

**原因**：测试执行时间过长

**解决**：
```typescript
it("should complete within timeout", async () => {
  // ...
}, 10000); // 10 秒超时
```

## 最佳实践

### 1. 测试组织

```
src/
├── utils/
│   ├── example.ts
│   └── __tests__/
│       └── example.test.ts
├── components/
│   ├── HelloWorld.vue
│   └── __tests__/
│       └── HelloWorld.test.ts
└── composables/
    ├── useExample.ts
    └── __tests__/
        └── useExample.test.ts
```

### 2. 测试命名

```typescript
// ✅ 好的命名
describe("UserService", () => {
  it("should create a new user with valid data", () => {});
  it("should throw error when email is invalid", () => {});
});

// ❌ 不好的命名
describe("test", () => {
  it("works", () => {});
  it("test 2", () => {});
});
```

### 3. 测试覆盖

```typescript
// 测试正常情况
it("should return correct result", () => {});

// 测试边界情况
it("should handle empty input", () => {});

// 测试错误情况
it("should throw error for invalid input", () => {});
```

### 4. 使用 Mock

```typescript
import { vi } from "vitest";

// Mock 函数
const mockFn = vi.fn();
mockFn("test");
expect(mockFn).toHaveBeenCalledWith("test");

// Mock 模块
vi.mock("./module", () => ({
  default: { value: "mocked" },
}));
```

## 与 CI/CD 集成

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version-file: '.nvmrc'
      - run: pnpm install
      - run: npm run test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 相关文件

| 文件 | 用途 |
|------|------|
| `vitest.config.ts` | vitest 配置 |
| `.nvmrc` | Node.js 版本 |
| `package.json` | 脚本和依赖 |
| `src/**/__tests__/*.test.ts` | 测试文件 |

## 总结

- ✅ 使用 vitest 进行单元测试
- ✅ 确保 Node.js 版本与 Electron 一致
- ✅ 遵循测试最佳实践
- ✅ 集成 CI/CD 自动化测试
- ✅ 定期检查测试覆盖率
