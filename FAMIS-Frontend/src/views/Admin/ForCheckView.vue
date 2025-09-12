<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import ExtractKey from '@/service/ExtractKey'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

type PendingStatus = 'pending' | 'approved' | 'rejected'

interface PendingUpload {
  file_id: number
  file_name: string
  uploaded_at: string
  uploaded_by?: string
  uploader_email?: string
  uploader_department?: string
  status?: PendingStatus
  size?: string | number
  title?: string
}

const loading = ref(false)
const error = ref('')
const uploads = ref<PendingUpload[]>([])

const searchQuery = ref('')
const statusFilter = ref<'all' | PendingStatus>('all')

// Date filter
const showDatePicker = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const filterButtonRef = ref<HTMLElement | null>(null)
const datePickerStyle = ref({ top: '0px', left: '0px' })

async function fetchPending() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.listPendingUploads()
    uploads.value = Array.isArray(res.data?.uploads) ? res.data.uploads : []
    window.dispatchEvent(new CustomEvent('for-check-count', {
      detail: uploads.value.length
    }))
  } catch (e: any) {
    const detail = e?.response?.data?.message || e?.message || JSON.stringify(e)
    error.value = `Failed to load pending uploads: ${detail}`
  } finally {
    loading.value = false
  }
}

function parseDate(ts: string) {
  const d = new Date(ts)
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(ts?: string) {
  const d = ts ? new Date(ts) : null
  return d && !isNaN(d.getTime())
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
    : '-'
}
function fmtTime(ts?: string) {
  const d = ts ? new Date(ts) : null
  return d && !isNaN(d.getTime())
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
    : '-'
}

  const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const st = statusFilter.value
  const range = dateRange.value
  const start = range ? new Date(range[0]) : null
  const end = range ? new Date(range[1]) : null

  if (start) start.setHours(0, 0, 0, 0)
  if (end) end.setHours(23, 59, 59, 999)

  return uploads.value.filter(u => {
    const nameMatch = !q || (u.title || u.file_name || '').toLowerCase().includes(q)
    const stMatch = st === 'all' || (u.status || 'pending') === st

    const fileDate = parseDate(u.uploaded_at)
    const dateMatch =
      !start || !end || (fileDate && fileDate >= start && fileDate <= end)

    return nameMatch && stMatch && dateMatch
  })
})

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
  if (val?.[0] && val?.[1]) showDatePicker.value = false
}
function onDateCleared() {
  dateRange.value = null
  showDatePicker.value = false
}

onMounted(() => {
  fetchPending()
  intervalId = window.setInterval(fetchPending, 10000)
  window.addEventListener('for-check-updated', fetchPending as EventListener)
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  window.removeEventListener('for-check-updated', fetchPending as EventListener)
})
let intervalId: number | null = null
</script>

<template>
  <div class="container">

    <!-- Search & Filter -->
    <div class="search-bar-container">
      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512">
          <path
            d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"
          />
        </svg>
        <input v-model="searchQuery" class="search-input" placeholder="Search ..." />
      </div>

      <!-- Filter Date -->
      <button ref="filterButtonRef" @click="toggleDatePicker" class="filter-button">
        <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 640 640">
        <path
          d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM160 304L160 336C160 344.8 167.2 352 176 352L208 352C216.8 352 224 344.8 224 336L224 304C224 295.2 216.8 288 208 288L176 288C167.2 288 160 295.2 160 304zM288 304L288 336C288 344.8 295.2 352 304 352L336 352C344.8 352 352 344.8 352 336L352 304C352 295.2 344.8 288 336 288L304 288C295.2 288 288 295.2 288 304zM432 288C423.2 288 416 295.2 416 304L416 336C416 344.8 423.2 352 432 352L464 352C472.8 352 480 344.8 480 336L480 304C480 295.2 472.8 288 464 288L432 288zM160 432L160 464C160 472.8 167.2 480 176 480L208 480C216.8 480 224 472.8 224 464L224 432C224 423.2 216.8 416 208 416L176 416C167.2 416 160 423.2 160 432zM304 416C295.2 416 288 423.2 288 432L288 464C288 472.8 295.2 480 304 480L336 480C344.8 480 352 472.8 352 464L352 432C352 423.2 344.8 416 336 416L304 416zM416 432L416 464C416 472.8 423.2 480 432 480L464 480C472.8 480 480 472.8 480 464L480 432C480 423.2 472.8 416 464 416L432 416C423.2 416 416 423.2 416 432z"
        />
        </svg>
      </button>

      <!-- Popup Datepicker -->
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

    <!-- Error / Empty -->
    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">No financial documents submitted.</div>

    <!-- List -->
    <div class="list">
      <div v-for="u in filtered" :key="u.file_id" class="item"
        @click="$router.push({ name: 'verificationDocument', params: { fileId: u.file_id } })">
        
        <div class="left">
          <div class="name"> 
            {{ u.file_name }}
            <span v-if="u.title" class="displayname">({{ u.title }})</span>
            <span class="muted">waiting for check...</span>
          </div>

          <div class="dept">{{ u.uploader_department || '-' }}</div>
          <div class="email">{{ u.uploader_email || '-' }}</div> 
        </div>

        <div class="right">
          <div class="time">{{ fmtTime(u.uploaded_at) }}</div>
          <div class="date">{{ fmtDate(u.uploaded_at) }}</div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
}
.actions {
  display: flex;
  gap: 8px;
}
.icon-btn {
  border: 1px solid #ddd;
  background: white;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #f9fafb;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-icon {
  width: 18px;
  height: 18px;
  fill: #555;
  margin-right: 8px;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}

.error {
  color: #b91c1c;
  margin-top: 8px;
  font-weight: 500;
}
.empty {
  color: #6b7280;
  margin-top: 12px;
  font-style: italic;
  text-align: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px;      
  border: 1px solid #e5e7eb;
  border-radius: 16px;     
  background: white;
  transition: transform .2s ease, box-shadow .2s ease;
  cursor: pointer;
  min-height: 60px;        
}
.item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.1);
}

.left .name {
  font-weight: 600;
  font-size: 20px;          
  color: #111827;
  gap: 10px;
}
.left .name .muted {
  font-weight: 400;
  color: #934790;
  margin-left: 6px;
}
.left .dept {
  font-size: 15px;          
  margin-top: 5px;          
}
.left .email {
  font-size: 13px;
  color: #7f8690;   
  padding-top: 20px;
  font-style: italic;
}

.dept-icon {
  width: 14px;
  height: 14px;
  fill: #6b7280;
}

.right {
  text-align: right;
  color: #374151;
}
.right .time {
  font-size: 18px;
  font-weight: 500;
}
.right .date {
  font-size: 15px;
  color: #6b7280;
}

.search-bar-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.search-bar {
  position: relative;
  background-color: #f3f4f6;
  border-radius: 999px;
  display: flex;
  align-items: center;
  width: 600px;
}
.search-input {
  border: none;
  background: transparent;
  padding: 12px 40px 12px 20px;
  font-size: 16px;
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

.displayname {
  font-weight: 500;
  color: #4b5563; 
  margin-left: 6px;
  font-size: 16px;
  font-style: italic;
}

</style>
