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

    const matchName = (task.filename || '').toLowerCase().includes(search)
    return matchName && inDateRange
  })
})

// Fliter Picker date
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

    <!-- Search -->
    <div class="search-bar-container">
      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512">
          <path
            d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by filename..."
          class="search-input"
        />
      </div>

    <!-- Filter Date -->
      <button ref="filterButtonRef" @click="toggleDatePicker" class="filter-button">
        <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 640 640">
        <path
          d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM160 304L160 336C160 344.8 167.2 352 176 352L208 352C216.8 352 224 344.8 224 336L224 304C224 295.2 216.8 288 208 288L176 288C167.2 288 160 295.2 160 304zM288 304L288 336C288 344.8 295.2 352 304 352L336 352C344.8 352 352 344.8 352 336L352 304C352 295.2 344.8 288 336 288L304 288C295.2 288 288 295.2 288 304zM432 288C423.2 288 416 295.2 416 304L416 336C416 344.8 423.2 352 432 352L464 352C472.8 352 480 344.8 480 336L480 304C480 295.2 472.8 288 464 288L432 288zM160 432L160 464C160 472.8 167.2 480 176 480L208 480C216.8 480 224 472.8 224 464L224 432C224 423.2 216.8 416 208 416L176 416C167.2 416 160 423.2 160 432zM304 416C295.2 416 288 423.2 288 432L288 464C288 472.8 295.2 480 304 480L336 480C344.8 480 352 472.8 352 464L352 432C352 423.2 344.8 416 336 416L304 416zM416 432L416 464C416 472.8 423.2 480 432 480L464 480C472.8 480 480 472.8 480 464L480 432C480 423.2 472.8 416 464 416L432 416C423.2 416 416 423.2 416 432z"
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
  padding: 15px 0;
}

.task-card {
  background-color: #fff;
  border-radius: 16px;         
  padding: 30px 30px;          
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08); 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  min-height: 60px;           
  margin: 15px;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.12);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;     
  padding-bottom: 6px;  
  padding: 10px;
}

.filename {
  font-size: 23px;    
  font-weight: 600;
  display: flex;
  align-items: center;
  color: #111827;
}

.success-text {
  margin-left: 10px;
  font-size: 22px;   
  font-weight: 500;
  color: #10b981;
}

.timestamp {
  text-align: right;
  font-size: 18px;    
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
}
.filter-icon {
  width: 40px;
  height: 30px;
  fill: #000;
  padding-top: 5px;
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
  padding: 10px 0;
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
