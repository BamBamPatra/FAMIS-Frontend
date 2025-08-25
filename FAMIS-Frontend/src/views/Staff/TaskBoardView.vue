<script setup lang="ts">
import { onMounted, ref, computed , nextTick } from 'vue'
import { useTaskBoardStore } from '@/stores/taskboardStore'
import api from '@/service/ExtractKey'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const searchQuery = ref('')
const showDatePicker = ref(false)
const today = new Date()
today.setHours(0, 0, 0, 0)
const dateRange = ref<[Date, Date] | null>(null)


const router = useRouter()
const taskStore = useTaskBoardStore()
const auth = useAuthStore()

onMounted(() => {
  dateRange.value = null  
  searchQuery.value = ''         
  taskStore.fetchCompletedTasks()
})


async function confirmTask(task: any) {
  const userId = auth.userInfo?.user_id
  if (!userId) {
    console.error('No logged-in user id found; cannot save.')
    return
  }
  const payload = {
    user_id: userId,
    email: auth.userInfo?.email,
    filename: task.filename,
    image_path: `data:application/pdf;base64,${task.file_base64}`,
    structured_data: typeof task.result === 'string' ? task.result : JSON.stringify(task.result)
  }
  console.log('[SAVE PAYLOAD]', payload)

  const res = await api.saveKeys(payload)
  if (res.data.status === 'success') {
    taskStore.removeTask(task.task_id)
  }
}

function goToResult(task: any) {
  router.push({ name: 'tabularResult', params: { taskId: task.task_id } })
}

const INPUT_IS_UTC = true
function parseDate(ts: string) {
  const normalized = typeof ts === 'string' ? ts.replace(' ', 'T') : ts
  const iso = INPUT_IS_UTC ? `${normalized}Z` : normalized
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date(ts) : d
}

function formatDate(timestamp: string) {
  const date = parseDate(timestamp)
  return INPUT_IS_UTC
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(date)
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(timestamp: string) {
  const date = parseDate(timestamp)
  return INPUT_IS_UTC
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }).format(date)
    : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

const filteredTasks = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  const range = dateRange.value
  const start = range ? range[0] : null
  const end = range ? range[1] : null


  return taskStore.completedTasks.filter((task) => {
    const taskDate = new Date(task.timestamp)

    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    if (startDate) startDate.setHours(0, 0, 0, 0)
    if (endDate) endDate.setHours(23, 59, 59, 999)

    const inDateRange =
      (!startDate || taskDate >= startDate) &&
      (!endDate || taskDate <= endDate)

    if (!search) return inDateRange

    const matchName = task.filename.toLowerCase().includes(search)
    return matchName && inDateRange
  })
})




const filterButtonRef = ref<HTMLElement | null>(null)
const datePickerStyle = ref({ top: '0px', left: '0px' })

function toggleDatePicker() {
  showDatePicker.value = !showDatePicker.value

  if (showDatePicker.value && filterButtonRef.value) {
    nextTick(() => {
      const el = filterButtonRef.value as HTMLElement
      const offsetTop = el.offsetTop + el.offsetHeight + 8
      const offsetLeft = el.offsetLeft

      datePickerStyle.value = {
        top: `${offsetTop}px`,
        left: `${offsetLeft}px`,
      }
    })
  }
}

function onDateSelected(val: [Date, Date] | null) {
  dateRange.value = val

  if (!val) {
    showDatePicker.value = false
    return
  }

  if (val[0] && val[1]) {
    showDatePicker.value = false
  }
}


function onDateCleared() {
  dateRange.value = null
  searchQuery.value = ''
  showDatePicker.value = false
}




</script>

<template>

  <div class="top-bar">
    <div class="search-bar-container">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by filename..."
          class="search-input"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512">
          <path
            d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"
          />
        </svg>
      </div>

    <!-- ปุ่ม Filter -->
    <button
      ref="filterButtonRef"
      @click="toggleDatePicker"
      class="filter-button"
      aria-label="Toggle date filter"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 512 512">
        <path
          d="M3.5 160h361c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12zm0 128h240c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12zm0 128h120c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12z"
        />
      </svg>
    </button>

    <!-- Datepicker Popup -->
    <div v-if="showDatePicker" class="date-range-popup" :style="datePickerStyle">
      <Datepicker
      v-model="dateRange"
      range
      clearable
      :enable-time-picker="false"
      placeholder="date range"
      :teleport="true"
      :auto-apply="true"
      :month-change-on-scroll="false"
      :close-on-auto-apply="true"
      @update:model-value="onDateSelected"
      @cleared="onDateCleared"
    />

    </div>

    </div>
  </div>

  <div class="task-board">
    <div
      v-for="task in filteredTasks"
      :key="task.task_id"
      class="task-card"
      @click="goToResult(task)"
    >
      <div class="task-content">
        <div class="filename">
          <span class="dot"></span>
          {{ task.filename }}
          <span class="success-text">uploaded successfully</span>
        </div>
        <div class="timestamp">
          <div class="time">{{ formatTime(task.timestamp) }}</div>
          <div class="date">{{ formatDate(task.timestamp) }}</div>
        </div>
      </div>
    </div>

    <div v-if="filteredTasks.length === 0" class="no-task-message">
      No matching tasks found.
    </div>
  </div>

</template>

<style scoped>
.task-board {
  padding: 24px 0;
}

.task-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
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

.no-task-message {
  text-align: center;
  margin-top: 40px;
  color: #6b7280;
  font-size: 18px;
}


.search-bar-container {
  position: relative; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0 24px;
}

.search-bar {
  position: relative;
  background-color: #e0e0e0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  flex: none;
  width: 800px;
}


.search-input {
  border: none;
  background: transparent;
  padding: 12px 40px 12px 20px;
  font-size: 16px;
  border-radius: 999px;
  width: 100%;
  outline: none;
}


.search-icon {
  position: absolute;
  right: 14px;
  width: 18px;
  height: 18px;
  fill: #333;
  pointer-events: none;
}

.filter-button {
  flex-shrink: 0; 
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
}


.filter-icon {
  width: 20px;
  height: 20px;
  fill: #000;
}

.date-range-popup {
  position: absolute;
  z-index: 50;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  padding: 12px;
  width: 150px;
}

.top-bar {
  display: flex;
  justify-content: center; 
  align-items: center;
  padding: 24px 0;
}

.date-range-popup {
  animation: fadeIn 0.25s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dp__clear_icon {
  width: 32px;
  height: 32px;
  cursor: pointer;
  margin-left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}



</style>
