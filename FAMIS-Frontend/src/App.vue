<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Notification from '@/components/NotificationIcon.vue'
import { useToastStore } from '@/stores/popupStore.ts'
const toastStore = useToastStore()
import { useNotificationStore } from '@/stores/notificationStore.ts'
import { watchEffect } from 'vue'

const notificationStore = useNotificationStore()
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


</script>

<template>
  <div id="layout">
    <!-- Sidebar -->
    <div class="navbar">
      
      <!-- Profile -->
      <div class="profile-row">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon profile-icon" viewBox="0 0 448 512">
          <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
        </svg>
        <div class="email">ABC@cmu.ac.th</div>
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
          <span>TASK</span>
        </RouterLink>

        <div class="divider"></div>

        <RouterLink to="/history" class="nav-row">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 512 512">
            <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"/>
          </svg>
          <span>HISTORY</span>
        </RouterLink>
      </div>

    </div>

    <!-- Main Content -->
    <div class="main-content">
      <Notification />
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
  width: 220px;
  padding: 20px 16px;
  border-right: 1px solid #000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #fff;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-left: 10px;
}

.email {
  font-size: 16px;
  font-weight: 500;
  color: #000;
}

.divider {
  width: 100%;
  height: 2px;
  background-color: #000;
  margin: 12px 0;
}

.nav-group {
  width: 100%;
}

.nav-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 10px;
  color: #000;
  text-decoration: none;
  font-size: 20px;
  font-weight: bold;
}

.nav-row:hover {
  background-color: #9B7EBD;
  color: #fff;
  border-radius: 50px;
}

.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.profile-icon {
  width: 40px;
  height: 40px;
}

.main-content {
  flex: 1;
  padding: 16px;
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
</style>
