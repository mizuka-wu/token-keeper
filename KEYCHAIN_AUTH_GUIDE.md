# Keychain 授权引导页面实现指南

## 概述

应用启动时，如果 keychain 授权失败，用户会看到一个完整的多步骤引导页面，必须完成授权才能继续使用应用。

## 用户流程

```
应用启动
  ↓
检查 keychain 授权
  ├─ 成功 → 正常启动应用
  └─ 失败 ↓
    显示 KeychainAuthGuide 引导页面
      ↓
    第 1 步：介绍 keychain 的安全优势
      ↓
    第 2 步：提供授权说明
      ↓
    用户点击"Authorize Now"
      ↓
    系统弹出 keychain 授权对话框
      ↓
    用户选择"Always Allow"
      ↓
    第 3 步：验证授权状态
      ↓
    授权成功 → 第 4 步：成功提示 → 自动重新加载应用
    授权失败 → 第 5 步：提供系统设置链接
```

## 文件结构

### 前端组件

**`src/pages/KeychainAuthGuide.vue`**
- 完整的多步骤引导页面
- 5 个步骤的页面设计
- 美观的 UI 和动画效果
- 响应式设计

**`src/composables/useEncryption.ts`**
- `retryKeychainAuth()` - 重新尝试授权
- `useLocalStorageTemporarily()` - 临时使用本地存储（备选）
- `getStatus()` - 获取加密状态

**`src/App.vue`**
- 启动时检查加密状态
- 如果未初始化，显示 `KeychainAuthGuide`

### 后端服务

**`src/services/encryption.ts`**
- `initializeMasterKey()` - 初始化主密钥，失败时抛出 `KEYCHAIN_AUTH_REQUIRED` 错误
- `retryKeychainAuth()` - 重新尝试授权
- `useLocalStorageTemporarily()` - 临时使用本地存储
- `getStatus()` - 返回加密状态

**`electron/main.ts`**
- 捕获 `KEYCHAIN_AUTH_REQUIRED` 错误
- 即使授权失败也继续初始化应用
- 处理 `open-system-settings` IPC 事件

**`electron/ipc.ts`**
- `encryption:retryKeychainAuth` - IPC 处理器
- `encryption:useLocalStorageTemporarily` - IPC 处理器
- `encryption:getStatus` - IPC 处理器

## 引导页面详细说明

### 第 1 步：介绍（Introduction）
- 显示 🔐 图标
- 解释为什么需要 keychain
- 列出 keychain 的 4 个优势
- "Continue to Authorization" 按钮

### 第 2 步：授权说明（Authorization Instructions）
- 详细的步骤说明
- **重点强调**"Always Allow"
- 警告框：不要点击"Deny"
- 错误提示框（如果有）
- "Authorize Now" 和 "Back" 按钮

### 第 3 步：验证（Verification）
- 显示加载动画
- "Checking keychain access..." 文本

### 第 4 步：成功（Success）
- 显示 ✓ 图标和成功消息
- "Launching Token Keeper..." 文本
- 2 秒后自动重新加载应用

### 第 5 步：失败处理（Fallback）
- 显示错误信息
- 提供系统设置步骤说明
- "Retry Authorization" 按钮
- "Open System Settings" 按钮（打开系统设置）

## 关键特性

### 强制授权
- 用户必须完成 keychain 授权才能使用应用
- 没有"跳过"或"稍后"选项
- 确保所有用户都有安全的加密存储

### 清晰的用户指导
- 详细的步骤说明
- 强调"Always Allow"的重要性
- 警告不要点击"Deny"

### 完整的错误处理
- 授权失败时显示第 5 步
- 提供系统设置快捷方式
- 允许用户重试授权

### 美观的 UI
- 渐变背景
- 动画过渡
- 响应式设计
- 清晰的视觉层次

## 技术实现细节

### Keychain 授权流程

1. **初始化时尝试 keychain**
   ```typescript
   await EncryptionService.initializeMasterKey()
   ```

2. **失败时抛出错误**
   ```typescript
   throw {
     code: "KEYCHAIN_AUTH_REQUIRED",
     message: "Keychain authorization required..."
   }
   ```

3. **主进程捕获错误**
   ```typescript
   catch (error) {
     if (error.code === "KEYCHAIN_AUTH_REQUIRED") {
       // 继续初始化应用，前端显示引导页面
     }
   }
   ```

4. **前端显示引导页面**
   ```typescript
   const status = await getStatus()
   if (!status.initialized) {
     showKeychainGuide.value = true
   }
   ```

5. **用户授权后重试**
   ```typescript
   const result = await retryKeychainAuth()
   if (result.success) {
     window.location.reload()
   }
   ```

### 系统设置快捷方式

**macOS**
```typescript
open 'x-apple.systempreferences:com.apple.preference.security?Privacy_Keychain'
```

**Windows**
```typescript
start ms-settings:privacy-credentials
```

## 使用示例

### 在应用中检查加密状态

```typescript
import { useEncryption } from '@/composables/useEncryption'

const { getStatus } = useEncryption()

const status = await getStatus()
console.log(status)
// {
//   initialized: true,
//   useKeychain: true,
//   message: "Master key stored in system keychain (secure)"
// }
```

### 重新尝试授权

```typescript
const { retryKeychainAuth } = useEncryption()

const result = await retryKeychainAuth()
if (result.success) {
  console.log('Authorization successful!')
  window.location.reload()
} else {
  console.error('Authorization failed:', result.message)
}
```

## 安全性考虑

1. **强制授权**：确保所有用户都使用 keychain 保护主密钥
2. **不可绕过**：没有"跳过"选项，用户必须完成授权
3. **自动重新加载**：授权成功后自动重新加载应用，确保新的授权生效
4. **清晰的说明**：帮助用户理解为什么需要 keychain 访问

## 故障排除

### 用户多次点击"Deny"

1. 引导页面会显示第 5 步（失败处理）
2. 提供"Open System Settings"按钮
3. 用户可以在系统设置中手动授权
4. 重启应用后重试

### Keychain 不可用

- 在某些系统上 keychain 可能不可用
- 应用会显示错误信息
- 用户可以重试或联系支持

### 授权后仍然失败

- 可能需要重启应用
- 可能需要重启系统
- 检查系统设置中是否正确授权

## 文件清单

### 新增文件
- `src/pages/KeychainAuthGuide.vue` - 引导页面
- `KEYCHAIN_AUTH_GUIDE.md` - 本文档

### 修改文件
- `src/App.vue` - 集成引导页面
- `src/composables/useEncryption.ts` - 添加新的 API
- `src/services/encryption.ts` - 添加授权重试逻辑
- `electron/main.ts` - 添加系统设置快捷方式
- `electron/ipc.ts` - 添加新的 IPC 处理器
- `ENCRYPTION_IMPLEMENTATION.md` - 更新文档

## 下一步

1. 测试引导页面的所有步骤
2. 验证 keychain 授权流程
3. 测试系统设置快捷方式
4. 在不同系统上测试（macOS、Windows）
5. 收集用户反馈并优化 UI
