import { ipcMain } from "electron";
import * as db from "../src/database/db";
import * as groupConfig from "../src/config/groupConfig";
import type { Token } from "../src/types/database";

export function setupIPC() {
  // ============ Group IPC Handlers ============

  ipcMain.handle("group:list", () => {
    return db.getGroups();
  });

  ipcMain.handle("group:create", (_, name: string, description?: string) => {
    return db.createGroup(name, description);
  });

  ipcMain.handle(
    "group:update",
    (_, id: number, name?: string, description?: string) => {
      return db.updateGroup(id, name, description);
    },
  );

  ipcMain.handle("group:delete", (_, id: number) => {
    return db.deleteGroup(id);
  });

  ipcMain.handle("group:get", (_, id: number) => {
    return db.getGroup(id);
  });

  ipcMain.handle("group:withTokens", (_, id: number) => {
    return db.getGroupWithTokens(id);
  });

  // ============ Token IPC Handlers ============

  ipcMain.handle("token:list", () => {
    return db.getTokens();
  });

  ipcMain.handle(
    "token:create",
    (
      _,
      payload: {
        name: string;
        value: string;
        env_name?: string;
        description?: string;
        tags?: string[];
        website?: string;
        expired_at?: string;
      },
    ) => {
      return db.createToken(
        payload.name,
        payload.value,
        payload.env_name,
        payload.description,
        payload.tags,
        payload.website,
        payload.expired_at,
      );
    },
  );

  ipcMain.handle("token:update", (_, id: number, updates: Partial<Token>) => {
    return db.updateToken(id, updates);
  });

  ipcMain.handle("token:delete", (_, id: number) => {
    return db.deleteToken(id);
  });

  ipcMain.handle("token:get", (_, id: number) => {
    return db.getToken(id);
  });

  ipcMain.handle("token:search", (_, query: string) => {
    return db.searchTokens(query);
  });

  ipcMain.handle("token:withGroups", (_, id: number) => {
    return db.getTokenWithGroups(id);
  });

  // ============ Order/Drag IPC Handlers ============

  ipcMain.handle(
    "order:updateGroupOrder",
    (_, id: number, orderIndex: number) => {
      return db.updateGroupOrder(id, orderIndex);
    },
  );

  ipcMain.handle(
    "order:updateTokenOrder",
    (_, id: number, orderIndex: number) => {
      return db.updateTokenOrder(id, orderIndex);
    },
  );

  ipcMain.handle("order:reorderGroups", (_, groupIds: number[]) => {
    return db.reorderGroups(groupIds);
  });

  ipcMain.handle("order:reorderTokens", (_, tokenIds: number[]) => {
    return db.reorderTokens(tokenIds);
  });

  // ============ Group-Token Association IPC Handlers ============

  ipcMain.handle("groupToken:add", (_, groupId: number, tokenId: number) => {
    return db.addTokenToGroup(groupId, tokenId);
  });

  ipcMain.handle("groupToken:remove", (_, groupId: number, tokenId: number) => {
    return db.removeTokenFromGroup(groupId, tokenId);
  });

  ipcMain.handle("groupToken:getGroupTokens", (_, groupId: number) => {
    return db.getGroupTokens(groupId);
  });

  ipcMain.handle("groupToken:getTokenGroups", (_, tokenId: number) => {
    return db.getTokenGroups(tokenId);
  });

  // ============ Group Config IPC Handlers ============

  ipcMain.handle("config:getActiveGroupId", () => {
    return groupConfig.getActiveGroupId();
  });

  ipcMain.handle("config:setActiveGroupId", (_, groupId: number | null) => {
    groupConfig.setActiveGroupId(groupId);
  });

  ipcMain.handle("config:getGroupConfig", () => {
    return groupConfig.getGroupConfig();
  });
}
