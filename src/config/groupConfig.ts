import Store from 'electron-store'

interface GroupConfigSchema {
  activeGroupId: number | null
}

const store = new Store<GroupConfigSchema>({
  name: 'group-config',
  defaults: {
    activeGroupId: null,
  },
})

export function initializeGroupConfig() {
  // Initialize with defaults if not already set
  if (store.get('activeGroupId') === undefined) {
    store.set('activeGroupId', null)
  }
}

export function getActiveGroupId(): number | null {
  return store.get('activeGroupId') || null
}

export function setActiveGroupId(groupId: number | null) {
  store.set('activeGroupId', groupId)
}

export function getGroupConfig() {
  return {
    activeGroupId: getActiveGroupId(),
  }
}
