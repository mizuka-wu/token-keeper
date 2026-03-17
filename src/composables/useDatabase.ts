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

  function listGroups() {
    loading.value = true;
    error.value = null;
    try {
      groups.value = ipcRenderer.invoke("group:list");
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  function createGroup(name: string, description?: string, active?: number) {
    loading.value = true;
    error.value = null;
    try {
      const newGroup = ipcRenderer.invoke(
        "group:create",
        name,
        description,
        active,
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

  function updateGroup(
    id: number,
    name?: string,
    description?: string,
    active?: number,
  ) {
    loading.value = true;
    error.value = null;
    try {
      const updated = ipcRenderer.invoke(
        "group:update",
        id,
        name,
        description,
        active,
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

  function deleteGroup(id: number) {
    loading.value = true;
    error.value = null;
    try {
      ipcRenderer.invoke("group:delete", id);
      groups.value = groups.value.filter((g) => g.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getGroup(id: number) {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("group:get", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getGroupWithTokens(id: number): GroupWithTokens | null {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("group:withTokens", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ============ Token Operations ============

  function listTokens() {
    loading.value = true;
    error.value = null;
    try {
      tokens.value = ipcRenderer.invoke("token:list");
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  function createToken(payload: {
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
      const newToken = ipcRenderer.invoke("token:create", payload);
      tokens.value.unshift(newToken);
      return newToken;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function updateToken(id: number, updates: Partial<Token>) {
    loading.value = true;
    error.value = null;
    try {
      const updated = ipcRenderer.invoke("token:update", id, updates);
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

  function deleteToken(id: number) {
    loading.value = true;
    error.value = null;
    try {
      ipcRenderer.invoke("token:delete", id);
      tokens.value = tokens.value.filter((t) => t.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getToken(id: number) {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("token:get", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function searchTokens(query: string) {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("token:search", query);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getTokenWithGroups(id: number): TokenWithGroups | null {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("token:withGroups", id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ============ Group-Token Association ============

  function addTokenToGroup(groupId: number, tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      ipcRenderer.invoke("groupToken:add", groupId, tokenId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function removeTokenFromGroup(groupId: number, tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      ipcRenderer.invoke("groupToken:remove", groupId, tokenId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getGroupTokens(groupId: number) {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("groupToken:getGroupTokens", groupId);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getTokenGroups(tokenId: number) {
    loading.value = true;
    error.value = null;
    try {
      return ipcRenderer.invoke("groupToken:getTokenGroups", tokenId);
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
  };
}
