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

function goToResult(taskId?: string) {
  if (taskId) {
    router.push({ name: 'tabularResult', params: { taskId } })
  }
}

</script>

<template>
  <div class="status-container" v-if="notifications.length > 0">
    <div class="noti-list">
      <NoticeMessage
        v-for="(noti, index) in notifications"
        :key="index"
        :status="noti.status"
        :message="noti.message"
        :time="noti.timestamp"
        :clickable="noti.status === 'complete'"
        @click="() => goToResult(noti.taskId)"
        />

      <hr v-if="notifications.length > 1" />
    </div>
  </div>
</template>



<style scoped>
.status-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.noti-list {
  display: flex;
  flex-direction: column;
  gap: 16px; 
  width: 100%;
  max-width: 600px;
}

</style>
