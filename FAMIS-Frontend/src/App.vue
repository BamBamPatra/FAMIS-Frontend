<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Notification from '@/components/NotificationIcon.vue'
import { useToastStore } from '@/stores/popupStore.ts'
const toastStore = useToastStore()
import { useNotificationStore } from '@/stores/notificationStore.ts'
import { useAuthStore } from '@/stores/authStore'
import { watchEffect, onMounted } from 'vue'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const successSound = new Audio('/notify.mp3')
const shownTasks = new Set<string>()

watchEffect(() => {
  const lastNoti = notificationStore.notifications.at(-1)
  if (!lastNoti || shownTasks.has(lastNoti.taskId || '')) return

  if (lastNoti.status !== 'processing') {
    shownTasks.add(lastNoti.taskId || '')
    const toastType = lastNoti.status === 'complete' ? 'success' : 'error'
    toastStore.trigger(lastNoti.message, toastType)

    if (lastNoti.status === 'complete') {
      successSound.currentTime = 0
      successSound.play().catch((err) => {
        console.warn('Sound play failed:', err)
      })
    }
  }
})

import { useTaskBoardStore } from '@/stores/taskboardStore'
const taskBoardStore = useTaskBoardStore()

onMounted(() => {
  // Check authentication status on app load
  authStore.checkAuth()
})

const handleLogout = () => {
  authStore.logout()
  const logoutUrl = import.meta.env.VITE_LOGOUT_URL
  window.location.href = logoutUrl
}
</script>

<template>
  <div id="layout">
    <!-- Sidebar - Only show when authenticated -->
    <div v-if="authStore.isAuthenticated" class="navbar">
      
      <!-- Profile -->
      <div class="profile-row">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon profile-icon" viewBox="0 0 448 512">
          <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
        </svg>
        <div class="email">{{ authStore.userInfo?.email || 'User' }}</div>
        <button @click="handleLogout" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32L64 160c0-17.7 14.3-32 32-32l64 0z"/>
          </svg>
        </button>
      </div>

      <!-- Menu Items -->
      <div class="nav-group">
        <RouterLink to="/" class="nav-row">
           <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
            <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
          </svg>
          <span>HOME</span>
        </RouterLink>

        <div class="divider"></div>

        <RouterLink to="/taskBoard" class="nav-row">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 512 512">
            <path d="M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-92.1c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32L121 32zm0 64l270 0 48 192-51.2 0c-12.1 0-23.2 6.8-28.6 17.7l-14.3 28.6c-5.4 10.8-16.5 17.7-28.6 17.7l-120.4 0c-12.1 0-23.2-6.8-28.6-17.7l-14.3-28.6c-5.4-10.8-16.5-17.7-28.6-17.7L73 288 121 96z"/>
          </svg>
          <span>Waiting for confirm</span>
          <span v-if="taskBoardStore.taskIds.length" class="badge">
            {{ taskBoardStore.taskIds.length }}
          </span>
        </RouterLink>

        <div class="divider"></div>

        <RouterLink to="/history" class="nav-row">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 512 512">
            <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"/>
          </svg>
          <span>Check status</span>
        </RouterLink>

        <div class="divider"></div>

        <RouterLink v-if="authStore.userInfo?.role === 'Admin'" to="/admin" class="nav-row">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 512 512">
            <path d="M320 96a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM0 224c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224zM96 416c0-17.7 14.3-32 32-32H384c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32V416z"/>
          </svg>
          <span>Admin Dashboard</span>
        </RouterLink>
      </div>

    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'full-width': !authStore.isAuthenticated }">
      <Notification v-if="authStore.isAuthenticated" />
      <RouterView />
    </div>

    <!-- Toast -->
    <div v-if="toastStore.show" class="toast" :class="toastStore.type">
      {{ toastStore.message }}
    </div>
  </div>
</template>

<style scoped>
#layout {
  display: flex;
  min-height: 100vh;
}

.navbar {
  width: 240px;
  padding: 24px 16px;
  border-right: 2px solid #000;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding-left: 4px;
}

.email {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  flex: 1;
}

.logout-btn {
  background: #ff4757;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
  font-weight: 600;
  font-size: 14px;
  gap: 6px;
  min-width: 80px;
}

.logout-btn:hover {
  background-color: #ff3742;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
}

.logout-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #000;
  margin: 16px 0;
}

.nav-group {
  width: 100%;
}

.nav-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 12px;
  color: #000;
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
  transition: background-color 0.3s, color 0.3s;
  border-radius: 12px;
}

.nav-row:hover {
  background-color: #9B7EBD;
  color: #fff;
}

.router-link-exact-active {
  background-color: #9B7EBD;
  color: #fff;
}

.icon {
  width: 28px;
  height: 28px;
  fill: currentColor;
  flex-shrink: 0;
}

.profile-icon {
  width: 36px;
  height: 36px;
  fill: #000;
}

.main-content {
  flex: 1;
  padding: 24px;
}

.main-content.full-width {
  margin-left: 0;
}


.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  animation: fadeInOut 3s ease forwards;
}

.success { background-color: #4BB543; }
.error { background-color: #E74C3C; }
.info { background-color: #3498DB; }

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}

.badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

</style>
