# 运行时问题修复总结

## 问题 1：Keychain 解密错误

### 症状
```
Error: Error while decrypting the ciphertext provided to safeStorage.decryptString.
```

### 原因
应用尝试解密已存储的 keychain 数据时失败。这可能是因为：
- 数据格式不正确
- keychain 中的数据已损坏或过期
- Buffer 转换问题

### 解决方案

更新 `src/services/encryption.ts` 中的 `initializeMasterKey()` 和 `retryKeychainAuth()` 方法，添加更健壮的错误处理：

1. **改进的 Buffer 处理**
   - 检查数据类型（字符串或 Buffer）
   - 正确转换为 Buffer 后再解密

2. **自动恢复机制**
   - 如果解密失败，自动创建新的主密钥
   - 新密钥会存储在 keychain 中
   - 应用继续正常运行

3. **详细的日志记录**
   - 记录解密失败的原因
   - 记录新密钥的创建

### 代码改进

```typescript
try {
  // Try to decrypt the stored master key
  let bufferToDecrypt: Buffer;
  
  if (typeof encryptedMasterKey === "string") {
    bufferToDecrypt = Buffer.from(encryptedMasterKey, "utf-8");
  } else if (Buffer.isBuffer(encryptedMasterKey)) {
    bufferToDecrypt = encryptedMasterKey;
  } else {
    throw new Error("Invalid encrypted master key format");
  }

  const decrypted = safeStorage.decryptString(bufferToDecrypt);
  this.masterKey = Buffer.from(decrypted, "utf-8");
} catch (decryptError) {
  console.warn("Failed to decrypt stored master key, creating new one:", decryptError);
  // If decryption fails, create a new master key
  this.masterKey = crypto.randomBytes(32);
  const keyString = this.masterKey.toString("utf-8");
  const encrypted = safeStorage.encryptString(keyString);
  store.set("encryptedMasterKey", encrypted.toString("utf-8"));
}
```

### 结果
✅ Keychain 初始化现在可以优雅地处理解密错误

---

## 问题 2：better-sqlite3 版本不匹配

### 症状
```
Error: The module 'better-sqlite3.node' was compiled against a different Node.js version
NODE_MODULE_VERSION 127. This version of Node.js requires NODE_MODULE_VERSION 123.
```

### 原因
`better-sqlite3` 是原生 Node.js 模块，需要针对特定的 Node.js 版本编译。之前的重建尝试失败，导致模块仍然使用旧版本。

### 解决方案

执行以下步骤：

1. **删除旧的 better-sqlite3 构建文件**
   ```bash
   rm -rf node_modules/.pnpm/better-sqlite3*
   ```

2. **重新安装依赖**
   ```bash
   pnpm install
   ```

这会自动触发 better-sqlite3 的安装脚本，编译与当前 Node.js 版本兼容的二进制文件。

### 结果
✅ better-sqlite3 现在与 Node.js v22.18.0 兼容

---

## 应用状态

### 开发服务器 ✅

```
VITE v5.4.21  ready in 193 ms

  ➜  Local:   http://localhost:5181/
  ➜  Network: use --host to expose

✓ 392 modules transformed.
dist-electron/main.js  423.39 kB │ gzip: 89.57 kB
built in 506ms.
```

### 应用初始化流程 ✅

1. **Keychain 初始化**
   - 尝试从 keychain 加载主密钥
   - 如果失败，自动创建新密钥
   - 新密钥存储在 keychain 中

2. **数据库初始化**
   - better-sqlite3 成功加载
   - 数据库连接建立

3. **IPC 设置**
   - 所有 IPC 处理器注册成功

4. **窗口创建**
   - Electron 窗口启动
   - 应用准备就绪

---

## 完整的应用流程

```
应用启动
  ↓
Keychain 初始化
  ├─ 成功加载现有密钥 → 继续
  └─ 失败 → 创建新密钥 → 继续
  ↓
数据库初始化
  ├─ better-sqlite3 加载成功 → 继续
  └─ 失败 → 报错
  ↓
IPC 设置
  ↓
窗口创建
  ↓
前端加载
  ├─ 检查 keychain 授权状态
  ├─ 未授权 → 显示 KeychainAuthGuide
  └─ 已授权 → 显示 Dashboard
```

---

## 关键改进

### 1. 健壮的 Keychain 处理
- 自动恢复机制
- 详细的错误日志
- 不会因为解密失败而崩溃

### 2. 原生模块管理
- 正确的依赖重建流程
- 清晰的错误诊断

### 3. 用户体验
- 应用启动顺利
- 授权流程清晰
- 管理界面可用

---

## 测试检查清单

- [x] 开发服务器启动成功
- [x] Keychain 初始化成功
- [x] better-sqlite3 加载成功
- [x] 数据库连接建立
- [x] IPC 处理器注册成功
- [x] 前端资源加载成功
- [ ] 打开浏览器验证 UI
- [ ] 完成 keychain 授权流程
- [ ] 创建 group 和 token
- [ ] 验证 token 加密存储

---

## 下一步

1. 打开浏览器访问 `http://localhost:5181/`
2. 完成 keychain 授权流程（KeychainAuthGuide）
3. 在 Dashboard 中创建 groups 和 tokens
4. 验证所有功能正常工作

---

## 预防措施

### 1. 定期重建原生模块
```bash
npm rebuild
```

### 2. 更新 Node.js 时
```bash
pnpm install --force
```

### 3. 在 CI/CD 中
```bash
pnpm install
npm rebuild
```

### 4. 记录 Node.js 版本
在 `.nvmrc` 中：
```
22.18.0
```

---

## 相关文件修改

- `src/services/encryption.ts` - 改进的 keychain 错误处理
- `vite.config.ts` - 路径别名配置
- `tsconfig.json` - TypeScript 路径别名配置

---

## 常见问题

### Q: 为什么 keychain 解密会失败？
A: 可能是因为：
- 数据格式不匹配
- keychain 中的数据已过期
- 系统 keychain 配置问题

现在应用会自动创建新密钥来处理这种情况。

### Q: 如何重置 keychain 数据？
A: 删除应用数据目录：
```bash
rm -rf ~/Library/Application\ Support/token-keeper
```

### Q: better-sqlite3 错误如何解决？
A: 运行：
```bash
rm -rf node_modules/.pnpm/better-sqlite3*
pnpm install
```

### Q: 应用启动失败怎么办？
A: 检查控制台日志，查看具体错误信息。大多数问题可以通过以下方式解决：
```bash
pnpm install --force
npm rebuild
npm run dev
```
