<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const statusMessage = ref('กำลังประมวลผลไฟล์...')
const isError = ref(false)
const intervalId = ref<number | null>(null)
const isCompleted = ref(false)

const taskId = route.query.taskId as string | undefined

async function pollTaskStatus() {
  if (!taskId) {
    statusMessage.value = 'ไม่พบ Task ID'
    isError.value = true
    clearPolling()  
    return
  }

  try {
    const response = await axios.get(`http://127.0.0.1:5000/status/${taskId}`)
    const job = response.data

    if (job.status.toLowerCase() === 'complete') {
      statusMessage.value = '🎉 ประมวลผลเสร็จเรียบร้อยแล้ว! (คลิกเพื่อดูผลลัพธ์)'
      isCompleted.value = true
      clearPolling()  
    } else if (job.status === 'error') {
      statusMessage.value = `❌ เกิดข้อผิดพลาด: ${job.message}`
      isError.value = true
      clearPolling()  
    } else {
      statusMessage.value = '📄 กำลังประมวลผล...'
    }
  } catch (error) {
    statusMessage.value = '⚠️ ไม่สามารถเช็คสถานะได้'
    isError.value = true
    clearPolling()  
  }
}


function goToResult() {
  if (isCompleted.value) {
    router.push({ name: 'tabularResult', params: { taskId } })
  }
}

onMounted(() => {
  if (taskId) {
    pollTaskStatus()
    intervalId.value = setInterval(pollTaskStatus, 2000)
  } else {
    statusMessage.value = 'ไม่มี Task ID'
    isError.value = true
  }
})

onUnmounted(() => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
})

function clearPolling() {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

</script>

<template>
  <div class="status-container">
    <div
      :class="['status-box', isError ? 'error' : 'success']"
      :style="{ cursor: isCompleted.value ? 'pointer' : 'default' }"
      @click="goToResult"
    >
      {{ statusMessage }}
    </div>
  </div>
</template>

<style scoped>
/* ...เหมือนเดิม */
</style>


<style scoped>
.status-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.status-box {
  font-size: 1.5rem;
  padding: 24px 32px;
  border-radius: 12px;
  background-color: #f5f5f5;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.success {
  color: #4caf50;
}

.error {
  color: #e53935;
}
</style>
