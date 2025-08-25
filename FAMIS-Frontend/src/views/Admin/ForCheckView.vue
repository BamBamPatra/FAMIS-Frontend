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
    const nameMatch = !q || (u.file_name || '').toLowerCase().includes(q)
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
        <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 512 512">
        <path
          d="M3.5 160h361c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12zm0 128h240c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12zm0 128h120c6.6 0 12-5.4 12-12v-20c0-6.6-5.4-12-12-12H3.5c-6.6 0-12 5.4-12 12v20c0 6.6 5.4 12 12 12z"
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
    <div v-else-if="filtered.length === 0" class="empty">No pending uploads.</div>

    <!-- List -->
    <div class="list">
      <div v-for="u in filtered" :key="u.file_id" class="item"
        @click="$router.push({ name: 'verificationDocument', params: { fileId: u.file_id } })">
        <div class="left">
          <div class="name">{{ u.file_name }} <span class="muted">waiting for check</span></div>
          <div class="dept">{{ u.uploader_department || '-' }}</div>
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

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 8px 12px;
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
}
.left .name .muted {
  font-weight: 400;
  color: #934790;
  margin-left: 6px;
}
.left .dept {
  font-size: 15px;          
  margin-top: 2px;          
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
  gap: 12px;
  width: 100%;
}
.search-bar {
  position: relative;
  background-color: #e0e0e0;
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
</style>
