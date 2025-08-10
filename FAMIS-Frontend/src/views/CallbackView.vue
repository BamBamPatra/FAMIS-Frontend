<template>
  <div class="callback-container">
    <div class="callback-card">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h2>Authenticating...</h2>
        <p>Please wait while we complete your sign-in</p>
      </div>
      
      <div v-if="error" class="error-content">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2>Authentication Failed</h2>
        <p>{{ error }}</p>
        <button @click="retryLogin" class="retry-btn">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

const getAccessToken = async () => {
  try {
    const options = {
      method: 'POST',
      url: import.meta.env.VITE_TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: {
        client_id: import.meta.env.VITE_APP_ID,
        scope: import.meta.env.VITE_SCOPE,
        code: route.query.code,
        redirect_uri: import.meta.env.VITE_CALLBACK_URL,
        grant_type: 'authorization_code',
        code_verifier: sessionStorage.getItem('code_verifier')
      }
    }
    
    const { data } = await axios.request(options)
    
    // Store access token and user info in auth store
    authStore.setAccessToken(data.access_token)
    
    if (data.user) {
      authStore.setUserInfo(data.user)
    }
    
    // Redirect to main application
    router.push('/')
    // Clean up PKCE verifier after successful exchange
    sessionStorage.removeItem('code_verifier')
    
  } catch (err: any) {
    console.error('Token exchange error:', err)
    error.value = err.response?.data?.error_description || 'Authentication failed. Please try again.'
    loading.value = false
  }
}

const retryLogin = () => {
  error.value = ''
  loading.value = true
  router.push('/login')
}

onMounted(async () => {
  if (route.query.code) {
    await getAccessToken()
  } else {
    error.value = 'No authorization code received'
    loading.value = false
  }
})
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(138, 99, 184, 0.2);
  border-top: 4px solid #8A63B8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loading-content p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error-icon {
  width: 64px;
  height: 64px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.error-content h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.error-content p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.retry-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #8A63B8, #9B7EBD);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(138, 99, 184, 0.3);
}

@media (max-width: 480px) {
  .callback-card {
    padding: 32px 24px;
  }
  
  .loading-content h2,
  .error-content h2 {
    font-size: 20px;
  }
}
</style> 