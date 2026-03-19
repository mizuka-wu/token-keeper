# 第二部分：分组 UUID 和 Active 状态管理实现

## 概述
本部分实现了分组功能的升级，包括：
1. 为分组添加 UUID 作为唯一标识符
2. 在 electron-config 中绑定 active 状态
3. 当分组被删除时自动清理 electron-config 中的相关状态
4. 将关联关系从 id 转换为支持 uuid

## 实现细节

### 1. 数据库实体更新

#### Group 实体 (`src/database/entities/Group.ts`)
- 添加 `uuid: string` 字段（唯一约束）
- 在创建分组时自动生成 UUID（使用 `randomUUID()`）

#### GroupToken 实体 (`src/database/entities/GroupToken.ts`)
- 添加 `group_uuid: string` 字段（可选）
- 在创建关联时同时保存 group_uuid

### 2. 类型定义更新

#### Group 类型 (`src/types/database.ts`)
```typescript
export interface Group {
  id: number;
  uuid: string;  // 新增
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}
```

#### Schema 更新 (`src/schemas/index.ts`)
- GroupSchema 中添加 uuid 字段

### 3. 配置管理升级

#### groupConfig (`src/config/groupConfig.ts`)
新增功能：
- `getActiveGroupUuid()` / `setActiveGroupUuid()` - 通过 UUID 管理 active 状态
- `getActiveGroupId()` / `setActiveGroupId()` - 保留原有的 id 管理（向后兼容）
- `clearActiveGroup()` - 同时清理 UUID 和 ID

存储结构：
```typescript
interface GroupConfigSchema {
  activeGroupUuid: string | null;
  activeGroupId: number | null;
}
```

### 4. 数据库操作更新

#### 新增函数 (`src/database/db.ts`)
- `getGroupByUuid(uuid: string)` - 通过 UUID 查询分组

#### 更新函数
- `createGroup()` - 自动生成 UUID
- `deleteGroup()` - 删除时自动清理 electron-config 中的 active 状态
- `addTokenToGroup()` - 同时保存 group_uuid

### 5. IPC 路由更新

#### 新增路由 (`electron/ipc.ts`)
- `GET /api/groups/uuid/:uuid` - 通过 UUID 查询分组

#### 更新路由
- `GET /api/config/active-group` - 返回 activeGroupUuid 和 activeGroupId
- `PUT /api/config/active-group` - 支持通过 groupUuid 或 groupId 设置 active 状态

### 6. 前端 API 更新

#### useDatabase 组合函数 (`src/composables/useDatabase.ts`)
新增方法：
- `getActiveGroupUuid()` - 获取 active 分组的 UUID
- `setActiveGroupUuid(groupUuid)` - 设置 active 分组（通过 UUID）

保留方法：
- `getActiveGroupId()` - 获取 active 分组的 ID（向后兼容）
- `setActiveGroupId(groupId)` - 设置 active 分组（通过 ID，向后兼容）

## 向后兼容性

系统同时维护 `activeGroupId` 和 `activeGroupUuid` 两个字段：
- 新代码可以使用 UUID 进行操作
- 旧代码继续使用 ID 进行操作
- 删除分组时同时清理两个字段

## 数据库迁移需求

需要执行以下迁移：
1. 为 `groups` 表添加 `uuid` 列（VARCHAR, UNIQUE）
2. 为 `group_tokens` 表添加 `group_uuid` 列（VARCHAR, NULLABLE）
3. 为现有分组生成 UUID（使用 randomUUID）

## 测试建议

1. 创建新分组，验证 UUID 自动生成
2. 设置 active 分组，验证 UUID 和 ID 同时保存
3. 删除 active 分组，验证 electron-config 自动清理
4. 通过 UUID 查询分组
5. 验证向后兼容性（通过 ID 操作仍然有效）
