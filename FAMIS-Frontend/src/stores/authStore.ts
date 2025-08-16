import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(sessionStorage.getItem('access_token'))
  const userInfo = ref<any>(null)

  // Try to parse user info from session storage
  const storedUserInfo = sessionStorage.getItem('user_info')
  if (storedUserInfo) {
    try {
      userInfo.value = JSON.parse(storedUserInfo)
    } catch (error) {
      console.error('Failed to parse user info:', error)
    }
  }

  const isAuthenticated = computed(() => !!accessToken.value)

  const setAccessToken = (token: string) => {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  const setUserInfo = (user: any) => {
    userInfo.value = user
    sessionStorage.setItem('user_info', JSON.stringify(user))
  }

  const logout = () => {
    accessToken.value = null
    userInfo.value = null
    // Remove only auth-related keys to avoid nuking other app states
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user_info')
    sessionStorage.removeItem('code_verifier')
  }

  const checkAuth = () => {
    const token = sessionStorage.getItem('access_token')
    if (token) {
      accessToken.value = token
      return true
    }
    return false
  }

  return {
    accessToken,
    userInfo,
    isAuthenticated,
    setAccessToken,
    setUserInfo,
    logout,
    checkAuth
  }
}) 