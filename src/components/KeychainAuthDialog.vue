<template>
  <div v-if="isVisible" class="keychain-auth-overlay">
    <div class="keychain-auth-dialog">
      <div class="dialog-header">
        <h2>🔐 Keychain Authorization Required</h2>
      </div>

      <div class="dialog-content">
        <p class="description">
          To securely store your encryption key, this app needs access to your system keychain.
        </p>

        <div class="info-box">
          <h3>Why is this needed?</h3>
          <ul>
            <li>Your encryption master key will be protected by your system keychain</li>
            <li>Only you can access your tokens with your system credentials</li>
            <li>Maximum security for your sensitive data</li>
          </ul>
        </div>

        <div v-if="retryMessage" :class="['message', retryMessage.type]">
          {{ retryMessage.text }}
        </div>
      </div>

      <div class="dialog-actions">
        <button
          @click="handleRetryAuth"
          :disabled="isLoading"
          class="btn btn-primary"
        >
          <span v-if="!isLoading">🔄 Retry Authorization</span>
          <span v-else>Retrying...</span>
        </button>

        <button
          @click="handleUseLocalStorage"
          :disabled="isLoading"
          class="btn btn-secondary"
        >
          Use Local Storage (Temporary)
        </button>
      </div>

      <div class="dialog-footer">
        <p class="footer-text">
          You can enable keychain access later in system settings or by restarting the app.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEncryption, type AuthResult } from '@/composables/useEncryption'

interface RetryMessage {
  type: 'success' | 'error'
  text: string
}

const { retryKeychainAuth, useLocalStorageTemporarily } = useEncryption()

const isVisible = ref(true)
const isLoading = ref(false)
const retryMessage = ref<RetryMessage | null>(null)

const handleRetryAuth = async () => {
  isLoading.value = true
  retryMessage.value = null

  try {
    const result: AuthResult = await retryKeychainAuth()

    if (result.success) {
      retryMessage.value = {
        type: 'success',
        text: '✅ Keychain authorization successful! Reloading...',
      }
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      retryMessage.value = {
        type: 'error',
        text: `❌ ${result.message}`,
      }
    }
  } catch (error) {
    retryMessage.value = {
      type: 'error',
      text: `❌ Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  } finally {
    isLoading.value = false
  }
}

const handleUseLocalStorage = async () => {
  isLoading.value = true
  retryMessage.value = null

  try {
    const result: AuthResult = await useLocalStorageTemporarily()

    if (result.success) {
      retryMessage.value = {
        type: 'success',
        text: '⚠️ Using local storage temporarily. Reloading...',
      }
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      retryMessage.value = {
        type: 'error',
        text: `❌ ${result.message}`,
      }
    }
  } catch (error) {
    retryMessage.value = {
      type: 'error',
      text: `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.keychain-auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.keychain-auth-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.dialog-content {
  padding: 24px;
}

.description {
  margin: 0 0 16px 0;
  color: #333;
  line-height: 1.6;
  font-size: 14px;
}

.info-box {
  background-color: #f5f5f5;
  border-left: 4px solid #667eea;
  padding: 16px;
  border-radius: 4px;
  margin: 16px 0;
}

.info-box h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.info-box li {
  margin: 4px 0;
}

.message {
  padding: 12px;
  border-radius: 4px;
  margin: 16px 0;
  font-size: 13px;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px 24px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background-color: #e9ecef;
  color: #333;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #dee2e6;
  transform: translateY(-2px);
}

.dialog-footer {
  background-color: #f9f9f9;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
}

.footer-text {
  margin: 0;
  font-size: 12px;
  color: #666;
  text-align: center;
  line-height: 1.5;
}
</style>
