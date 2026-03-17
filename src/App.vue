<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dashboard from './pages/Dashboard.vue'
import KeychainAuthGuide from './pages/KeychainAuthGuide.vue'
import { useEncryption } from './composables/useEncryption'

const { getStatus } = useEncryption()
const showKeychainGuide = ref(false)

onMounted(async () => {
  try {
    const status = await getStatus()
    if (!status.initialized) {
      showKeychainGuide.value = true
    }
  } catch (error) {
    console.error('Failed to check encryption status:', error)
    showKeychainGuide.value = true
  }
})
</script>

<template>
  <KeychainAuthGuide v-if="showKeychainGuide" />
  <Dashboard v-else />
</template>
