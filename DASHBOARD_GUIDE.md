# Dashboard 管理页面使用指南

## 概述

Dashboard 是 Token Keeper 的主要管理界面，提供了简单直观的 Group 和 Token 管理功能。

## 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  Token Keeper        [+ New Group]  [+ New Token]      │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   Groups     │  Group Name                              │
│   Sidebar    │  Group Description                       │
│              │                                           │
│  ┌────────┐  │  ┌──────────────────────────────────┐   │
│  │ Group1 │  │  │ Token Card 1                     │   │
│  │   (5)  │  │  │ - Name, Env, Website, Tags      │   │
│  └────────┘  │  └──────────────────────────────────┘   │
│              │                                           │
│  ┌────────┐  │  ┌──────────────────────────────────┐   │
│  │ Group2 │  │  │ Token Card 2                     │   │
│  │   (3)  │  │  │ - Name, Env, Website, Tags      │   │
│  └────────┘  │  └──────────────────────────────────┘   │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

## 主要功能

### 1. Group 管理

#### 查看 Groups
- 左侧边栏显示所有 groups
- 每个 group 显示名称和包含的 token 数量
- 点击 group 切换当前选中的 group

#### 创建 Group
1. 点击顶部 "+ New Group" 按钮
2. 输入 Group 名称（必填）
3. 输入 Group 描述（可选）
4. 点击 "Create" 按钮

#### 编辑 Group
- 点击 group 卡片进入编辑模式
- 修改名称和描述
- 点击 "Update" 保存更改

### 2. Token 管理

#### 查看 Tokens
- 主区域显示当前 group 中的所有 tokens
- 每个 token 显示为一张卡片
- 卡片包含以下信息：
  - **名称**：Token 的名称
  - **环境变量**：如 `PROD_API_KEY`
  - **网站**：相关网站链接
  - **描述**：Token 的说明
  - **标签**：分类标签
  - **过期日期**：Token 的过期时间

#### 创建 Token
1. 点击顶部 "+ New Token" 按钮或空状态的 "Add First Token" 按钮
2. 填写 Token 信息：
   - **Token Name**（必填）：Token 的名称
   - **Token Value**（必填）：实际的 token 值（会自动加密存储）
   - **Environment**（可选）：环境变量名称
   - **Website**（可选）：相关网站 URL
   - **Description**（可选）：Token 说明
   - **Tags**（可选）：用逗号分隔的标签
   - **Expiry Date**（可选）：过期日期
3. 点击 "Create" 按钮

#### 编辑 Token
1. 点击 token 卡片上的 ✏️ 按钮
2. 修改 token 信息
3. 点击 "Update" 保存更改

#### 复制 Token
- 点击 token 卡片上的 📋 按钮
- Token 值会被复制到剪贴板
- 显示 "Copied to clipboard" 提示

#### 删除 Token
1. 点击 token 卡片上的 🗑️ 按钮
2. 确认删除
3. Token 被删除

### 3. Token 值加密

所有 token 值都会自动加密存储：
- 创建或编辑 token 时，值会被自动加密
- 显示时会被自动解密
- 用户无需手动处理加密/解密

## 交互细节

### 模态框（Modal）
- 点击模态框外部可关闭
- 点击 ✕ 按钮可关闭
- 点击 "Cancel" 按钮可关闭

### 通知（Toast）
- 操作成功时显示绿色通知
- 操作失败时显示红色通知
- 通知会在 3 秒后自动消失

### 响应式设计
- 在小屏幕上，groups sidebar 会显示在顶部
- Token 卡片会自动调整为单列布局

## 快捷操作

| 操作 | 快捷键/按钮 |
|------|-----------|
| 新建 Group | "+ New Group" 按钮 |
| 新建 Token | "+ New Token" 按钮 |
| 选择 Group | 点击 group 项 |
| 编辑 Token | ✏️ 按钮 |
| 复制 Token | 📋 按钮 |
| 删除 Token | 🗑️ 按钮 |

## 使用场景

### 场景 1：管理多个环境的 API Keys
1. 创建 "Production" group
2. 创建 "Staging" group
3. 创建 "Development" group
4. 在每个 group 中添加对应环境的 API keys

### 场景 2：管理不同服务的 Tokens
1. 创建 "GitHub" group
2. 创建 "AWS" group
3. 创建 "Stripe" group
4. 在每个 group 中添加对应服务的 tokens

### 场景 3：快速查找和复制 Token
1. 在左侧 sidebar 中选择 group
2. 在主区域找到需要的 token
3. 点击 📋 按钮快速复制

## 最佳实践

1. **使用有意义的 Group 名称**
   - ✅ "Production", "Staging", "Development"
   - ❌ "Group1", "Group2"

2. **添加详细的 Token 描述**
   - 说明 token 的用途
   - 记录相关的网站或服务
   - 标记过期日期

3. **使用标签分类 Tokens**
   - 按服务分类：`github`, `aws`, `stripe`
   - 按用途分类：`api-key`, `oauth-token`, `webhook-secret`
   - 按权限分类：`read-only`, `read-write`, `admin`

4. **定期检查过期 Tokens**
   - 设置合理的过期日期
   - 定期更新过期的 tokens
   - 删除不再使用的 tokens

5. **安全备份**
   - Token Keeper 使用 keychain 加密存储
   - 定期备份应用数据
   - 不要在不安全的地方分享 tokens

## 常见问题

### Q: Token 值会被加密吗？
A: 是的，所有 token 值都会使用 AES-256-GCM 加密算法自动加密，主密钥存储在系统 keychain 中。

### Q: 可以导出 Tokens 吗？
A: 目前不支持导出功能，但可以通过复制单个 token 值来使用。

### Q: 删除 Token 后可以恢复吗？
A: 不可以，删除是永久的。请在删除前确认。

### Q: 一个 Token 可以属于多个 Groups 吗？
A: 目前的设计中，一个 token 只能属于一个 group。

### Q: Group 中没有 Tokens 时会怎样？
A: 会显示空状态提示，可以点击 "Add First Token" 快速添加。

## 文件结构

```
src/pages/
└── Dashboard.vue          # 主管理页面
    ├── Groups Sidebar     # Group 列表
    ├── Tokens Main Area   # Token 卡片网格
    ├── Add/Edit Group Modal
    └── Add/Edit Token Modal
```

## 技术细节

### 使用的 IPC 接口

**Group 操作**
- `group:list` - 获取所有 groups
- `group:create` - 创建 group
- `group:update` - 更新 group
- `group:delete` - 删除 group

**Token 操作**
- `token:list` - 获取所有 tokens
- `token:create` - 创建 token
- `token:update` - 更新 token
- `token:delete` - 删除 token

### 数据流

```
用户操作
  ↓
Vue 组件事件处理
  ↓
IPC 调用主进程
  ↓
数据库操作
  ↓
自动加密/解密
  ↓
返回结果
  ↓
更新 UI
```

## 下一步改进

- [ ] 搜索和过滤功能
- [ ] Token 分享功能
- [ ] 批量操作
- [ ] 导入/导出
- [ ] Token 使用历史
- [ ] 权限管理
- [ ] 团队协作
