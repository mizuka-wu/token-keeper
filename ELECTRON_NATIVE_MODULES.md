# Electron 原生模块编译指南

## 问题诊断

### 症状
```
Error: The module 'better-sqlite3.node' was compiled against a different Node.js version
NODE_MODULE_VERSION 127. This version of Node.js requires NODE_MODULE_VERSION 123.
```

### 根本原因
- **系统 Node.js** 和 **Electron 内部 Node.js** 版本不同
- better-sqlite3 是原生模块（native module），需要针对特定 Node.js 版本编译
- 之前使用系统 Node.js 编译，但 Electron 运行时使用的是内部 Node.js
- 导致二进制文件版本不匹配

### 版本信息
- **系统 Node.js**: v22.18.0
- **Electron 内部 Node.js**: v20.x（Electron v30 使用）
- **better-sqlite3**: v12.8.0（原生模块）

---

## 解决方案

### 1. 使用 electron-rebuild

`electron-rebuild` 是专门为 Electron 应用编译原生模块的工具。它会：
- 检测 Electron 版本
- 获取对应的 Node.js 版本信息
- 使用正确的 Node.js 版本编译原生模块
- 生成与 Electron 兼容的二进制文件

### 2. 配置 postinstall 脚本

在 `package.json` 中添加 postinstall 脚本，确保每次 `npm install` 或 `pnpm install` 后自动编译原生模块：

```json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "devDependencies": {
    "electron-rebuild": "^3.2.9"
  }
}
```

**参数说明**:
- `-f` / `--force`: 强制重建，即使已经存在
- `-w` / `--which`: 指定要重建的模块名称

### 3. 手动编译

如果需要手动编译：

```bash
npx electron-rebuild -f -w better-sqlite3
```

---

## 工作流程

### 开发环境

```
npm install / pnpm install
  ↓
postinstall 脚本自动运行
  ↓
electron-rebuild 编译 better-sqlite3
  ↓
生成与 Electron 兼容的二进制文件
  ↓
npm run dev
  ↓
应用正常运行
```

### 生产构建

```
npm run build
  ↓
electron-builder 打包应用
  ↓
自动包含已编译的原生模块
  ↓
生成可执行文件
```

---

## 关键配置

### package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build && electron-builder",
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "dependencies": {
    "better-sqlite3": "^12.8.0"
  },
  "devDependencies": {
    "electron": "^30.0.1",
    "electron-rebuild": "^3.2.9"
  }
}
```

### 为什么需要 postinstall？

1. **自动化**：新开发者 clone 项目后，`npm install` 会自动编译原生模块
2. **一致性**：确保所有开发环境使用相同的编译版本
3. **CI/CD**：在自动化构建中自动处理原生模块编译
4. **更新 Electron 版本**：升级 Electron 时自动重新编译

---

## 常见场景

### 场景 1：新开发者加入

```bash
git clone <repo>
cd token-keeper
pnpm install  # postinstall 自动运行，编译 better-sqlite3
npm run dev   # 应用正常启动
```

### 场景 2：升级 Electron 版本

```bash
pnpm update electron
# postinstall 自动运行，为新 Electron 版本重新编译
npm run dev
```

### 场景 3：修复编译问题

```bash
# 清除旧的编译文件
rm -rf node_modules/.pnpm/better-sqlite3*

# 重新安装和编译
pnpm install

# 或手动编译
npx electron-rebuild -f -w better-sqlite3
```

### 场景 4：CI/CD 构建

```yaml
# GitHub Actions 示例
- name: Install dependencies
  run: pnpm install
  # postinstall 自动运行

- name: Build
  run: npm run build
```

---

## 故障排除

### 问题：仍然出现版本不匹配错误

**解决方案**：
```bash
# 1. 删除旧的编译文件
rm -rf node_modules/.pnpm/better-sqlite3*

# 2. 重新安装
pnpm install

# 3. 手动重建
npx electron-rebuild -f -w better-sqlite3

# 4. 清除缓存
rm -rf ~/.electron-gyp
```

### 问题：postinstall 脚本失败

**解决方案**：
```bash
# 检查 electron-rebuild 是否安装
npm list electron-rebuild

# 如果未安装，手动安装
pnpm add -D electron-rebuild

# 手动运行 postinstall 脚本
npm run postinstall
```

### 问题：编译缓慢

**说明**：
- 首次编译可能需要 1-2 分钟
- 后续编译会使用缓存，速度更快
- 可以使用 `-j` 参数并行编译

```bash
npx electron-rebuild -f -w better-sqlite3 -j 4
```

---

## 最佳实践

### 1. 版本管理

在 `.nvmrc` 中记录 Node.js 版本：
```
22.18.0
```

在 `package.json` 中指定 Electron 版本：
```json
{
  "devDependencies": {
    "electron": "^30.0.1"
  }
}
```

### 2. 文档化

在项目 README 中说明：
```markdown
## 开发环境设置

1. 使用 Node.js v22.18.0（见 `.nvmrc`）
2. 运行 `pnpm install` - 自动编译原生模块
3. 运行 `npm run dev` 启动开发服务器
```

### 3. 自动化

- 使用 postinstall 脚本自动编译
- 在 CI/CD 中包含编译步骤
- 定期测试构建流程

### 4. 监控

- 检查 electron-rebuild 的输出
- 在 CI/CD 日志中查看编译状态
- 及时更新依赖版本

---

## 相关工具

### electron-rebuild
- **用途**：为 Electron 编译原生模块
- **文档**：https://github.com/electron/rebuild
- **替代方案**：@electron/rebuild（新版本推荐）

### electron-builder
- **用途**：打包 Electron 应用
- **自动处理**：原生模块编译和打包
- **文档**：https://www.electron.build/

---

## 总结

| 方面 | 说明 |
|------|------|
| **问题** | Electron 内部 Node.js 与系统 Node.js 版本不同 |
| **原因** | better-sqlite3 是原生模块，需要特定版本编译 |
| **解决** | 使用 electron-rebuild 为 Electron 编译 |
| **自动化** | 在 package.json 中添加 postinstall 脚本 |
| **验证** | `npm run dev` 应用正常启动 |

---

## 文件修改

- `package.json` - 添加 postinstall 脚本和 electron-rebuild 依赖

---

## 下一步

应用现在已完全配置好，可以：
1. 正常开发（`npm run dev`）
2. 构建生产版本（`npm run build`）
3. 新开发者无需手动处理原生模块编译
4. CI/CD 自动处理所有编译步骤
