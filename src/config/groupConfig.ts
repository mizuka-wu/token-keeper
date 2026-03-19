import Store from "electron-store";

interface GroupConfigSchema {
  activeGroupUuid: string | null;
  activeGroupId: number | null;
}

const store = new Store<GroupConfigSchema>({
  name: "group-config",
  defaults: {
    activeGroupUuid: null,
    activeGroupId: null,
  },
});

export function initializeGroupConfig() {
  // Initialize with defaults if not already set
  if (store.get("activeGroupUuid") === undefined) {
    store.set("activeGroupUuid", null);
  }
  if (store.get("activeGroupId") === undefined) {
    store.set("activeGroupId", null);
  }
}

export function getActiveGroupUuid(): string | null {
  return store.get("activeGroupUuid") || null;
}

export function setActiveGroupUuid(groupUuid: string | null) {
  store.set("activeGroupUuid", groupUuid);
}

export function getActiveGroupId(): number | null {
  return store.get("activeGroupId") || null;
}

export function setActiveGroupId(groupId: number | null) {
  store.set("activeGroupId", groupId);
}

export function clearActiveGroup() {
  store.set("activeGroupUuid", null);
  store.set("activeGroupId", null);
}

export function getGroupConfig() {
  return {
    activeGroupUuid: getActiveGroupUuid(),
    activeGroupId: getActiveGroupId(),
  };
}
