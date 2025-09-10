<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import api from '@/service/ExtractKey'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

const decodeIdToken = (idToken: string): any | null => {
  try {
    const base64Url = idToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

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
    
    // Store access token first (for subsequent calls if needed)
    authStore.setAccessToken(data.access_token)
    const basicInfoUrl = import.meta.env.VITE_BASICINFO_URL
    let basicInfo: any | null = null

    // Try to extract email from id_token claims first
    let email: string | undefined
    let department: string | undefined
    let tokenClaims: any = {}
    if (data.id_token) {
      const claims = decodeIdToken(data.id_token) || {}
      tokenClaims = claims
      email = claims.email || claims.preferred_username || claims.upn || claims.unique_name
      // Prefer organization_name_EN for department when available
      department = department || claims.organization_name_EN || claims.organization_name_TH || claims.organization || claims.organization_en || claims.organization_th
      console.log('[DEBUG] id_token claims:', claims)
    }
    // Fallbacks from token response props if any
    email = email || (data.user && data.user.email) || data.preferred_username || data.upn

    if (!email) {
      // Try CMU Basic Info API if configured
      if (basicInfoUrl) {
        const basic = await axios.get(basicInfoUrl, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })
        const b = basic.data || {}
        basicInfo = b
        email = b.email || b.contact?.email || b.cmuitaccount?.email || b.username || b.contact?.cmuitaccount
        // Prefer organization_name_EN for department from Basic Info when available
        department = b.organization_name_EN || b.org?.organization_name_EN || b.department || b.org?.department || b.organization || undefined
        console.log('[DEBUG] basic info:', b)
      }
    }

    // Always attempt to fetch Basic Info (for logging/normalization) if not already fetched
    if (!basicInfo && basicInfoUrl) {
      try {
        const basic = await axios.get(basicInfoUrl, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })
        basicInfo = basic.data || null
        if (basicInfo) {
          console.log('[DEBUG] basic info:', basicInfo)
          if (!department) {
            department = basicInfo.organization_name_EN || basicInfo.org?.organization_name_EN || basicInfo.department || basicInfo.org?.department || basicInfo.organization || undefined
          }
        }
      } catch (e) {
        console.warn('Basic info fetch failed:', e)
      }
    }

    if (!email) {
      // Fallback: ask user to re-login with prompt=select_account
      throw new Error('No email found from token or profile')
    }

    // Log a consolidated profile object in the requested shape
    const profileForDebug = {
      cmuitaccount_name: basicInfo?.cmuitaccount_name || tokenClaims?.cmuitaccount_name || '',
      cmuitaccount: basicInfo?.cmuitaccount || tokenClaims?.cmuitaccount || email || '',
      student_id: basicInfo?.student_id || '',
      prename_id: basicInfo?.prename_id || '',
      prename_TH: basicInfo?.prename_TH || '',
      prename_EN: basicInfo?.prename_EN || '',
      firstname_TH: basicInfo?.firstname_TH || '',
      firstname_EN: basicInfo?.firstname_EN || '',
      lastname_TH: basicInfo?.lastname_TH || '',
      lastname_EN: basicInfo?.lastname_EN || '',
      organization_code: basicInfo?.organization_code || tokenClaims?.organization_code || '',
      organization_name_TH: basicInfo?.organization_name_TH || tokenClaims?.organization_name_TH || '',
      organization_name_EN: basicInfo?.organization_name_EN || tokenClaims?.organization_name_EN || '',
      itaccounttype_id: basicInfo?.itaccounttype_id || '',
      itaccounttype_TH: basicInfo?.itaccounttype_TH || '',
      itaccounttype_EN: basicInfo?.itaccounttype_EN || ''
    }
    console.log('[DEBUG] CMU Profile (normalized):', profileForDebug)

    // Call backend authorization to check UserAccount & role
    console.log('[DEBUG] derived email/department:', { email, department: department || 'Student' })
    const authz = await api.authorize(email, department || 'Student')
    const authzData = authz.data

    if (authzData.status !== 'success') {
      throw new Error(authzData.message || 'Not authorized')
    }

    // Persist user profile with role for UI gating
    authStore.setUserInfo({
      email: authzData.user.email,
      role: authzData.user.role,
      user_id: authzData.user.user_id,
      department: authzData.user.department
    })
    
    // Redirect to main application
    router.push('/')
    // Clean up PKCE verifier after successful exchange
    sessionStorage.removeItem('code_verifier')
    
  } catch (err: any) {
    console.error('Token/authorization error:', err)
    // Clear any partial auth state
    authStore.logout()
    error.value = err.response?.data?.message || err.message || 'Authentication failed. Please try again.'
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
<template>
  <div class="auth-container">
    <div class="auth-card">
      
      <!-- Loading -->
      <div v-if="!error" class="loading-content">
        <div class="loading-spinner large"></div>
        <h2>Signing you in...</h2>
        <p>Please wait while we complete your login</p>
      </div>

      <!-- Error -->
      <div v-else class="error-content">
        <div class="error-icon">!</div>
        <h2>Authentication Failed</h2>
        <p>{{ error }}</p>
        <button @click="retryLogin" class="auth-btn">Try Again</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 20px;
}

.auth-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.loading-content, .error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  border: 3px solid rgba(107,75,161,0.2);
  border-top: 3px solid #6b4ba1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.large {
  width: 40px;
  height: 40px;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ff4d4d;
  color: white;
  font-weight: bold;
  font-size: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: #4b2e83; /* ม่วงเข้ม */
  margin: 0;
}

p {
  font-size: 14px;
  color: #555;
  margin: 0;
  line-height: 1.5;
}

.auth-btn {
  margin-top: 12px;
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: #6b4ba1;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.25s;
}
.auth-btn:hover {
  background: #5a3d8b;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
