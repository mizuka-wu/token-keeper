<template>
  <div v-if="status" class="encryption-status">
    <div :class="['status-badge', status.useKeychain ? 'secure' : 'fallback']">
      <span class="status-icon">{{ status.useKeychain ? '🔒' : '⚠️' }}</span>
      <span class="status-text">{{ status.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEncryption, type EncryptionStatus } from '@/composables/useEncryption'

const { getStatus } = useEncryption()
const status = ref<EncryptionStatus | null>(null)

onMounted(async () => {
  try {
    status.value = await getStatus()
  } catch (error) {
    console.error('Failed to get encryption status:', error)
  }
})
</script>

<style scoped>
.encryption-status {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 3px;
}

.status-badge.secure {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.fallback {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-icon {
  font-size: 14px;
}

.status-text {
  font-weight: 500;
}
</style>
