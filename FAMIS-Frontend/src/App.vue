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
    <!-- Vertical Navbar -->
    <div class="navbar">

      <!-- Profile Row -->
      <div class="profile-row">
        <!-- Profile icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 448 512">
          <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
        </svg>
        <div class="email">ABC@cmu.ac.th</div>
      </div>

      
      <RouterLink to="/" class="nav-item">HOME</RouterLink>
      <RouterLink to="/history" class="nav-item">HISTORY</RouterLink>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div>
        <Notification />
      </div>
      <RouterView />
    </div>

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
  width: 200px;
  padding: 16px;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 30px 0;
  border-bottom: 1px solid #ccc;
  text-decoration: none;
  color: #333;
  text-align: center;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:hover {
  background-color: #9B7EBD;
  color: white;
}

.main-content {
  flex: 1;
}

.email {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 10px; 
  margin-bottom: 10px; 
}

.icon {
  width: 2em;
  height: 2em;
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