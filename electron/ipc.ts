import { ipcMain } from "electron";
import * as db from "../src/database/db";
import * as groupConfig from "../src/config/groupConfig";
import type { Token } from "../src/types/database";
import { EncryptionService } from "../src/services/encryption";
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  CreateTokenSchema,
  UpdateTokenSchema,
} from "../src/schemas/index";

export function setupIPC() {
  // ============ Group IPC Handlers ============

  ipcMain.handle("group:list", () => {
    return db.getGroups();
  });

  ipcMain.handle("group:create", (_, payload: any) => {
    const validated = CreateGroupSchema.parse(payload);
    return db.createGroup(validated);
  });

  ipcMain.handle("group:update", (_, id: number, payload: any) => {
    const validated = UpdateGroupSchema.parse(payload);
    return db.updateGroup(id, validated);
  });

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

  ipcMain.handle("token:create", (_, payload: any) => {
    const validated = CreateTokenSchema.parse(payload);
    return db.createToken(validated);
  });

  ipcMain.handle("token:update", (_, id: number, payload: any) => {
    const validated = UpdateTokenSchema.parse(payload);
    return db.updateToken(id, validated);
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
    return groupConfig.setActiveGroupId(groupId);
  });

  ipcMain.handle("config:getGroupConfig", () => {
    return groupConfig.getGroupConfig();
  });

  // ============ Encryption IPC Handlers ============

  ipcMain.handle("encryption:isMasterKeyInitialized", () => {
    try {
      EncryptionService.getMasterKey();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle("encryption:getStatus", () => {
    return EncryptionService.getStatus();
  });

  ipcMain.handle("encryption:retryKeychainAuth", async () => {
    try {
      await EncryptionService.retryKeychainAuth();
      return { success: true, message: "Keychain authorization successful" };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Keychain authorization failed",
      };
    }
  });

  ipcMain.handle("encryption:useLocalStorageTemporarily", () => {
    EncryptionService.useLocalStorageTemporarily();
    return { success: true, message: "Using local storage temporarily" };
  });

  ipcMain.handle("encryption:encrypt", (_, plaintext: string) => {
    return EncryptionService.encrypt(plaintext);
  });

  ipcMain.handle("encryption:decrypt", (_, ciphertext: string) => {
    return EncryptionService.decrypt(ciphertext);
  });
}
