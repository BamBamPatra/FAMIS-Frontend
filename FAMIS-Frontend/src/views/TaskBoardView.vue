<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskBoardStore } from '@/stores/taskBoardStore'
import api from '@/service/Extractkey'
import { useRouter } from 'vue-router'
const router = useRouter()

const taskStore = useTaskBoardStore()

onMounted(() => {
  taskStore.fetchCompletedTasks()
})

async function confirmTask(task: any) {
  const payload = {
    user_id: 1, 
    filename: task.filename,
    image_path: `data:application/pdf;base64,${task.file_base64}`,
    structured_data: typeof task.result === 'string' ? task.result : JSON.stringify(task.result)
  }

  const res = await api.saveKeys(payload)
  if (res.data.status === 'success') {
    taskStore.removeTask(task.task_id)
  }
}

function goToResult(task: any) {
  router.push({ name: 'tabularResult', params: { taskId: task.task_id } })
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="task-board">
    <div
      v-for="task in taskStore.completedTasks"
      :key="task.task_id"
      class="task-card"
      @click="goToResult(task)"
    >
      <div class="task-content">
        <div class="filename">
          <span class="dot"></span>
          {{ task.filename }} <span class="success-text">uploaded successfully</span>
        </div>
        <div class="timestamp">
          <div class="time">{{ formatTime(task.timestamp) }}</div>
          <div class="date">{{ formatDate(task.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board {
  padding: 24px;
}

.task-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: auto;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filename {
  font-size: 18px;
  font-weight: 600; 
  display: flex;
  align-items: center;
  color: #111827;
}

.success-text {
  margin-left: 8px;
  font-size: 18px; 
  font-weight: 500;
  color: #10b981;
}

.timestamp {
  text-align: right;
  font-size: 16px; 
  font-weight: 500;
  color: #6b7280;
}

.dot {
  width: 10px;
  height: 10px;
  background-color: #10b981;
  border-radius: 50%;
  margin-right: 10px;
}
</style>
