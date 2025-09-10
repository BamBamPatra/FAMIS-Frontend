<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ExtractKey from '@/service/ExtractKey'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

interface ArchivedUpload {
  file_id: number
  file_name: string
  uploaded_at: string
  status: 'approved' | 'rejected'
  reviewed_by?: number | null
  reviewer_email?: string | null
  reviewer_department?: string | null
  uploader_email?: string | null
  uploader_department?: string | null
  title?: string | null
}

const loading = ref(false)
const error = ref('')
const uploads = ref<ArchivedUpload[]>([])
const q = ref('')
const status = ref<'all'|'approved'|'rejected'>('all')
const router = useRouter()

// Date filter
const showDatePicker = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const filterButtonRef = ref<HTMLElement | null>(null)
const datePickerStyle = ref({ top: '0px', left: '0px' })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.listArchivedUploads()
    uploads.value = Array.isArray(res.data?.uploads) ? res.data.uploads : []
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to load archive'
  } finally { loading.value = false }
}

function fmtDate(ts?: string) {
  if (!ts) return '-'
  const d = new Date(ts)
  return isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric'}).format(d)
}
function fmtTime(ts?: string) {
  if (!ts) return '-'
  const d = new Date(ts)
  return isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('en-GB', { hour:'2-digit', minute:'2-digit', hour12:false}).format(d)
}

const filtered = computed(() => {
  const query = q.value.trim().toLowerCase()
  const st = status.value
  const range = dateRange.value
  const start = range ? new Date(range[0]) : null
  const end = range ? new Date(range[1]) : null
  if (start) start.setHours(0,0,0,0)
  if (end) end.setHours(23,59,59,999)

  return uploads.value.filter(u => {
    const byName = !query
      || (u.title || u.file_name || '').toLowerCase().includes(query)
      || (u.reviewer_email || '').toLowerCase().includes(query)
      || (u.uploader_email || '').toLowerCase().includes(query)
    const bySt = st === 'all' || (u.status || '').toLowerCase() === st
    const d = u.uploaded_at ? new Date(u.uploaded_at) : null
    const byDate = !start || !end || (d && d >= start && d <= end)
    return byName && bySt && byDate
  })
})

onMounted(load)

function toggleDatePicker() {
  showDatePicker.value = !showDatePicker.value
  if (showDatePicker.value && filterButtonRef.value) {
    nextTick(() => {
      const el = filterButtonRef.value as HTMLElement
      const offsetTop = el.offsetTop + el.offsetHeight + 8
      const offsetLeft = el.offsetLeft
      datePickerStyle.value = { top: `${offsetTop}px`, left: `${offsetLeft}px` }
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
</script>

<template>
  <div class="container">
    <div class="topbar">
      <input class="search" v-model="q" placeholder="Search title, filename, uploader or reviewer email" />
      <select v-model="status" class="filter">
        <option value="all">All</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <button ref="filterButtonRef" class="filter-button" @click="toggleDatePicker">
        <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 640 640"><path d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM160 304L160 336C160 344.8 167.2 352 176 352L208 352C216.8 352 224 344.8 224 336L224 304C224 295.2 216.8 288 208 288L176 288C167.2 288 160 295.2 160 304zM288 304L288 336C288 344.8 295.2 352 304 352L336 352C344.8 352 352 344.8 352 336L352 304C352 295.2 344.8 288 336 288L304 288C295.2 288 288 295.2 288 304zM432 288C423.2 288 416 295.2 416 304L416 336C416 344.8 423.2 352 432 352L464 352C472.8 352 480 344.8 480 336L480 304C480 295.2 472.8 288 464 288L432 288C423.2 288 416 295.2 416 304z"/></svg>
      </button>
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

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="loading" class="loading">Loading...</div>
    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>File</th>
            <th>Status</th>
            <th>Uploader</th>
            <th>Reviewer</th>
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.file_id" @click="router.push({ name: 'verificationDocument', params: { fileId: u.file_id } })" style="cursor:pointer;">
            <td>
              <div class="title">{{ u.title || u.file_name }}</div>
              <div class="muted">{{ u.file_name }}</div>
            </td>
            <td :class="u.status">{{ u.status }}</td>
            <td>{{ u.uploader_email || '-' }}</td>
            <td>{{ u.reviewer_email || '-' }}</td>
            <td>{{ fmtDate(u.uploaded_at) }} {{ fmtTime(u.uploaded_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="filtered.length === 0" class="empty">No archived documents.</div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 24px; }
.topbar { display:flex; gap:8px; margin-bottom:12px; align-items:center; position: relative; }
.search { padding:8px 10px; border:1px solid #ddd; border-radius:8px; min-width:260px; }
.filter { padding:8px 10px; border:1px solid #ddd; border-radius:8px; }
.filter-button { background: transparent; border: none; cursor: pointer; }
.filter-icon { width: 28px; height: 28px; fill: #000; }
.date-range-popup { position: absolute; z-index: 50; background: white; border: 1px solid #d1d5db; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12); padding: 12px; width: 150px; }
.table { width:100%; border-collapse: collapse; }
.table th, .table td { border-bottom:1px solid #eee; padding:10px; text-align:left; }
.approved { color:#065f46; font-weight:600; }
.rejected { color:#991b1b; font-weight:600; }
.empty { color:#6b7280; margin-top:12px; font-style:italic; }
.error { color:#b91c1c; }
.muted { color:#6b7280; font-size:12px; }
.title { font-weight:600; }
</style>

