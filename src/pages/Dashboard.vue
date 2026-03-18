<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Token Keeper</h1>
      <div class="header-actions">
        <button @click="showAddGroupModal = true" class="btn btn-primary">
          + New Group
        </button>
        <button @click="showAddTokenModal = true" class="btn btn-primary">
          + New Token
        </button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Groups Sidebar -->
      <div class="groups-sidebar">
        <div class="sidebar-header">
          <h2>Groups</h2>
        </div>
        <div class="groups-list">
          <div
            :class="['group-item', { active: activeGroupId === UNGROUPED_ID, 'drag-over-group': dragOverGroupId === UNGROUPED_ID }]"
            @click="selectGroup(UNGROUPED_ID)" @dragover.prevent="dragOverGroupId = UNGROUPED_ID"
            @dragleave="dragOverGroupId = null" @drop="handleGroupDrop(UNGROUPED_ID)">
            <div class="group-name">未分组</div>
            <div class="group-count">{{ getGroupTokenCount(UNGROUPED_ID) }}</div>
          </div>
          <div v-for="group in groups" :key="group.id"
            :class="['group-item', { active: activeGroupId === group.id, 'drag-over-group': dragOverGroupId === group.id }]"
            @click="selectGroup(group.id)" @dragover.prevent="dragOverGroupId = group.id"
            @dragleave="dragOverGroupId = null" @drop="handleGroupDrop(group.id)">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-count">{{ getGroupTokenCount(group.id) }}</div>
          </div>
        </div>
      </div>

      <!-- Tokens Main Area -->
      <div class="tokens-main">
        <div v-if="activeGroup" class="group-header">
          <h2>{{ activeGroup.name }}</h2>
          <div v-if="activeGroup.description" class="group-description markdown-content"
            v-html="renderMarkdown(activeGroup.description)"></div>
        </div>

        <div class="tokens-container">
          <div v-if="filteredTokens.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No tokens in this group</p>
            <button @click="showAddTokenModal = true" class="btn btn-secondary">
              Add First Token
            </button>
          </div>

          <div v-else class="tokens-list">
            <div v-if="selectedTokenIds.size > 0" class="batch-actions">
              <span>{{ selectedTokenIds.size }} selected</span>
              <button @click="addSelectedToGroup" class="btn btn-secondary">
                Add to Group
              </button>
              <button @click="clearSelection" class="btn btn-secondary">
                Clear
              </button>
            </div>
            <VueDraggable v-model="filteredTokens" class="tokens-grid" :options="dragOptions" @change="onTokenDragEnd"
              @start="onTokenDragStart" @end="onTokenDragEnd">
              <div v-for="token in filteredTokens" :key="token.id"
                :class="['token-card', { selected: selectedTokenIds.has(token.id) }]"
                @click="handleTokenClick(token, $event)" draggable="true"
                @dragstart="handleTokenDragStart($event, token)" @dragover.prevent="handleTokenDragOver"
                @drop="handleTokenDrop($event, token)">
                <div class="token-checkbox">
                  <input type="checkbox" :checked="selectedTokenIds.has(token.id)"
                    @click.stop="toggleTokenSelection(token.id)" />
                </div>
                <div class="token-content">
                  <div class="token-header">
                    <h3>{{ token.name }}</h3>
                    <div class="token-actions">
                      <button @click.stop="copyToClipboard(token.value)" class="action-btn" title="Copy token">
                        📋
                      </button>
                      <button @click.stop="selectToken(token)" class="action-btn" title="Edit token">
                        ✏️
                      </button>
                      <button @click.stop="deleteToken(token.id)" class="action-btn delete" title="Delete token">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div class="token-body">
                    <div class="token-field token-value-field">
                      <span class="label">Value:</span>
                      <div class="token-value-display">
                        <span v-if="isTokenVisible(token.id)" class="value token-visible">{{ token.value }}</span>
                        <span v-else class="value token-hidden">••••••••</span>
                        <button @click.stop="toggleTokenVisibility(token.id)" class="visibility-toggle"
                          :title="isTokenVisible(token.id) ? 'Hide' : 'Show'">
                          {{ isTokenVisible(token.id) ? '👁️' : '🙈' }}
                        </button>
                      </div>
                    </div>
                    <div v-if="token.env_name" class="token-field">
                      <span class="label">Env:</span>
                      <span class="value">{{ token.env_name }}</span>
                    </div>
                    <div v-if="token.website" class="token-field">
                      <span class="label">Website:</span>
                      <a :href="token.website" target="_blank" class="value link">
                        {{ token.website }}
                      </a>
                    </div>
                    <div v-if="token.description" class="token-field">
                      <span class="label">Description:</span>
                      <div class="value markdown-content" v-html="renderMarkdown(token.description)"></div>
                    </div>
                    <div v-if="token.tags && token.tags.length" class="token-field">
                      <span class="label">Tags:</span>
                      <div class="tags">
                        <span v-for="tag in token.tags" :key="tag" class="tag">
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="token-footer">
                    <span v-if="token.expired_at" class="expiry">
                      Expires: {{ formatDate(token.expired_at) }}
                    </span>
                  </div>
                </div>
              </div>
            </VueDraggable>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Group Select Menu for Batch Add -->
  <div v-if="showGroupSelectMenu" class="modal-overlay" @click.self="showGroupSelectMenu = false">
    <div class="modal">
      <div class="modal-header">
        <h2>Add to Group</h2>
        <button @click="showGroupSelectMenu = false" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="groups-select-list">
          <div v-for="group in groups" :key="group.id" class="group-select-item" @click="addTokensToGroup(group.id)">
            {{ group.name }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Group Modal -->
  <div v-if="showAddGroupModal" class="modal-overlay" @click.self="showAddGroupModal = false">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editingGroup ? 'Edit Group' : 'New Group' }}</h2>
        <button @click="showAddGroupModal = false" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Group Name</label>
          <input v-model="groupForm.name" type="text" placeholder="e.g., Production" />
        </div>
        <div class="form-group">
          <label>Description (Optional) - Markdown supported</label>
          <textarea v-model="groupForm.description"
            placeholder="e.g., Production environment tokens (max 100 characters)" maxlength="100" rows="3"></textarea>
          <div class="char-count">{{ groupForm.description.length }}/100</div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="showAddGroupModal = false" class="btn btn-secondary">Cancel</button>
        <button @click="saveGroup" class="btn btn-primary">
          {{ editingGroup ? 'Update' : 'Create' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Add/Edit Token Modal -->
  <div v-if="showAddTokenModal" class="modal-overlay" @click.self="showAddTokenModal = false">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editingToken ? 'Edit Token' : 'New Token' }}</h2>
        <button @click="showAddTokenModal = false" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Token Name</label>
          <input v-model="tokenForm.name" type="text" placeholder="e.g., API Key" />
        </div>
        <div class="form-group">
          <label>Token Value (Max 500 characters)</label>
          <div class="token-value-wrapper">
            <textarea v-model="tokenForm.value" :type="showTokenValue ? 'text' : 'password'"
              placeholder="Your secret token value" maxlength="500" rows="3"></textarea>
            <button type="button" @click="showTokenValue = !showTokenValue" class="toggle-visibility-btn"
              :title="showTokenValue ? 'Hide token' : 'Show token'">
              {{ showTokenValue ? '👁️' : '🙈' }}
            </button>
          </div>
          <div class="char-count">{{ tokenForm.value.length }}/500</div>
        </div>
        <div class="form-group">
          <label>Environment</label>
          <input v-model="tokenForm.env_name" type="text" placeholder="e.g., PROD_API_KEY" required />
        </div>
        <div class="form-group">
          <label>Website (Optional)</label>
          <input v-model="tokenForm.website" type="url" placeholder="https://example.com" />
        </div>
        <div class="form-group">
          <label>Description (Optional) - Markdown supported</label>
          <textarea v-model="tokenForm.description" placeholder="Token description (max 100 characters)" maxlength="100"
            rows="3"></textarea>
          <div class="char-count">{{ tokenForm.description.length }}/100</div>
        </div>
        <div class="form-group">
          <label>Tags (Optional)</label>
          <input v-model="tokenForm.tagsInput" type="text" placeholder="Separate tags with commas" />
        </div>
        <div class="form-group">
          <label>Expiry Date (Optional)</label>
          <input v-model="tokenForm.expired_at" type="date" />
        </div>
      </div>
      <div class="modal-footer">
        <button @click="showAddTokenModal = false" class="btn btn-secondary">Cancel</button>
        <button @click="saveToken" class="btn btn-primary">
          {{ editingToken ? 'Update' : 'Create' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div v-if="toast" :class="['toast', toast.type]">
    {{ toast.message }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { VueDraggable } from 'vue-draggable-plus'
import type { Group, Token } from '@/types/database'

// Configure marked for simple rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked(text) as string
}

const UNGROUPED_ID = -1 // Special ID for ungrouped tokens
const groups = ref<Group[]>([])
const tokens = ref<Token[]>([])
const activeGroupId = ref<number | null>(null)
const visibleTokenIds = ref<Set<number>>(new Set())

const showAddGroupModal = ref(false)
const showAddTokenModal = ref(false)
const showTokenValue = ref(false)
const editingGroup = ref<Group | null>(null)
const editingToken = ref<Token | null>(null)

// Multi-select and drag state
const selectedTokenIds = ref<Set<number>>(new Set())
const showGroupSelectMenu = ref(false)
const dragOverGroupId = ref<number | null>(null)
const draggedToken = ref<Token | null>(null)
const draggedFromGroupId = ref<number | null>(null)

const groupForm = ref({ name: '', description: '' })
const tokenForm = ref({
  name: '',
  value: '',
  env_name: '',
  website: '',
  description: '',
  tagsInput: '',
  expired_at: '',
})

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

const activeGroup = computed(() => {
  if (activeGroupId.value === UNGROUPED_ID) {
    return { id: UNGROUPED_ID, name: '未分组', description: '不属于任何组的 tokens' } as any
  }
  return groups.value.find((g) => g.id === activeGroupId.value)
})

const filteredTokens = computed(() => {
  if (!activeGroupId.value) return []

  if (activeGroupId.value === UNGROUPED_ID) {
    // Show tokens that don't belong to any group
    return tokens.value.filter((t) => {
      const groupIds = (t as any).group_ids || []
      return groupIds.length === 0
    })
  }

  return tokens.value.filter((t) => {
    const groupIds = (t as any).group_ids || []
    return groupIds.includes(activeGroupId.value)
  })
})

const getGroupTokenCount = (groupId: number) => {
  if (groupId === UNGROUPED_ID) {
    return tokens.value.filter((t) => {
      const groupIds = (t as any).group_ids || []
      return groupIds.length === 0
    }).length
  }

  return tokens.value.filter((t) => {
    const groupIds = (t as any).group_ids || []
    return groupIds.includes(groupId)
  }).length
}

const loadData = async () => {
  try {
    groups.value = await window.ipcRenderer.invoke('group:list')
    tokens.value = await window.ipcRenderer.invoke('token:list')

    // Default to Ungrouped if no group is selected
    if (!activeGroupId.value) {
      activeGroupId.value = UNGROUPED_ID
    }
  } catch (error) {
    showToast('Failed to load data', 'error')
    console.error(error)
  }
}

const selectGroup = (groupId: number) => {
  activeGroupId.value = groupId
}

const selectToken = (token: Token) => {
  editingToken.value = token
  tokenForm.value = {
    name: token.name,
    value: token.value,
    env_name: token.env_name || '',
    website: token.website || '',
    description: token.description || '',
    tagsInput: Array.isArray(token.tags) ? token.tags.join(', ') : '',
    expired_at: token.expired_at ? token.expired_at.split('T')[0] : '',
  }
  showAddTokenModal.value = true
}

const saveGroup = async () => {
  try {
    if (!groupForm.value.name.trim()) {
      showToast('Group name is required', 'error')
      return
    }

    if (editingGroup.value) {
      await window.ipcRenderer.invoke('group:update', editingGroup.value.id, {
        name: groupForm.value.name,
        description: groupForm.value.description,
      })
      showToast('Group updated successfully', 'success')
    } else {
      await window.ipcRenderer.invoke('group:create', {
        name: groupForm.value.name,
        description: groupForm.value.description,
      })
      showToast('Group created successfully', 'success')
    }

    showAddGroupModal.value = false
    editingGroup.value = null
    groupForm.value = { name: '', description: '' }
    await loadData()
  } catch (error) {
    showToast('Failed to save group', 'error')
    console.error(error)
  }
}

const saveToken = async () => {
  try {
    const tags = tokenForm.value.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)

    const tokenPayload = {
      name: tokenForm.value.name,
      value: tokenForm.value.value,
      env_name: tokenForm.value.env_name,
      website: tokenForm.value.website || undefined,
      description: tokenForm.value.description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      expired_at: tokenForm.value.expired_at || undefined,
    }

    // Validate using Zod schema (this will be done on backend, but we can add client-side validation too)
    if (!tokenPayload.name.trim() || !tokenPayload.value.trim() || !tokenPayload.env_name.trim()) {
      showToast('Token name, value, and environment are required', 'error')
      return
    }

    if (editingToken.value) {
      await window.ipcRenderer.invoke('token:update', editingToken.value.id, tokenPayload)
      showToast('Token updated successfully', 'success')
    } else {
      const newToken = await window.ipcRenderer.invoke('token:create', tokenPayload)

      // Associate token with current group if one is selected (but not with the virtual "Ungrouped")
      if (activeGroupId.value && activeGroupId.value !== UNGROUPED_ID && newToken?.id) {
        await window.ipcRenderer.invoke('groupToken:add', activeGroupId.value, newToken.id)
      }

      showToast('Token created successfully', 'success')
    }

    showAddTokenModal.value = false
    editingToken.value = null
    tokenForm.value = {
      name: '',
      value: '',
      env_name: '',
      website: '',
      description: '',
      tagsInput: '',
      expired_at: '',
    }
    await loadData()
  } catch (error) {
    showToast('Failed to save token', 'error')
    console.error(error)
  }
}

const deleteToken = async (tokenId: number) => {
  if (!confirm('Are you sure you want to delete this token?')) return

  try {
    await window.ipcRenderer.invoke('token:delete', tokenId)
    showToast('Token deleted successfully', 'success')
    await loadData()
  } catch (error) {
    showToast('Failed to delete token', 'error')
    console.error(error)
  }
}

const toggleTokenVisibility = (tokenId: number) => {
  if (visibleTokenIds.value.has(tokenId)) {
    visibleTokenIds.value.delete(tokenId)
  } else {
    visibleTokenIds.value.add(tokenId)
  }
}

const isTokenVisible = (tokenId: number) => {
  return visibleTokenIds.value.has(tokenId)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard', 'success')
  } catch (error) {
    showToast('Failed to copy', 'error')
  }
}

// Multi-select and drag functions
const toggleTokenSelection = (tokenId: number) => {
  if (selectedTokenIds.value.has(tokenId)) {
    selectedTokenIds.value.delete(tokenId)
  } else {
    selectedTokenIds.value.add(tokenId)
  }
}

const handleTokenClick = (token: Token, event: MouseEvent) => {
  if ((event.target as HTMLElement).closest('.token-checkbox')) {
    return
  }
  if ((event.target as HTMLElement).closest('.token-actions')) {
    return
  }
  selectToken(token)
}

const clearSelection = () => {
  selectedTokenIds.value.clear()
}

const addSelectedToGroup = () => {
  if (selectedTokenIds.value.size === 0) return
  showGroupSelectMenu.value = true
}

const addTokensToGroup = async (groupId: number) => {
  try {
    const selectedIds = Array.from(selectedTokenIds.value)

    for (const tokenId of selectedIds) {
      // Check if token is already in this group
      const token = tokens.value.find(t => t.id === tokenId)
      if (token) {
        const groupIds = (token as any).group_ids || []
        if (!groupIds.includes(groupId)) {
          await window.ipcRenderer.invoke('groupToken:add', groupId, tokenId)
        }
      }
    }

    showToast(`Added ${selectedIds.length} token(s) to group`, 'success')
    selectedTokenIds.value.clear()
    showGroupSelectMenu.value = false
    await loadData()
  } catch (error) {
    showToast('Failed to add tokens to group', 'error')
    console.error(error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const showToast = (message: string, type: 'success' | 'error') => {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

const dragOptions = {
  animation: 200,
  group: 'tokens',
  disabled: false,
  ghostClass: 'ghost',
}

const handleTokenDragStart = (event: DragEvent, token: Token) => {
  draggedToken.value = token
  draggedFromGroupId.value = activeGroupId.value
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('tokenId', token.id.toString())
  }
}

const handleTokenDragOver = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleTokenDrop = async (event: DragEvent, targetToken: Token) => {
  event.preventDefault()
  event.stopPropagation()

  if (!draggedToken.value) return

  // 如果拖拽到同一个 token，不做任何操作
  if (draggedToken.value.id === targetToken.id) {
    draggedToken.value = null
    draggedFromGroupId.value = null
    return
  }

  // 获取拖拽的 token 在当前列表中的索引
  const draggedIndex = filteredTokens.value.findIndex(t => t.id === draggedToken.value!.id)
  const targetIndex = filteredTokens.value.findIndex(t => t.id === targetToken.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedToken.value = null
    draggedFromGroupId.value = null
    return
  }

  // 交换位置
  const temp = filteredTokens.value[draggedIndex]
  filteredTokens.value[draggedIndex] = filteredTokens.value[targetIndex]
  filteredTokens.value[targetIndex] = temp

  // 保存新的排序到后端
  try {
    const tokenIds = filteredTokens.value.map(t => t.id)
    await window.ipcRenderer.invoke('order:reorderTokens', tokenIds)
    showToast('Token order updated', 'success')
  } catch (error) {
    showToast('Failed to update token order', 'error')
    console.error(error)
  }

  draggedToken.value = null
  draggedFromGroupId.value = null
}

const handleGroupDrop = async (targetGroupId: number) => {
  dragOverGroupId.value = null

  if (!draggedToken.value) return

  // 如果拖拽到同一个分组，不做任何操作
  if (draggedFromGroupId.value === targetGroupId) {
    draggedToken.value = null
    draggedFromGroupId.value = null
    return
  }

  try {
    const tokenId = draggedToken.value.id
    const token = tokens.value.find(t => t.id === tokenId)

    if (!token) {
      draggedToken.value = null
      draggedFromGroupId.value = null
      return
    }

    const groupIds = (token as any).group_ids || []

    // 如果目标是未分组，则移除所有分组
    if (targetGroupId === UNGROUPED_ID) {
      // 从所有分组中移除该 token
      for (const groupId of groupIds) {
        await window.ipcRenderer.invoke('groupToken:remove', groupId, tokenId)
      }
      showToast('Token moved to ungrouped', 'success')
    } else {
      // 如果 token 还不在目标分组中，添加到目标分组
      if (!groupIds.includes(targetGroupId)) {
        await window.ipcRenderer.invoke('groupToken:add', targetGroupId, tokenId)
        showToast('Token added to group', 'success')
      } else {
        showToast('Token already in this group', 'error')
      }
    }

    await loadData()
  } catch (error) {
    showToast('Failed to move token to group', 'error')
    console.error(error)
  }

  draggedToken.value = null
  draggedFromGroupId.value = null
}

const onTokenDragStart = () => {
  // VueDraggable 开始拖拽
}

const onTokenDragEnd = async () => {
  // Token order changed, could save to backend if needed
  console.log('Token order changed')
}

onMounted(() => {
  loadData()
})

</script>

<style scoped>
.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.dashboard-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.groups-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.groups-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.group-item {
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  background-color: #f9f9f9;
}

.group-item:hover {
  background-color: #f0f0f0;
}

.group-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.group-name {
  font-weight: 500;
  font-size: 14px;
}

.group-count {
  font-size: 12px;
  opacity: 0.7;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.group-item.active .group-count {
  background-color: rgba(255, 255, 255, 0.3);
}

.group-item.drag-over-group {
  background-color: #f0f4ff;
  border: 2px solid #667eea;
  box-shadow: inset 0 0 0 1px #667eea;
}

.tokens-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.group-header {
  background: white;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.group-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.group-description {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.tokens-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f4ff;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
  border-radius: 4px;
}

.batch-actions span {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.token-checkbox {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.token-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.token-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  gap: 12px;
}

.token-card.selected {
  background: #f0f4ff;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.token-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.token-card.sortable-ghost {
  opacity: 0.5;
  background: #f5f5f5;
}

.token-card.sortable-drag {
  opacity: 1;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.token-card.drag-over {
  border-color: #667eea;
  background-color: #f0f4ff;
  box-shadow: inset 0 0 0 2px #667eea;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.token-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  word-break: break-word;
}

.token-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f0f0f0;
}

.action-btn.delete:hover {
  background-color: #fee;
}

.token-body {
  margin-bottom: 12px;
}

.token-field {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.token-field .label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.token-field .value {
  color: #333;
  word-break: break-all;
}

.token-field .link {
  color: #667eea;
  text-decoration: none;
}

.token-field .link:hover {
  text-decoration: underline;
}

/* Token Value Display */
.token-value-field {
  position: relative;
}

.token-value-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.token-visible {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.token-hidden {
  font-size: 14px;
  letter-spacing: 2px;
  color: #999;
}

.visibility-toggle {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.visibility-toggle:hover {
  background-color: #f0f0f0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background-color: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.token-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}

.expiry {
  display: inline-block;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Token Value Input Wrapper */
.token-value-wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.token-value-wrapper textarea {
  flex: 1;
}

.toggle-visibility-btn {
  background: none;
  border: 1px solid #ddd;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-top: 1px;
  flex-shrink: 0;
}

.toggle-visibility-btn:hover {
  background-color: #f5f5f5;
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

/* Button Styles */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background-color: #e9ecef;
  color: #333;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background-color: #dee2e6;
}

/* Group Select Menu */
.groups-select-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-select-item {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.group-select-item:hover {
  background: #f0f4ff;
  border-color: #667eea;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
  z-index: 2000;
}

.toast.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Scrollbar Styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Markdown Content Styles */
.markdown-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.markdown-content p {
  margin: 0;
  display: inline;
}

.markdown-content strong {
  font-weight: 600;
  color: #333;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.markdown-content a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid #667eea;
}

.markdown-content a:hover {
  color: #764ba2;
  border-bottom-color: #764ba2;
}

/* Character Count */
.char-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

@media (max-width: 768px) {
  .dashboard-content {
    flex-direction: column;
  }

  .groups-sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .tokens-grid {
    grid-template-columns: 1fr;
  }
}
</style>
