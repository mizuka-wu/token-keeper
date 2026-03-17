# Token 加密实现文档

## 概述

本项目使用 Electron 的 `safeStorage` API 和系统 keychain 来安全存储主密钥（Master Key），用于对所有 token 值进行 AES-256-GCM 加密和解密。

## 架构设计

### 1. 主密钥管理 (`src/services/encryption.ts`)

- **初始化流程**：
  - 应用启动时，`EncryptionService.initializeMasterKey()` 被调用
  - 检查 `electron-store` 中是否存在已加密的主密钥
  - 如果不存在，生成新的 32 字节随机密钥
  - 使用 `safeStorage.encryptString()` 加密主密钥并存储到 `electron-store`
  - 主密钥存储在系统 keychain 中（由 Electron 自动处理）

- **加密算法**：
  - 算法：AES-256-GCM
  - IV 长度：12 字节（随机生成）
  - 认证标签长度：16 字节
  - 密钥长度：32 字节

- **加密格式**：
  - 密文 = Base64(IV + AuthTag + EncryptedData)

### 2. Token 值加密

在数据库层自动处理：

- **创建 Token**：`createToken()` 自动加密 `value` 字段
- **更新 Token**：`updateToken()` 自动加密新的 `value` 值
- **读取 Token**：`parseToken()` 自动解密存储的 `value` 值

### 3. IPC 接口

前端可以通过以下 IPC 接口与加密服务交互：

```typescript
// 检查主密钥是否已初始化
window.ipcRenderer.invoke("encryption:isMasterKeyInitialized") -> Promise<boolean>

// 加密字符串
window.ipcRenderer.invoke("encryption:encrypt", plaintext: string) -> Promise<string>

// 解密字符串
window.ipcRenderer.invoke("encryption:decrypt", ciphertext: string) -> Promise<string>
```

## 使用示例

### 在 Vue 组件中使用加密

```typescript
<script setup lang="ts">
import { useEncryption } from '@/composables/useEncryption'

const { encrypt, decrypt, isMasterKeyInitialized } = useEncryption()

// 检查主密钥是否初始化
const checkMasterKey = async () => {
  const initialized = await isMasterKeyInitialized()
  console.log('Master key initialized:', initialized)
}

// 加密 token 值
const encryptToken = async () => {
  const plaintext = 'my-secret-token-value'
  const encrypted = await encrypt(plaintext)
  console.log('Encrypted:', encrypted)
}

// 解密 token 值
const decryptToken = async () => {
  const ciphertext = 'base64-encrypted-value'
  const plaintext = await decrypt(ciphertext)
  console.log('Decrypted:', plaintext)
}
</script>
```

### 在数据库操作中

Token 的加密和解密是自动的，无需手动处理：

```typescript
// 创建 token - 值自动加密
const token = await db.createToken(
  'API_KEY',
  'secret-value-here',  // 自动加密存储
  'PRODUCTION',
  'My API Key'
)

// 读取 token - 值自动解密
const token = await db.getToken(1)
console.log(token.value)  // 已解密的原始值

// 更新 token - 新值自动加密
await db.updateToken(1, {
  value: 'new-secret-value'  // 自动加密
})
```

## 安全特性

1. **主密钥保护**：
   - 主密钥由 Electron 的 `safeStorage` API 加密
   - 存储在系统 keychain 中（macOS Keychain、Windows Credential Manager 等）
   - 用户无法直接访问或导出主密钥

2. **每次加密使用随机 IV**：
   - 每次加密都生成新的随机初始化向量
   - 即使相同的明文也会产生不同的密文

3. **认证加密**：
   - 使用 GCM 模式提供认证标签
   - 防止密文被篡改

4. **自动解密**：
   - 从数据库读取的 token 值自动解密
   - 前端无需关心加密细节

## 初始化流程

应用启动时的初始化顺序：

```
app.whenReady()
  ↓
EncryptionService.initializeMasterKey()  // 初始化加密服务
  ↓
initializeDatabase()  // 初始化数据库
  ↓
setupIPC()  // 设置 IPC 处理器
  ↓
createWindow()  // 创建窗口
```

## Keychain 授权引导页面

如果用户拒绝 keychain 授权或 keychain 不可用，应用会显示完整的引导页面强制用户完成授权：

### 引导流程

1. **应用启动时检查**
   - 调用 `EncryptionService.initializeMasterKey()`
   - 尝试使用 keychain 存储主密钥

2. **Keychain 授权失败**
   - 抛出 `KEYCHAIN_AUTH_REQUIRED` 错误
   - 主进程捕获错误，继续初始化应用
   - 前端显示 `KeychainAuthGuide` 引导页面

3. **引导页面步骤**
   - **第 1 步**：介绍 keychain 的安全优势
   - **第 2 步**：提供授权说明和"Always Allow"提示
   - **第 3 步**：验证授权状态
   - **第 4 步**：授权成功，自动重新加载应用
   - **第 5 步**（可选）：授权失败，提供系统设置链接

### KeychainAuthGuide 组件

完整的多步骤引导页面，包含：

```typescript
// 重新尝试 keychain 授权
const { retryKeychainAuth } = useEncryption()
const result = await retryKeychainAuth()
// { success: true, message: "Keychain authorization successful" }

// 打开系统设置
window.ipcRenderer.send('open-system-settings')
```

### 页面特性

- **强制授权**：用户必须完成 keychain 授权才能使用应用
- **清晰说明**：详细解释为什么需要 keychain 访问
- **多步骤引导**：逐步引导用户完成授权过程
- **错误处理**：授权失败时提供系统设置快捷方式
- **响应式设计**：适配各种屏幕尺寸
- **自动重新加载**：授权成功后自动重新加载应用

### 获取加密状态

前端可以通过 `getStatus()` 接口检查当前的加密模式：

```typescript
const { getStatus } = useEncryption()

const status = await getStatus()
// {
//   initialized: true,
//   useKeychain: true,  // 表示使用 keychain
//   message: "Master key stored in system keychain (secure)"
// }
```

### 安全性影响

| 模式 | 安全性 | 说明 |
|------|--------|------|
| Keychain 模式 | ⭐⭐⭐⭐⭐ | 主密钥由系统 keychain 保护，最安全 |
| 本地存储模式 | ⭐⭐⭐ | 主密钥以明文存储，但 token 值仍被加密 |

**注意**：即使在本地存储模式下，所有 token 值仍然被加密存储，只是主密钥保护级别降低。

## 错误处理

- 如果解密失败，`parseToken()` 会记录警告并返回加密值
- 前端可以通过 try-catch 捕获加密/解密错误
- 主密钥初始化不会失败（会自动降级到本地存储）
- 应用可以正常运行，但会显示安全警告

## 文件结构

```
src/
├── services/
│   └── encryption.ts          # 加密服务核心
├── composables/
│   └── useEncryption.ts       # Vue 组合式 API
├── database/
│   └── db.ts                  # 集成加密的数据库操作
└── types/
    └── database.ts            # 类型定义

electron/
├── main.ts                    # 主进程入口，初始化加密
├── ipc.ts                     # IPC 处理器
└── preload.ts                 # 预加载脚本
```

## 依赖

- `electron`：提供 `safeStorage` API
- `electron-store`：持久化存储加密的主密钥
- `crypto`：Node.js 内置加密模块

## 注意事项

1. 主密钥在应用启动时初始化，之后保存在内存中
2. 应用关闭时，主密钥从内存中清除
3. 每次应用启动都会从 keychain 重新读取加密的主密钥
4. 不支持在运行时更改主密钥（需要重启应用）
5. 如果用户更换计算机，需要重新生成主密钥（旧密钥无法解密）
