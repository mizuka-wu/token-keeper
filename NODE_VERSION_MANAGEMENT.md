# Node.js 版本管理指南

## 问题

在 Electron 应用中，存在多个运行环境使用不同的 Node.js 版本：

- **系统 Node.js**：开发者机器上的全局 Node.js
- **Electron 内部 Node.js**：Electron 应用运行时使用的 Node.js
- **vitest 运行时**：单元测试执行时的 Node.js

如果版本不一致，会导致原生模块（如 better-sqlite3）编译不兼容。

## 解决方案

### 1. 使用 .nvmrc 固定 Node.js 版本

在项目根目录创建 `.nvmrc` 文件：

```
22.18.0
```

这告诉 nvm（Node Version Manager）使用特定的 Node.js 版本。

### 2. 在 package.json 中声明版本要求

```json
{
  "engines": {
    "node": "22.18.0"
  }
}
```

这明确指定项目需要的 Node.js 版本。

### 3. 自动编译原生模块

在 `package.json` 中添加 postinstall 脚本：

```json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  }
}
```

## 工作流程

### 开发环境设置

```bash
# 1. 安装 nvm（如果还没有）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 进入项目目录
cd token-keeper

# 3. 自动切换到正确的 Node.js 版本
nvm use
# 输出: Now using node v22.18.0 (npm 10.x.x)

# 4. 安装依赖（自动编译原生模块）
pnpm install
# postinstall 脚本自动运行 electron-rebuild

# 5. 开发、测试、构建都使用同一个 Node.js 版本
npm run dev      # 开发服务器
npm run test     # vitest 单元测试
npm run build    # 生产构建
```

### 多个开发者场景

```bash
# 开发者 A
cd token-keeper
nvm use          # 自动切换到 v22.18.0
pnpm install     # 自动编译原生模块
npm run dev      # 开发

# 开发者 B（新加入）
git clone <repo>
cd token-keeper
nvm use          # 自动切换到 v22.18.0
pnpm install     # 自动编译原生模块
npm run dev      # 开发

# 两个开发者使用完全相同的环境！
```

### CI/CD 流程

```yaml
# GitHub Actions 示例
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

## 版本信息

| 组件 | 版本 | 说明 |
|------|------|------|
| **Node.js** | 22.18.0 | 系统和所有工具使用的版本 |
| **Electron** | v30.0.1 | 内部 Node.js 与系统版本一致 |
| **better-sqlite3** | v12.8.0 | 原生模块，自动编译 |
| **vitest** | 0.34.6 | 使用系统 Node.js 运行 |

## 关键文件

### .nvmrc
```
22.18.0
```
- 告诉 nvm 使用的 Node.js 版本
- `nvm use` 自动读取此文件

### package.json
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

## 常见问题

### Q: 如何检查当前 Node.js 版本？
```bash
node --version
# v22.18.0
```

### Q: 如何切换到项目指定的版本？
```bash
nvm use
# 自动读取 .nvmrc 并切换
```

### Q: 如何安装特定的 Node.js 版本？
```bash
nvm install 22.18.0
nvm use 22.18.0
```

### Q: vitest 运行时出现版本错误怎么办？
```bash
# 1. 确认当前 Node.js 版本
node --version

# 2. 切换到正确版本
nvm use

# 3. 重新安装依赖
pnpm install

# 4. 运行测试
npm run test
```

### Q: 升级 Electron 版本后怎么办？
```bash
# 1. 更新 package.json 中的 electron 版本
pnpm update electron

# 2. postinstall 脚本自动运行
# electron-rebuild 为新版本重新编译原生模块

# 3. 测试
npm run test
npm run dev
```

### Q: 在 CI/CD 中如何确保版本一致？
```yaml
# 使用 actions/setup-node 的 node-version-file 选项
- uses: actions/setup-node@v3
  with:
    node-version-file: '.nvmrc'
```

## 最佳实践

### 1. 团队协作
- 所有开发者使用 nvm
- 在项目 README 中说明版本要求
- 定期同步 .nvmrc 和 package.json 中的版本

### 2. 版本更新
- 更新 Node.js 时，同时更新 .nvmrc 和 package.json
- 运行完整的测试套件验证兼容性
- 更新 CI/CD 配置

### 3. 新开发者入职
```bash
# 项目 README 中的说明
1. 安装 nvm: https://github.com/nvm-sh/nvm
2. 进入项目: cd token-keeper
3. 切换版本: nvm use
4. 安装依赖: pnpm install
5. 开始开发: npm run dev
```

### 4. 持续集成
- 使用 .nvmrc 自动化版本管理
- 在 CI/CD 中验证版本一致性
- 定期测试 Node.js 升级

## 故障排除

### 问题：better-sqlite3 编译失败

**原因**：Node.js 版本不匹配

**解决**：
```bash
# 1. 检查版本
node --version

# 2. 切换到正确版本
nvm use

# 3. 重新编译
npm run postinstall

# 4. 或重新安装
pnpm install
```

### 问题：vitest 运行失败

**原因**：Node.js 版本不匹配

**解决**：
```bash
# 1. 确认版本
node --version

# 2. 必须是 22.18.0
nvm use 22.18.0

# 3. 运行测试
npm run test
```

### 问题：新开发者环境不一致

**原因**：没有使用 nvm

**解决**：
```bash
# 在项目 README 中强调
# 必须使用 nvm 管理 Node.js 版本
nvm use
```

## 相关工具

### nvm（Node Version Manager）
- **用途**：管理多个 Node.js 版本
- **安装**：https://github.com/nvm-sh/nvm
- **命令**：
  - `nvm install 22.18.0` - 安装版本
  - `nvm use` - 使用 .nvmrc 中的版本
  - `nvm list` - 列出已安装的版本

### pnpm
- **用途**：包管理器
- **优势**：快速、节省磁盘空间
- **自动触发**：postinstall 脚本

### electron-rebuild
- **用途**：为 Electron 编译原生模块
- **自动运行**：通过 postinstall 脚本

## 总结

| 方面 | 说明 |
|------|------|
| **版本固定** | 使用 .nvmrc 和 package.json engines |
| **自动切换** | nvm use 自动读取 .nvmrc |
| **自动编译** | postinstall 脚本自动运行 electron-rebuild |
| **一致环境** | 所有开发者和 CI/CD 使用同一版本 |
| **易于维护** | 升级版本时只需更新两个文件 |

## 下一步

1. 确认已有 `.nvmrc` 文件（包含 `22.18.0`）
2. 确认 `package.json` 中有 `engines` 字段
3. 确认 `postinstall` 脚本已配置
4. 运行 `nvm use` 切换到正确版本
5. 运行 `pnpm install` 安装依赖
6. 运行 `npm run test` 验证 vitest
7. 运行 `npm run dev` 验证开发环境
