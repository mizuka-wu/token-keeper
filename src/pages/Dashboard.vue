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
            v-for="group in groups"
            :key="group.id"
            :class="['group-item', { active: activeGroupId === group.id }]"
            @click="selectGroup(group.id)"
          >
            <div class="group-name">{{ group.name }}</div>
            <div class="group-count">{{ getGroupTokenCount(group.id) }}</div>
          </div>
        </div>
      </div>

      <!-- Tokens Main Area -->
      <div class="tokens-main">
        <div v-if="activeGroup" class="group-header">
          <h2>{{ activeGroup.name }}</h2>
          <p v-if="activeGroup.description" class="group-description">
            {{ activeGroup.description }}
          </p>
        </div>

        <div class="tokens-container">
          <div v-if="filteredTokens.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No tokens in this group</p>
            <button @click="showAddTokenModal = true" class="btn btn-secondary">
              Add First Token
            </button>
          </div>

          <div v-else class="tokens-grid">
            <div
              v-for="token in filteredTokens"
              :key="token.id"
              class="token-card"
              @click="selectToken(token)"
            >
              <div class="token-header">
                <h3>{{ token.name }}</h3>
                <div class="token-actions">
                  <button
                    @click.stop="copyToClipboard(token.value)"
                    class="action-btn"
                    title="Copy token"
                  >
                    📋
                  </button>
                  <button
                    @click.stop="selectToken(token)"
                    class="action-btn"
                    title="Edit token"
                  >
                    ✏️
                  </button>
                  <button
                    @click.stop="deleteToken(token.id)"
                    class="action-btn delete"
                    title="Delete token"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div class="token-body">
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
                  <span class="value">{{ token.description }}</span>
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
            <label>Description (Optional)</label>
            <textarea
              v-model="groupForm.description"
              placeholder="e.g., Production environment tokens"
            ></textarea>
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
            <label>Token Value</label>
            <textarea
              v-model="tokenForm.value"
              placeholder="Your secret token value"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>Environment (Optional)</label>
            <input v-model="tokenForm.env_name" type="text" placeholder="e.g., PROD_API_KEY" />
          </div>
          <div class="form-group">
            <label>Website (Optional)</label>
            <input v-model="tokenForm.website" type="url" placeholder="https://example.com" />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea v-model="tokenForm.description" placeholder="Token description"></textarea>
          </div>
          <div class="form-group">
            <label>Tags (Optional)</label>
            <input
              v-model="tokenForm.tagsInput"
              type="text"
              placeholder="Separate tags with commas"
            />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Group, Token } from '@/types/database'

const groups = ref<Group[]>([])
const tokens = ref<Token[]>([])
const activeGroupId = ref<number | null>(null)

const showAddGroupModal = ref(false)
const showAddTokenModal = ref(false)
const editingGroup = ref<Group | null>(null)
const editingToken = ref<Token | null>(null)

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

const activeGroup = computed(() => groups.value.find((g) => g.id === activeGroupId.value))

const filteredTokens = computed(() => {
  if (!activeGroupId.value) return []
  return tokens.value.filter((t) => {
    const groups = (t as any).group_ids || []
    return groups.includes(activeGroupId.value)
  })
})

const getGroupTokenCount = (groupId: number) => {
  return tokens.value.filter((t) => {
    const groups = (t as any).group_ids || []
    return groups.includes(groupId)
  }).length
}

const loadData = async () => {
  try {
    groups.value = await window.ipcRenderer.invoke('group:list')
    tokens.value = await window.ipcRenderer.invoke('token:list')

    if (groups.value.length > 0 && !activeGroupId.value) {
      activeGroupId.value = groups.value[0].id
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
      await window.ipcRenderer.invoke('group:create', groupForm.value.name, groupForm.value.description)
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
    if (!tokenForm.value.name.trim() || !tokenForm.value.value.trim()) {
      showToast('Token name and value are required', 'error')
      return
    }

    const tags = tokenForm.value.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)

    if (editingToken.value) {
      await window.ipcRenderer.invoke('token:update', editingToken.value.id, {
        name: tokenForm.value.name,
        value: tokenForm.value.value,
        env_name: tokenForm.value.env_name || undefined,
        website: tokenForm.value.website || undefined,
        description: tokenForm.value.description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        expired_at: tokenForm.value.expired_at || undefined,
      })
      showToast('Token updated successfully', 'success')
    } else {
      await window.ipcRenderer.invoke('token:create', {
        name: tokenForm.value.name,
        value: tokenForm.value.value,
        env_name: tokenForm.value.env_name || undefined,
        website: tokenForm.value.website || undefined,
        description: tokenForm.value.description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        expired_at: tokenForm.value.expired_at || undefined,
      })
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard', 'success')
  } catch (error) {
    showToast('Failed to copy', 'error')
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

.token-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
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
