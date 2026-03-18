import { ref } from "vue";
import type {
  Group,
  Token,
  TokenWithGroups,
  GroupWithTokens,
} from "../types/database";

const ipcClient = (window as any).ipcClient;

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
      const response = await (ipcClient.get as any)("/api/groups");
      groups.value = response.data;
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
      const response = await (ipcClient.post as any)("/api/groups", {
        name,
        description,
      });
      groups.value.unshift(response.data);
      return response.data;
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
      const response = await (ipcClient.put as any)(`/api/groups/${id}`, {
        name,
        description,
      });
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = response.data;
      }
      return response.data;
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
      await (ipcClient.delete as any)(`/api/groups/${id}`);
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
      const response = await (ipcClient.get as any)(`/api/groups/${id}`);
      return response.data;
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
      const response = await (ipcClient.get as any)(
        `/api/groups/${id}/with-tokens`,
      );
      return response.data;
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
      const response = await (ipcClient.get as any)("/api/tokens");
      tokens.value = response.data;
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
      const response = await (ipcClient.post as any)("/api/tokens", payload);
      tokens.value.unshift(response.data);
      return response.data;
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
      const response = await (ipcClient.put as any)(
        `/api/tokens/${id}`,
        updates,
      );
      const index = tokens.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tokens.value[index] = response.data;
      }
      return response.data;
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
      await (ipcClient.delete as any)(`/api/tokens/${id}`);
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
      const response = await (ipcClient.get as any)(`/api/tokens/${id}`);
      return response.data;
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
      const response = await (ipcClient.get as any)(
        `/api/tokens/search/${query}`,
      );
      return response.data;
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
      const response = await (ipcClient.get as any)(
        `/api/tokens/${id}/with-groups`,
      );
      return response.data;
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
      await (ipcClient.post as any)(`/api/groups/${groupId}/tokens/${tokenId}`);
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
      await (ipcClient.delete as any)(
        `/api/groups/${groupId}/tokens/${tokenId}`,
      );
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
      const response = await (ipcClient.get as any)(
        `/api/groups/${groupId}/tokens`,
      );
      return response.data;
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
      const response = await (ipcClient.get as any)(
        `/api/tokens/${tokenId}/groups`,
      );
      return response.data;
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
      const response = await (ipcClient.get as any)("/api/config/active-group");
      return response.data.activeGroupId;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  async function setActiveGroupId(groupId: number | null) {
    try {
      await (ipcClient.put as any)("/api/config/active-group", { groupId });
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  async function getGroupConfig() {
    try {
      const response = await (ipcClient.get as any)("/api/config/group");
      return response.data;
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
      const response = await (ipcClient.put as any)(`/api/groups/${id}/order`, {
        orderIndex,
      });
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = response.data;
      }
      return response.data;
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
      const response = await (ipcClient.put as any)(`/api/tokens/${id}/order`, {
        orderIndex,
      });
      const index = tokens.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tokens.value[index] = response.data;
      }
      return response.data;
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
      await (ipcClient.post as any)("/api/groups/reorder", { groupIds });
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
      await (ipcClient.post as any)("/api/tokens/reorder", { tokenIds });
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
