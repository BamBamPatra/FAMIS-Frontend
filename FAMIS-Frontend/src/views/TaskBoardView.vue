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
    <div v-for="task in taskStore.completedTasks" :key="task.task_id" class="task-row" @click="goToResult(task)">
      <div class="task-info">
        <div class="filename"> - {{ task.filename }} is successfully</div>
      </div>
      <div class="task-time">
        <div class="time">{{ formatTime(task.timestamp) }}</div>
        <div class="date">{{ formatDate(task.timestamp) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board {
  padding: 20px;
}

.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #999;
  padding: 10px 0;
  cursor: pointer;
}

.checkbox input {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  accent-color: black;
}

.task-info {
  flex: 1;
  font-size: 16px;
}

.task-time {
  text-align: right;
  min-width: 100px;
  font-size: 14px;
  color: #333;
}

.footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}
</style>