<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notificationStore'
import NoticeMessage from '@/components/NoticeMessage.vue'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

onMounted(() => {
  const taskId = route.params.taskId
  if (typeof taskId === 'string') {
    notificationStore.startPolling(taskId)
  }
})
</script>

<template>
  <div class="status-container" v-if="notifications.length > 0">
    <div class="header">
      <h2 class="header-title">Notification Board</h2>
    </div>
    <div class="noti-list">
      <transition-group name="list" tag="div">
        <NoticeMessage
          v-for="(noti, index) in notifications.slice().reverse()"
          :key="noti.timestamp + '-' + index"
          :status="noti.status"
          :message="noti.message"
          :time="noti.timestamp"
          class="notification-card"
        />
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.status-container {
  display: flex;
  flex-direction: column; 
  min-height: 100vh; 
  padding: 30px 20px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.header-title {
  font-size: 2.2em;
  font-weight: 700;
  margin-bottom: 8px;
  color: #2c3e50;
}

.noti-list {
  display: flex;
  flex-direction: column;
  max-height: 70vh; 
  overflow-y: auto;
  flex: 1;
  margin-left: 20px;
}

.notification-card {
  background-color: #ffffff;
  border: #e0e0e0;
  margin-bottom: 10px;
  width: auto;
}

/* Scrollbar */
.noti-list::-webkit-scrollbar {
  width: 10px;
}

.noti-list::-webkit-scrollbar-track {
  background: #e0e0e0;
  border-radius: 10px;
}

.noti-list::-webkit-scrollbar-thumb {
  background: #a8a8a8;
  border-radius: 10px;
}

.noti-list::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>