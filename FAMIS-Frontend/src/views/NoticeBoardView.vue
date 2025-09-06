<script setup lang="ts">
import NoticeMessage from '@/components/NoticeMessage.vue'
import ExtractKey from '@/service/ExtractKey'
import { onMounted, ref } from 'vue'

type Row = {
  id: number
  event_type: string
  title: string
  body: string
  actor_email?: string | null
  created_at: string
  is_read: 0 | 1
}

const rows = ref<Row[]>([])

async function loadNotifications() {
  try {
    const raw = sessionStorage.getItem('user_info')
    let email: string | undefined
    if (raw) {
      try { email = JSON.parse(raw)?.email } catch {}
    }
    const res = await ExtractKey.listNotifications({ email })
    rows.value = Array.isArray(res.data?.notifications) ? res.data.notifications : []
  } catch {
    rows.value = []
  }
}

onMounted(loadNotifications)
</script>

<template>
  <div class="status-container">
    <div class="header">
      <h2 class="header-title">Notification Board</h2>
    </div>
    <div class="noti-list">
      <transition-group name="list" tag="div">
        <NoticeMessage
          v-for="(n, index) in rows"
          :key="n.id"
          :status="'complete'"
          :message="n.body || n.title"
          :time="n.created_at"
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