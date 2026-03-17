# Token-Keeper CRUD 系统实现总结

## 已完成的功能

### 1. 数据库设计与初始化 (`src/database/init.ts`)

- ✅ 使用 libsql 创建数据库连接
- ✅ 创建三张表：
  - **groups**: 分组表（id, name, description, created_at, updated_at）
  - **tokens**: 密钥表（id, name, value, env_name, description, tags, website, expired_at, created_at, updated_at）
  - **group_tokens**: 分组-密钥关联表（id, group_id, token_id, created_at）
- ✅ 支持一个 token 属于多个分组
- ✅ 数据库文件存储在 `~/Library/Application Support/token-keeper/tokens.db`

### 2. 数据库操作模块 (`src/database/db.ts`)

完整的 CRUD 操作，所有函数都是同步的（使用 libsql 的 prepare/get/all/exec API）

#### Group 操作

- ✅ `createGroup(name, description)` - 创建分组
- ✅ `getGroups()` - 获取所有分组
- ✅ `getGroup(id)` - 获取单个分组
- ✅ `updateGroup(id, name, description)` - 更新分组
- ✅ `deleteGroup(id)` - 删除分组

#### Token 操作

- ✅ `createToken(name, value, env_name, description, tags, website, expired_at)` - 创建 token
- ✅ `getToken(id)` - 获取单个 token
- ✅ `getTokens()` - 获取所有 token（按过期时间排序，未过期的在上）
- ✅ `updateToken(id, updates)` - 更新 token
- ✅ `deleteToken(id)` - 删除 token
- ✅ `searchTokens(query)` - 搜索 token（按名称、描述、网站、环境变量名）

#### 分组-Token 关联操作

- ✅ `addTokenToGroup(groupId, tokenId)` - 添加 token 到分组
- ✅ `removeTokenFromGroup(groupId, tokenId)` - 从分组移除 token
- ✅ `getGroupTokens(groupId)` - 获取分组内的所有 token
- ✅ `getTokenGroups(tokenId)` - 获取 token 所属的所有分组
- ✅ `getGroupWithTokens(groupId)` - 获取分组及其 token
- ✅ `getTokenWithGroups(tokenId)` - 获取 token 及其分组

#### 拖拽排序操作

- ✅ `updateGroupOrder(id, orderIndex)` - 更新单个分组的排序位置
- ✅ `updateTokenOrder(id, orderIndex)` - 更新单个 token 的排序位置
- ✅ `reorderGroups(groupIds)` - 批量重新排序分组
- ✅ `reorderTokens(tokenIds)` - 批量重新排序 token

### 3. IPC 通信层 (`electron/ipc.ts`)

- ✅ 在 Electron 主进程注册 IPC 事件处理器
- ✅ 暴露所有数据库操作给渲染进程
- ✅ 支持的事件：
  - `group:list`, `group:create`, `group:update`, `group:delete`, `group:get`, `group:withTokens`
  - `token:list`, `token:create`, `token:update`, `token:delete`, `token:get`, `token:search`, `token:withTokens`
  - `order:updateGroupOrder`, `order:updateTokenOrder`, `order:reorderGroups`, `order:reorderTokens`
  - `config:getActiveGroupId`, `config:setActiveGroupId`, `config:getGroupConfig`
  - `groupToken:add`, `groupToken:remove`, `groupToken:getGroupTokens`, `groupToken:getTokenGroups`

### 4. Vue 3 Composition API 钩子 (`src/composables/useDatabase.ts`)

- ✅ 创建 `useDatabase()` 钩子
- ✅ 响应式状态：`groups`, `tokens`, `loading`, `error`
- ✅ 所有数据库操作方法
- ✅ 错误处理和加载状态管理

### 5. TypeScript 类型定义 (`src/types/database.ts`)

- ✅ `Group` 接口
- ✅ `Token` 接口
- ✅ `GroupToken` 接口
- ✅ `TokenWithGroups` 接口
- ✅ `GroupWithTokens` 接口

### 6. Group Config 管理 (`src/config/groupConfig.ts`)

- ✅ 使用 electron-config 单独管理 active group 状态
- ✅ 配置文件存储在 `~/Library/Application Support/token-keeper/group-config.json`
- ✅ 支持获取/设置当前活跃分组
- ✅ 自动持久化到文件系统

### 7. Electron 主进程集成 (`electron/main.ts`)

- ✅ 在应用启动时初始化数据库
- ✅ 在应用启动时初始化 Group Config
- ✅ 设置 IPC 事件处理器

## 数据特性

### Group 特性

- **Order 字段**: 用于拖拽排序，值越小越靠前
- **默认分组**: 应用启动时自动创建名为 "Default" 的默认分组
- **Active 状态**: 通过 electron-config 单独管理（group-config.json）
- 支持拖拽调整分组顺序
- 支持设置/获取当前活跃分组

### Token 排序规则

- 未过期的 token 在上方
- 已过期的 token 在下方
- 同类别内按 order_index 排序（支持拖拽调整）
- 同优先级内按创建/过期时间排序

### Token 名称

- 支持重复（同一名称可以有多个 token）
- 支持修改
- 用隐藏的 `id` 字段作为唯一标识

### 标签系统

- 支持多个标签
- 以 JSON 数组格式存储
- 自动序列化/反序列化

## 技术栈

- **数据库**: libsql (SQLite)
- **前端框架**: Vue 3 with Composition API
- **桌面应用**: Electron
- **IPC 通信**: Electron ipcMain/ipcRenderer
- **语言**: TypeScript

## 使用示例

### 在 Vue 组件中使用

```typescript
import { useDatabase } from '@/composables/useDatabase'

export default {
  setup() {
    const { 
      groups, 
      tokens, 
      createGroup, 
      createToken, 
      getGroupTokens,
      reorderGroups,
      reorderTokens
    } = useDatabase()
    
    // 创建分组
    const newGroup = createGroup('AI Services', 'OpenAI, Claude, etc.')
    
    // 创建 token
    const newToken = createToken({
      name: 'OpenAI API Key',
      value: 'sk-proj-xxx',
      env_name: 'OPENAI_API_KEY',
      description: 'Main API key',
      tags: ['ai', 'openai'],
      website: 'https://openai.com',
      expired_at: '2025-12-31'
    })
    
    // 添加 token 到分组
    addTokenToGroup(newGroup.id, newToken.id)
    
    // 获取分组内的 token
    const groupTokens = getGroupTokens(newGroup.id)
    
    // 拖拽排序分组
    const handleGroupDragEnd = (groupIds: number[]) => {
      reorderGroups(groupIds)
    }
    
    // 拖拽排序 token
    const handleTokenDragEnd = (tokenIds: number[]) => {
      reorderTokens(tokenIds)
    }
    
    return { groups, tokens, handleGroupDragEnd, handleTokenDragEnd }
  }
}
```

## 构建状态

✅ TypeScript 编译成功
✅ Vite 构建成功
✅ Electron 构建成功（签名警告可忽略）

## 下一步

1. 实现加密存储（AES-256）
2. 实现通行证密钥验证（Touch ID/Face ID）
3. 实现环境变量同步功能
4. 创建 UI 组件
5. 添加单元测试
