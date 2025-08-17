<script setup lang="ts">
import { ref } from 'vue'
import CryptoJS from 'crypto-js'

const isLoading = ref(false)

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
    const fullScope = `${scope} openid profile email`
    const loginUrl = `${auth_url}?client_id=${app_id}&redirect_uri=${callback_url}&response_type=code&code_challenge_method=S256&code_challenge=${code_challenge}&scope=${encodeURIComponent(fullScope)}&prompt=select_account`
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

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="title">FAMIS</h1>
      <p class="subtitle">Financial Aid & Management Information System</p>

      <button @click="handleLogin" class="auth-btn" :disabled="isLoading">
        <div v-if="isLoading" class="loading-spinner"></div>
        <span v-else>Sign in with CMU Account</span>
      </button>
    </div>
  </div>
</template>

<style scoped>

.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #a894bf; 
  padding: 20px;
}

.auth-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 20px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #4b2e83; 
  margin-bottom: 6px;
}

.subtitle {
  font-size: 15px;
  color: #666;
  margin-bottom: 28px;
}

.auth-btn {
  width: 100%;
  min-height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #6b4ba1; 
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.25s;
}

.auth-btn:hover:not(:disabled) {
  background: #5a3d8b; 
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
