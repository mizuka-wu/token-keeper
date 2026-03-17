<template>
  <div class="keychain-guide-container">
    <div class="guide-content">
      <!-- Step 1: Introduction -->
      <div v-if="currentStep === 1" class="step-section">
        <div class="step-header">
          <div class="step-number">1</div>
          <h1>Security Setup Required</h1>
        </div>

        <div class="step-body">
          <div class="icon-large">🔐</div>
          <p class="description">
            Token Keeper needs to secure your encryption key using your system keychain.
          </p>

          <div class="benefits-list">
            <h3>Why Keychain?</h3>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Your master key is protected by your system credentials</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Only you can decrypt your tokens</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Military-grade encryption for all token values</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Automatic protection on system sleep/lock</span>
            </div>
          </div>

          <button @click="goToStep(2)" class="btn btn-primary btn-large">
            Continue to Authorization
          </button>
        </div>
      </div>

      <!-- Step 2: Authorization Instructions -->
      <div v-if="currentStep === 2" class="step-section">
        <div class="step-header">
          <div class="step-number">2</div>
          <h1>Grant Keychain Access</h1>
        </div>

        <div class="step-body">
          <div class="instruction-box">
            <h3>What will happen next:</h3>
            <ol class="instruction-steps">
              <li>Click the "Authorize Now" button below</li>
              <li>Your system will prompt for keychain access</li>
              <li>
                <strong>Important:</strong> Click "Always Allow" to grant permanent access
              </li>
              <li>The app will automatically continue after authorization</li>
            </ol>
          </div>

          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>Do not click "Deny"</strong> - The app requires keychain access to
              function properly. You can change this in System Settings later if needed.
            </div>
          </div>

          <div v-if="authError" class="error-box">
            <span class="error-icon">❌</span>
            <div>
              <strong>Authorization Failed:</strong> {{ authError }}
            </div>
          </div>

          <div class="button-group">
            <button
              @click="handleAuthorize"
              :disabled="isAuthorizingStep2"
              class="btn btn-primary btn-large"
            >
              <span v-if="!isAuthorizingStep2">🔑 Authorize Now</span>
              <span v-else>Waiting for authorization...</span>
            </button>
            <button @click="goToStep(1)" class="btn btn-secondary">Back</button>
          </div>
        </div>
      </div>

      <!-- Step 3: Verification -->
      <div v-if="currentStep === 3" class="step-section">
        <div class="step-header">
          <div class="step-number">3</div>
          <h1>Verifying Authorization</h1>
        </div>

        <div class="step-body">
          <div class="verification-box">
            <div class="spinner"></div>
            <p>Checking keychain access...</p>
          </div>
        </div>
      </div>

      <!-- Step 4: Success -->
      <div v-if="currentStep === 4" class="step-section">
        <div class="step-header success">
          <div class="step-number success">✓</div>
          <h1>Authorization Complete!</h1>
        </div>

        <div class="step-body">
          <div class="success-box">
            <div class="success-icon">🎉</div>
            <p>Your encryption key is now securely stored in your system keychain.</p>
            <p class="secondary-text">Launching Token Keeper...</p>
          </div>
        </div>
      </div>

      <!-- Step 5: Fallback Option -->
      <div v-if="currentStep === 5" class="step-section">
        <div class="step-header">
          <div class="step-number">⚙️</div>
          <h1>Authorization Required</h1>
        </div>

        <div class="step-body">
          <div class="error-box large">
            <span class="error-icon">❌</span>
            <div>
              <strong>Keychain authorization is required to use Token Keeper.</strong>
              <p>
                Without keychain access, your tokens cannot be securely encrypted and stored.
              </p>
            </div>
          </div>

          <div class="instruction-box">
            <h3>To enable keychain access:</h3>
            <ol class="instruction-steps">
              <li>Open System Settings / System Preferences</li>
              <li>Go to Security & Privacy → Keychain</li>
              <li>Find "Token Keeper" and click "Always Allow"</li>
              <li>Restart the application</li>
            </ol>
          </div>

          <div class="button-group">
            <button @click="handleRetryAuth" class="btn btn-primary btn-large">
              🔄 Retry Authorization
            </button>
            <button @click="openSystemSettings" class="btn btn-secondary">
              Open System Settings
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-indicator">
      <div
        v-for="step in [1, 2, 3, 4]"
        :key="step"
        :class="['progress-dot', { active: currentStep >= step, current: currentStep === step }]"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEncryption } from '@/composables/useEncryption'

const { retryKeychainAuth } = useEncryption()

const currentStep = ref(1)
const isAuthorizingStep2 = ref(false)
const authError = ref('')

const goToStep = (step: number) => {
  authError.value = ''
  currentStep.value = step
}

const handleAuthorize = async () => {
  isAuthorizingStep2.value = true
  authError.value = ''

  try {
    currentStep.value = 3

    const result = await retryKeychainAuth()

    if (result.success) {
      currentStep.value = 4
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      currentStep.value = 5
      authError.value = result.message
    }
  } catch (error) {
    currentStep.value = 5
    authError.value = error instanceof Error ? error.message : 'Unknown error occurred'
  } finally {
    isAuthorizingStep2.value = false
  }
}

const handleRetryAuth = async () => {
  currentStep.value = 2
  authError.value = ''
}

const openSystemSettings = () => {
  window.ipcRenderer.send('open-system-settings')
}

onMounted(() => {
  currentStep.value = 1
})
</script>

<style scoped>
.keychain-guide-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

.guide-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  padding: 60px 40px 40px;
  position: relative;
  min-height: 500px;
}

.step-section {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  flex-shrink: 0;
}

.step-number.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  font-size: 24px;
}

.step-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.icon-large {
  font-size: 64px;
  text-align: center;
  margin: 20px 0;
}

.description {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.benefits-list {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.benefits-list h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  font-size: 14px;
  color: #555;
}

.benefit-icon {
  color: #11998e;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.instruction-box {
  background-color: #f0f4ff;
  border-left: 4px solid #667eea;
  padding: 20px;
  border-radius: 4px;
}

.instruction-box h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.instruction-steps {
  margin: 0;
  padding-left: 20px;
  color: #555;
  font-size: 14px;
  line-height: 1.8;
}

.instruction-steps li {
  margin: 8px 0;
}

.warning-box {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-box div {
  font-size: 13px;
  color: #856404;
  line-height: 1.6;
}

.warning-box strong {
  color: #721c24;
}

.error-box {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.error-box.large {
  padding: 24px;
  flex-direction: column;
  text-align: center;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-box div {
  font-size: 13px;
  color: #721c24;
  line-height: 1.6;
}

.error-box strong {
  color: #721c24;
}

.error-box p {
  margin: 8px 0 0 0;
}

.verification-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.verification-box p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.success-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
}

.success-icon {
  font-size: 64px;
}

.success-box p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.success-box .secondary-text {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140px;
}

.btn-large {
  padding: 14px 32px;
  font-size: 15px;
  min-height: 48px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.progress-indicator {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 40px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background-color: rgba(255, 255, 255, 0.8);
}

.progress-dot.current {
  background-color: white;
  width: 24px;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .guide-content {
    padding: 40px 24px 24px;
  }

  .step-header {
    flex-direction: column;
    text-align: center;
  }

  .step-header h1 {
    font-size: 24px;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    min-width: unset;
  }
}
</style>
