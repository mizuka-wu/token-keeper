import { ref } from "vue";
import type {
  Group,
  Token,
  TokenWithGroups,
  GroupWithTokens,
} from "../types/database";

const ipcRenderer = (window as any).ipcRenderer;

export function useDatabase() {
  const groups = ref<Group[]>([]);
  const tokens = ref<Token[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============ Group Operations ============

  async function listGroups() {
    loading.value = true;
    error.value = null;
    try {
      groups.value = await ipcRenderer.invoke("group:list");
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function createGroup(name: string, description?: string) {
    loading.value = true;
    error.value = null;
    try {
      const newGroup = await ipcRenderer.invoke(
        "group:create",
        name,
        description,
      );
      groups.value.unshift(newGroup);
      return newGroup;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateGroup(id: number, name?: string, description?: string) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await ipcRenderer.invoke(
        "group:update",
        id,
        name,
        description,
      );
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteGroup(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("group:delete", id);
      groups.value = groups.value.filter((g) => g.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getGroup(id: number) {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("group:get", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getGroupWithTokens(
    id: number,
  ): Promise<GroupWithTokens | null> {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("group:withTokens", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ============ Token Operations ============

  async function listTokens() {
    loading.value = true;
    error.value = null;
    try {
      tokens.value = await ipcRenderer.invoke("token:list");
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function createToken(payload: {
    name: string;
    value: string;
    env_name?: string;
    description?: string;
    tags?: string[];
    website?: string;
    expired_at?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const newToken = await ipcRenderer.invoke("token:create", payload);
      tokens.value.unshift(newToken);
      return newToken;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateToken(
    id: number,
    updates: Partial<Omit<Token, "id" | "created_at" | "updated_at">>,
  ) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await ipcRenderer.invoke("token:update", id, updates);
      const index = tokens.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tokens.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteToken(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("token:delete", id);
      tokens.value = tokens.value.filter((t) => t.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getToken(id: number) {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("token:get", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function searchTokens(query: string) {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("token:search", query);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getTokenWithGroups(
    id: number,
  ): Promise<TokenWithGroups | null> {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("token:withGroups", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ============ Group-Token Association ============

  async function addTokenToGroup(groupId: number, tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("groupToken:add", groupId, tokenId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function removeTokenFromGroup(groupId: number, tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("groupToken:remove", groupId, tokenId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getGroupTokens(groupId: number) {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("groupToken:getGroupTokens", groupId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getTokenGroups(tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      return await ipcRenderer.invoke("groupToken:getTokenGroups", tokenId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ============ Group Config Operations ============

  async function getActiveGroupId() {
    try {
      return await ipcRenderer.invoke("config:getActiveGroupId");
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  async function setActiveGroupId(groupId: number | null) {
    try {
      await ipcRenderer.invoke("config:setActiveGroupId", groupId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  async function getGroupConfig() {
    try {
      return await ipcRenderer.invoke("config:getGroupConfig");
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  // ============ Order/Drag Operations ============

  async function updateGroupOrder(id: number, orderIndex: number) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await ipcRenderer.invoke(
        "order:updateGroupOrder",
        id,
        orderIndex,
      );
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateTokenOrder(id: number, orderIndex: number) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await ipcRenderer.invoke(
        "order:updateTokenOrder",
        id,
        orderIndex,
      );
      const index = tokens.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tokens.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function reorderGroups(groupIds: number[]) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("order:reorderGroups", groupIds);
      await listGroups();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function reorderTokens(tokenIds: number[]) {
    loading.value = true;
    error.value = null;
    try {
      await ipcRenderer.invoke("order:reorderTokens", tokenIds);
      await listTokens();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    groups,
    tokens,
    loading,
    error,
    // Group methods
    listGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getGroupWithTokens,
    // Token methods
    listTokens,
    createToken,
    updateToken,
    deleteToken,
    getToken,
    searchTokens,
    getTokenWithGroups,
    // Association methods
    addTokenToGroup,
    removeTokenFromGroup,
    getGroupTokens,
    getTokenGroups,
    // Group Config methods
    getActiveGroupId,
    setActiveGroupId,
    getGroupConfig,
    // Order/Drag methods
    updateGroupOrder,
    updateTokenOrder,
    reorderGroups,
    reorderTokens,
  };
}
