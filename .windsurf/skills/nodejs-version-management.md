# Node.js 版本管理与 Electron 原生模块编译

## 概述

在 Electron 应用中，系统 Node.js、Electron 内部 Node.js 和 vitest 运行时可能使用不同版本，导致原生模块（如 better-sqlite3）编译不兼容。本 skill 提供完整的版本管理和自动编译解决方案。

## 问题诊断

### 症状
```
Error: The module 'better-sqlite3.node' was compiled against a different Node.js version
NODE_MODULE_VERSION 127. This version of Node.js requires NODE_MODULE_VERSION 123.
```

### 根本原因
- 系统 Node.js 版本与 Electron 内部 Node.js 版本不同
- better-sqlite3 等原生模块需要针对特定 Node.js 版本编译
- vitest 运行时也需要使用相同版本

## 解决方案

### 1. 创建 .nvmrc 文件

在项目根目录创建 `.nvmrc`：

```
22.18.0
```

这告诉 nvm（Node Version Manager）使用特定的 Node.js 版本。

### 2. 配置 package.json

添加以下配置：

```json
{
  "engines": {
    "node": "22.18.0"
  },
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "devDependencies": {
    "electron-rebuild": "^3.2.9"
  }
}
```

**说明**：
- `engines` 字段：明确指定项目需要的 Node.js 版本
- `postinstall` 脚本：每次 `npm install` 后自动编译原生模块
- `electron-rebuild`：为 Electron 的 Node.js 版本编译原生模块

### 3. 开发环境设置

```bash
# 1. 安装 nvm（如果还没有）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 进入项目目录
cd token-keeper

# 3. 自动切换到正确的 Node.js 版本
nvm use

# 4. 安装依赖（自动编译原生模块）
pnpm install

# 5. 验证版本
node --version  # 应该输出 v22.18.0

# 6. 开发、测试、构建
npm run dev     # 开发服务器
npm run test    # vitest 单元测试
npm run build   # 生产构建
```

## 工作流程

### 新开发者加入

```bash
git clone <repo>
cd token-keeper
nvm use          # 自动切换到 v22.18.0
pnpm install     # 自动编译原生模块
npm run dev      # 开始开发
```

### 升级 Electron 版本

```bash
pnpm update electron
# postinstall 脚本自动运行
# electron-rebuild 为新版本重新编译原生模块
npm run test
npm run dev
```

### 修复编译问题

```bash
# 清除旧的编译文件
rm -rf node_modules/.pnpm/better-sqlite3*

# 重新安装和编译
pnpm install

# 或手动编译
npx electron-rebuild -f -w better-sqlite3
```

## CI/CD 配置

### GitHub Actions

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # 使用 .nvmrc 中指定的 Node.js 版本
      - uses: actions/setup-node@v3
        with:
          node-version-file: '.nvmrc'
      
      # 安装依赖（自动编译原生模块）
      - run: pnpm install
      
      # 运行测试
      - run: npm run test
      
      # 构建
      - run: npm run build
```

## 常见问题

### Q: 如何检查当前 Node.js 版本？
```bash
node --version
```

### Q: 如何切换到项目指定的版本？
```bash
nvm use
# 自动读取 .nvmrc 并切换
```

### Q: vitest 运行失败怎么办？
```bash
# 1. 确认版本
node --version

# 2. 切换到正确版本
nvm use

# 3. 重新安装依赖
pnpm install

# 4. 运行测试
npm run test
```

### Q: better-sqlite3 编译失败怎么办？
```bash
# 1. 删除旧的编译文件
rm -rf node_modules/.pnpm/better-sqlite3*

# 2. 重新安装
pnpm install

# 3. 手动重建
npx electron-rebuild -f -w better-sqlite3
```

## 关键文件

| 文件 | 用途 |
|------|------|
| `.nvmrc` | 指定 Node.js 版本 |
| `package.json` | 配置 engines 和 postinstall 脚本 |
| `NODE_VERSION_MANAGEMENT.md` | 详细文档 |
| `ELECTRON_NATIVE_MODULES.md` | 原生模块编译指南 |

## 最佳实践

1. **始终使用 nvm**
   - 所有开发者使用 nvm 管理 Node.js 版本
   - 进入项目目录自动运行 `nvm use`

2. **定期更新依赖**
   - 更新 Node.js 时同时更新 .nvmrc 和 package.json
   - 运行完整的测试套件验证兼容性

3. **自动化编译**
   - 依赖 postinstall 脚本自动编译原生模块
   - 不需要手动运行 electron-rebuild

4. **CI/CD 一致性**
   - 使用 .nvmrc 自动化版本管理
   - 确保 CI/CD 环境与本地开发环境一致

## 相关工具

- **nvm**：Node Version Manager，管理多个 Node.js 版本
- **electron-rebuild**：为 Electron 编译原生模块
- **pnpm**：包管理器，自动触发 postinstall 脚本

## 总结

| 方面 | 说明 |
|------|------|
| **版本固定** | 使用 .nvmrc 和 package.json engines |
| **自动切换** | nvm use 自动读取 .nvmrc |
| **自动编译** | postinstall 脚本自动运行 electron-rebuild |
| **一致环境** | 所有开发者和 CI/CD 使用同一版本 |
| **易于维护** | 升级版本时只需更新两个文件 |
