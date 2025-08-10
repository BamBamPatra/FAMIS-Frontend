<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Welcome to FAMIS</h1>
        <p>Please sign in to continue</p>
      </div>
      
      <div class="login-content">
        <div class="cmu-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <button @click="handleLogin" class="login-btn" :disabled="isLoading">
          <div v-if="isLoading" class="loading-spinner"></div>
          <span v-else>Sign in with CMU Account</span>
        </button>
        
        <button @click="handleLogout" class="logout-btn">
          Clear Session & Sign In Again
        </button>
        
        <div class="login-info">
          <p>This application uses CMU Single Sign-On (SSO) for secure authentication.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CryptoJS from 'crypto-js'

const isLoading = ref(false)

// Browser-compatible PKCE code verifier generation
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const handleLogin = async () => {
  isLoading.value = true
  
  try {
    const auth_url = import.meta.env.VITE_AUTH_URL
    const app_id = import.meta.env.VITE_APP_ID
    const callback_url = import.meta.env.VITE_CALLBACK_URL
    const scope = import.meta.env.VITE_SCOPE

    console.log('🔍 Login Debug Info:')
    console.log('auth_url:', auth_url)
    console.log('app_id:', app_id)
    console.log('callback_url:', callback_url)
    console.log('scope:', scope)

    // Ensure local session is cleared before starting a new login
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user_info')

    const code_verifier = generateCodeVerifier()
    sessionStorage.setItem('code_verifier', code_verifier)

    const code_challenge = CryptoJS.SHA256(code_verifier)
      .toString(CryptoJS.enc.Base64)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Redirect directly to authorization endpoint
    const loginUrl = `${auth_url}?client_id=${app_id}&redirect_uri=${callback_url}&response_type=code&code_challenge_method=S256&code_challenge=${code_challenge}&scope=${scope}&prompt=select_account`
    window.location.href = loginUrl
    
  } catch (error) {
    console.error('Login error:', error)
    isLoading.value = false
  }
}

const handleLogout = () => {
  const logoutUrl = import.meta.env.VITE_LOGOUT_URL
  window.location.href = logoutUrl
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 48px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.cmu-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #8A63B8, #9B7EBD);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.cmu-logo svg {
  width: 32px;
  height: 32px;
  color: white;
}

.login-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #8A63B8, #9B7EBD);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 56px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 99, 184, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.logout-btn {
  width: 100%;
  padding: 12px 24px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.logout-btn:hover {
  background: #ff3742;
  transform: translateY(-1px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-info {
  margin-top: 16px;
}

.login-info p {
  font-size: 14px;
  color: #888;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
}
</style> 