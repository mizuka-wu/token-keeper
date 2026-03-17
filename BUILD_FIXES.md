# 构建问题修复总结

## 问题 1：模块路径别名未配置

### 症状
```
Error: The following dependencies are imported but could not be resolved:
  @/composables/useEncryption (imported by /Users/mizuka/Projects/token-keeper/src/pages/KeychainAuthGuide.vue?id=0)
```

### 原因
项目中使用了 `@/` 路径别名来导入模块，但 Vite 和 TypeScript 的配置中没有定义这个别名。

### 解决方案

#### 1. 更新 `vite.config.ts`
添加 `resolve.alias` 配置：

```typescript
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    // ... 其他配置
  ],
});
```

#### 2. 更新 `tsconfig.json`
添加 `baseUrl` 和 `paths` 配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 结果
✅ 模块路径别名现在可以正确解析

---

## 问题 2：better-sqlite3 版本不匹配

### 症状
```
Error: The module '/Users/mizuka/Projects/token-keeper/node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 123.
```

### 原因
`better-sqlite3` 是一个原生 Node.js 模块，需要针对特定的 Node.js 版本编译。当 Node.js 版本更新时，需要重新编译这个模块。

### 解决方案

运行以下命令重新编译 better-sqlite3：

```bash
npm rebuild better-sqlite3
```

这个命令会：
1. 检测当前的 Node.js 版本
2. 下载对应版本的编译工具
3. 重新编译 better-sqlite3 模块
4. 生成与当前 Node.js 版本兼容的二进制文件

### 结果
✅ better-sqlite3 现在与当前 Node.js 版本兼容

---

## 开发服务器状态

### 启动成功 ✅

```
vite v5.4.21 building for development...

  VITE v5.4.21  ready in 207 ms

  ➜  Local:   http://localhost:5181/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

✓ 392 modules transformed.
dist-electron/main.js  421.30 kB │ gzip: 89.35 kB
built in 464ms.
```

### 应用现在可以运行

1. **Keychain 授权引导页面** - 首次启动时显示
2. **Dashboard 管理页面** - 授权成功后显示
3. **Group/Token 管理功能** - 完整的 CRUD 操作

---

## 预防措施

### 1. 处理路径别名
- 始终在 `vite.config.ts` 和 `tsconfig.json` 中保持同步
- 使用 `@/` 前缀导入 `src` 目录下的文件

### 2. 处理原生模块
- 当 Node.js 版本更新时，运行 `npm rebuild`
- 在 CI/CD 环境中，确保在 `npm install` 后运行 `npm rebuild`
- 可以在 `package.json` 中添加 postinstall 脚本：

```json
{
  "scripts": {
    "postinstall": "npm rebuild"
  }
}
```

### 3. 版本管理
- 在 `.nvmrc` 中固定 Node.js 版本
- 在 `package.json` 中指定 `engines` 字段

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 相关文件修改

- `vite.config.ts` - 添加路径别名配置
- `tsconfig.json` - 添加 TypeScript 路径别名配置
- `better-sqlite3` - 重新编译原生模块

---

## 下一步

应用现在可以正常运行。你可以：

1. 打开浏览器访问 `http://localhost:5181/`
2. 完成 keychain 授权流程
3. 使用 Dashboard 管理 Groups 和 Tokens
4. 所有 token 值都会自动加密存储

---

## 常见问题

### Q: 如何在新环境中快速设置？
A: 运行以下命令：
```bash
npm install
npm rebuild
npm run dev
```

### Q: 如何修复 better-sqlite3 错误？
A: 运行 `npm rebuild better-sqlite3`

### Q: 路径别名在哪里定义？
A: 在 `vite.config.ts` 和 `tsconfig.json` 中定义，确保两处配置一致

### Q: 为什么需要两个配置文件？
A: 
- `vite.config.ts` - 用于 Vite 构建工具
- `tsconfig.json` - 用于 TypeScript 类型检查和 IDE 支持
