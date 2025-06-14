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
</script>

<template>
  <div class="task-board">
    <h2>✅ Completed Tasks</h2>
    <div v-if="taskStore.completedTasks.length === 0">No tasks</div>
    <div
      v-for="task in taskStore.completedTasks"
      :key="task.task_id"
      class="task-card"
      @click="goToResult(task)"
      style="cursor: pointer;"
    >
      <h3>{{ task.filename }}</h3>
      <p>{{ task.message }}</p>
    </div>
  </div>
</template>

<style scoped>
.task-board {
  padding: 20px;
}
.task-card {
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 10px;
  border-radius: 8px;
}
</style>
