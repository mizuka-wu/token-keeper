import { ipcMain } from "electron";
import express from "express";
import { IpcServer } from "@mizuka-wu/ipc-express/server";
import * as db from "../src/database/db";
import * as groupConfig from "../src/config/groupConfig";
import { EncryptionService } from "../src/services/encryption";
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  CreateTokenSchema,
  UpdateTokenSchema,
} from "../src/schemas/index";

export function setupIPC() {
  const app = express();
  const ipcServer = new IpcServer(ipcMain);

  app.use(express.json());

  // ============ Group Routes ============

  app.get("/api/groups", async (_req, res) => {
    try {
      const groups = await db.getGroups();
      res.status(200).send(groups);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.post("/api/groups", (req, res) => {
    try {
      const validated = CreateGroupSchema.parse(req.body);
      const group = db.createGroup(validated);
      res.status(201).send(group);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await db.getGroup(id);
      res.status(200).send(group);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.put("/api/groups/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = UpdateGroupSchema.parse(req.body);
      const group = db.updateGroup(id, validated);
      res.status(200).send(group);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.delete("/api/groups/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      db.deleteGroup(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.get("/api/groups/:id/with-tokens", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const groupWithTokens = await db.getGroupWithTokens(id);
      res.status(200).send(groupWithTokens);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  // ============ Token Routes ============

  app.get("/api/tokens", async (_req, res) => {
    try {
      const tokens = await db.getTokens();
      res.status(200).send(tokens);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.post("/api/tokens", (req, res) => {
    try {
      const validated = CreateTokenSchema.parse(req.body);
      const token = db.createToken(validated);
      res.status(201).send(token);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.get("/api/tokens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const token = await db.getToken(id);
      res.status(200).send(token);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.put("/api/tokens/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = UpdateTokenSchema.parse(req.body);
      const token = db.updateToken(id, validated);
      res.status(200).send(token);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.delete("/api/tokens/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      db.deleteToken(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.get("/api/tokens/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const results = await db.searchTokens(query);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.get("/api/tokens/:id/with-groups", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tokenWithGroups = await db.getTokenWithGroups(id);
      res.status(200).send(tokenWithGroups);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  // ============ Order Routes ============

  app.put("/api/groups/:id/order", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { orderIndex } = req.body;
      const group = db.updateGroupOrder(id, orderIndex);
      res.status(200).send(group);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.put("/api/tokens/:id/order", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { orderIndex } = req.body;
      const token = db.updateTokenOrder(id, orderIndex);
      res.status(200).send(token);
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.post("/api/groups/reorder", (req, res) => {
    try {
      const { groupIds } = req.body;
      db.reorderGroups(groupIds);
      res.status(200).send({ success: true });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.post("/api/tokens/reorder", (req, res) => {
    try {
      const { tokenIds } = req.body;
      db.reorderTokens(tokenIds);
      res.status(200).send({ success: true });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  // ============ Group-Token Association Routes ============

  app.post("/api/groups/:groupId/tokens/:tokenId", (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const tokenId = parseInt(req.params.tokenId);
      db.addTokenToGroup(groupId, tokenId);
      res.status(200).send({ success: true });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.delete("/api/groups/:groupId/tokens/:tokenId", (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const tokenId = parseInt(req.params.tokenId);
      db.removeTokenFromGroup(groupId, tokenId);
      res.status(204).send();
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.get("/api/groups/:groupId/tokens", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const tokens = await db.getGroupTokens(groupId);
      res.status(200).send(tokens);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.get("/api/tokens/:tokenId/groups", async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const groups = await db.getTokenGroups(tokenId);
      res.status(200).send(groups);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  // ============ Config Routes ============

  app.get("/api/config/active-group", (_req, res) => {
    try {
      const activeGroupId = groupConfig.getActiveGroupId();
      res.status(200).send({ activeGroupId });
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.put("/api/config/active-group", (req, res) => {
    try {
      const { groupId } = req.body;
      groupConfig.setActiveGroupId(groupId);
      res.status(200).send({ success: true });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.get("/api/config/group", (_req, res) => {
    try {
      const config = groupConfig.getGroupConfig();
      res.status(200).send(config);
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  // ============ Encryption Routes ============

  app.get("/api/encryption/initialized", (_req, res) => {
    try {
      EncryptionService.getMasterKey();
      res.status(200).send({ initialized: true });
    } catch {
      res.status(200).send({ initialized: false });
    }
  });

  app.get("/api/encryption/status", (_req, res) => {
    try {
      console.log("[token-keeper] /api/encryption/status: 开始处理请求");
      const status = EncryptionService.getStatus();
      console.log(
        "[token-keeper] /api/encryption/status: 获取状态成功",
        status,
      );
      console.log(
        "[token-keeper] /api/encryption/status: 调用 res.status(200).send() 前，res._headers:",
        (res as any)._headers,
      );
      // 只返回 message
      res.status(200).send(status);
      console.log("[token-keeper] /api/encryption/status: 响应已发送");
    } catch (error) {
      console.log("[token-keeper] /api/encryption/status: 处理请求出错", error);
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.post("/api/encryption/retry-keychain-auth", async (_req, res) => {
    try {
      await EncryptionService.retryKeychainAuth();
      res
        .status(200)
        .send({ success: true, message: "Keychain authorization successful" });
    } catch (error) {
      res.status(400).send({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Keychain authorization failed",
      });
    }
  });

  app.post("/api/encryption/use-local-storage", (_req, res) => {
    try {
      EncryptionService.useLocalStorageTemporarily();
      res
        .status(200)
        .send({ success: true, message: "Using local storage temporarily" });
    } catch (error) {
      res.status(500).send({ error: (error as Error).message });
    }
  });

  app.post("/api/encryption/encrypt", (req, res) => {
    try {
      const { plaintext } = req.body;
      const ciphertext = EncryptionService.encrypt(plaintext);
      res.status(200).send({ ciphertext });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  app.post("/api/encryption/decrypt", (req, res) => {
    try {
      const { ciphertext } = req.body;
      const plaintext = EncryptionService.decrypt(ciphertext);
      res.status(200).send({ plaintext });
    } catch (error) {
      res.status(400).send({ error: (error as Error).message });
    }
  });

  ipcServer.listen(app);
}
