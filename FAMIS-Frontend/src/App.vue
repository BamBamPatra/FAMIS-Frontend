<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Notification from '@/components/NotificationIcon.vue'
import { useToastStore } from '@/stores/popupStore.ts'
import { useNotificationStore } from '@/stores/notificationStore.ts'
import { useAuthStore } from '@/stores/authStore'
import { watchEffect, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/components/Toast.vue'
import { useTaskBoardStore } from '@/stores/taskboardStore'

const toastStore = useToastStore()
const taskBoardStore = useTaskBoardStore()
const router = useRouter()

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

onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isAuthenticated) {
    const role = authStore.userInfo?.role?.toLowerCase()
    if (role === 'admin') {
      router.replace('/admin')
    } else {
      router.replace('/')
    }
  }
})

const handleLogout = () => {
  authStore.logout()
  const logoutUrl = import.meta.env.VITE_LOGOUT_URL
  window.location.href = logoutUrl
}

const showProfileMenu = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const toggleProfileMenu = () => { showProfileMenu.value = !showProfileMenu.value }
const handleClickOutside = (e: MouseEvent) => {
  const el = profileRef.value
  if (el && !el.contains(e.target as Node)) {
    showProfileMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div id="layout">
    <!-- Sidebar  -->
    <div v-if="authStore.isAuthenticated" class="navbar">
      
      <!-- Profile -->
      <div class="profile-row" ref="profileRef">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon profile-icon" viewBox="0 0 448 512">
          <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
        </svg>
        <button class="email-btn" @click.stop="toggleProfileMenu" :title="authStore.userInfo?.email || 'User'">
          <span class="email">{{ authStore.userInfo?.email || 'User' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="caret">
            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c20-20 5.8-54.6-22.6-54.6H32c-28.4 0-42.6 34.5-22.6 54.6l128 128z"/>
          </svg>
        </button>
        <div v-if="showProfileMenu" class="profile-menu">
          <button class="menu-item danger" @click="handleLogout">Logout</button>
        </div>
      </div>

      <!-- Side bar -->
      <!-- Staff sidebar -->
      <template v-if="authStore.userInfo?.role?.toLowerCase() === 'staff'">
          <div class="nav-group">
            <RouterLink to="/" class="nav-row">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
                <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
              </svg>
              <span>HOME</span>
            </RouterLink>

            <div class="divider"></div>
            
            <RouterLink to="/taskBoard" class="nav-row">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
                <path d="M439.4 96L448 96C483.3 96 512 124.7 512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160C128 124.7 156.7 96 192 96L200.6 96C211.6 76.9 232.3 64 256 64L384 64C407.7 64 428.4 76.9 439.4 96zM376 176C389.3 176 400 165.3 400 152C400 138.7 389.3 128 376 128L264 128C250.7 128 240 138.7 240 152C240 165.3 250.7 176 264 176L376 176zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM288 320C288 333.3 298.7 344 312 344L424 344C437.3 344 448 333.3 448 320C448 306.7 437.3 296 424 296L312 296C298.7 296 288 306.7 288 320zM288 448C288 461.3 298.7 472 312 472L424 472C437.3 472 448 461.3 448 448C448 434.7 437.3 424 424 424L312 424C298.7 424 288 434.7 288 448zM224 480C241.7 480 256 465.7 256 448C256 430.3 241.7 416 224 416C206.3 416 192 430.3 192 448C192 465.7 206.3 480 224 480z"/>
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
          </div>
        </template>

        <!-- Admin sidebar -->
        <template v-else-if="authStore.userInfo?.role?.toLowerCase() === 'admin'">
          <div class="nav-group">
            <RouterLink v-if="(authStore.userInfo?.role || '').toLowerCase() === 'admin'" to="/admin" class="nav-row">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
                <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
              </svg>
              <span>Admin Dashboard</span>
            </RouterLink>

            <div class="divider"></div>

            <RouterLink v-if="(authStore.userInfo?.role || '').toLowerCase() === 'admin'" to="/for-check" class="nav-row">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
                <path d="M439.4 96L448 96C483.3 96 512 124.7 512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160C128 124.7 156.7 96 192 96L200.6 96C211.6 76.9 232.3 64 256 64L384 64C407.7 64 428.4 76.9 439.4 96zM376 176C389.3 176 400 165.3 400 152C400 138.7 389.3 128 376 128L264 128C250.7 128 240 138.7 240 152C240 165.3 250.7 176 264 176L376 176zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM288 320C288 333.3 298.7 344 312 344L424 344C437.3 344 448 333.3 448 320C448 306.7 437.3 296 424 296L312 296C298.7 296 288 306.7 288 320zM288 448C288 461.3 298.7 472 312 472L424 472C437.3 472 448 461.3 448 448C448 434.7 437.3 424 424 424L312 424C298.7 424 288 434.7 288 448zM224 480C241.7 480 256 465.7 256 448C256 430.3 241.7 416 224 416C206.3 416 192 430.3 192 448C192 465.7 206.3 480 224 480z"/>
              </svg>
              <span>Waiting for check</span>
            </RouterLink>

            <div class="divider"></div>

            <RouterLink v-if="(authStore.userInfo?.role || '').toLowerCase() === 'admin'" to="/archive" class="nav-row">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 576 512">
                <path  d="M128 512L512 512C547.3 512 576 483.3 576 448L576 208C576 172.7 547.3 144 512 144L362.7 144C355.8 144 349 141.8 343.5 137.6L305.1 108.8C294 100.5 280.5 96 266.7 96L128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512z"/>
              </svg>
              <span>Document Archive</span>
            </RouterLink>

          </div>
        </template>
    </div>

    <!-- Main Content -->
   <div class="main-content" :class="{ 'full-width': !authStore.isAuthenticated }">
    <Notification v-if="authStore.isAuthenticated" />
    <RouterView />
  </div>

    <!-- Toast -->
    <Toast />    
  </div>
</template>

<style >

@import url('https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap');

html, body, button, input, select, textarea {
  font-family: 'Tinos', serif;
}

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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 160px;
  background: transparent; 
}

.email-btn .email { 
  overflow:hidden; 
  text-overflow:ellipsis; 
  white-space:nowrap; 
}

.email-btn .caret { 
  width:12px; 
  height:12px; 
  fill:#111827; 
}

.profile-menu { 
  position: absolute; 
  top: 68px; 
  left: 84px; 
  border:none;
  border-radius:8px; 
  box-shadow:0 8px 24px rgba(0,0,0,0.12); 
  display:flex; 
  flex-direction:column; 
  min-width:160px; 
  z-index:10; 
}

.menu-item { 
  text-align:left; 
  padding:10px 12px; 
  background:none; 
  border:none; 
  cursor:pointer; 
  background: white;
  border-radius:8px; 
}

.menu-item.danger { 
  color:#b91c1c; 
  font-weight:600; 
}

.menu-item.danger:hover { 
  background:#fee2e2; 
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
}

.main-content.full-width {
  margin-left: 0;
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
