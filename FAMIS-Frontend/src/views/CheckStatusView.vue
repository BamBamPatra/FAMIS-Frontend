<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import api from '@/service/ExtractKey'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const auth = useAuthStore()
const uploads = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const searchQuery = ref('')
const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')
const dateRange = ref<[Date, Date] | null>(null)
const showDatePicker = ref(false)
const filterButtonRef = ref<HTMLElement | null>(null)
const datePickerStyle = ref({ top: '0px', left: '0px' })

async function fetchMyUploads() {
  loading.value = true
  error.value = ''
  try {
    const payload: any = {}
    if (auth.userInfo?.user_id) payload.user_id = auth.userInfo.user_id
    if (auth.userInfo?.email) payload.email = auth.userInfo.email
    const res = await api.listMyUploads(payload)
    uploads.value = Array.isArray(res.data?.uploads) ? res.data.uploads : []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load uploads'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMyUploads()
})

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const st = statusFilter.value
  const range = dateRange.value
  const start = range ? range[0] : null
  const end = range ? range[1] : null

  return uploads.value.filter(u => {
    const nameMatch = !q || (u.file_name || '').toLowerCase().includes(q)
    const stMatch = st === 'all' || (u.status || '').toLowerCase() === st

    const when = new Date(u.uploaded_at)
    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null
    if (startDate) startDate.setHours(0,0,0,0)
    if (endDate) endDate.setHours(23,59,59,999)
    const inRange = (!startDate || when >= startDate) && (!endDate || when <= endDate)

    return nameMatch && stMatch && inRange
  })
})

// Detail modal state
const showDetail = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedFile = ref<any | null>(null)
const extractedItems = ref<any[]>([])

async function openDetail(u: any) {
  selectedFile.value = u
  showDetail.value = true
  detailLoading.value = true
  detailError.value = ''
  extractedItems.value = []
  try {
    const res = await api.getExtractedByFile(u.file_id)
    extractedItems.value = Array.isArray(res.data?.items) ? res.data.items : []
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || 'Failed to load details'
  } finally {
    detailLoading.value = false
  }
}
function closeDetail() {
  showDetail.value = false
  selectedFile.value = null
  extractedItems.value = []
}

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
  if (!val || (val[0] && val[1])) showDatePicker.value = false
}

function onDateCleared() {
  dateRange.value = null
  showDatePicker.value = false
}

// Toggle depending on your backend output
const INPUT_IS_UTC = true
function parseDate(ts: string) {
  // Normalize MySQL DATETIME ("YYYY-MM-DD HH:mm:ss")
  const normalized = typeof ts === 'string' ? ts.replace(' ', 'T') : ts
  const iso = INPUT_IS_UTC ? `${normalized}Z` : normalized
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date(ts) : d
}
function fmtDate(ts: string) {
  const d = parseDate(ts)
  return INPUT_IS_UTC
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}
function fmtTime(ts: string) {
  const d = parseDate(ts)
  return INPUT_IS_UTC
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }).format(d)
    : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}
</script>

<template>
  <div class="container">
    <h2 class="title">Check status</h2>

    <div class="filters">
      <input v-model="searchQuery" class="input" placeholder="Search filename..." />

      <select v-model="statusFilter" class="select">
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <button ref="filterButtonRef" class="btn" @click="toggleDatePicker">Date range</button>
      <button class="btn" @click="fetchMyUploads" :disabled="loading">{{ loading ? 'Loading...' : 'Refresh' }}</button>
    </div>

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

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">No uploads found.</div>
    <div v-else class="list">
      <div v-for="u in filtered" :key="u.file_id" class="row" @click="openDetail(u)" style="cursor: pointer;">
        <div class="col name">
          <div class="filename">{{ u.file_name }}</div>
          <div class="meta">{{ fmtDate(u.uploaded_at) }} • {{ fmtTime(u.uploaded_at) }}</div>
        </div>
        <div class="col status">
          <span class="badge" :class="(u.status || 'pending').toLowerCase()">{{ (u.status || 'pending') }}</span>
        </div>
        <div class="col size">{{ u.file_size ?? '-' }}</div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showDetail" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ selectedFile?.file_name }}</div>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="modal-sub">Uploaded {{ fmtDate(selectedFile?.uploaded_at) }} • {{ fmtTime(selectedFile?.uploaded_at) }}</div>
        <div v-if="detailLoading" class="modal-body">Loading...</div>
        <div v-else-if="detailError" class="modal-body error">{{ detailError }}</div>
        <div v-else class="modal-body">
          <table class="detail-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Document type</th>
                <th>Invoice number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in extractedItems" :key="it.data_id">
                <td>{{ it.page }}</td>
                <td>{{ it.doc_type_name || '-' }}</td>
                <td>{{ it.bill_number || '-' }}</td>
                <td>{{ it.supplier_name || '-' }}</td>
                <td>{{ it.payment_date || '-' }}</td>
                <td>{{ it.amount ?? '-' }}</td>
                <td>{{ it.signature || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 24px; }
.title { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
.filters { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; min-width: 220px; }
.select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; }
.btn { padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.date-range-popup { position: absolute; z-index: 50; background: white; border: 1px solid #d1d5db; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12); padding: 12px; width: 150px; }
.list { display: flex; flex-direction: column; gap: 8px; }
.row { display: grid; grid-template-columns: 1fr 160px 120px; align-items: center; border: 1px solid #eee; border-radius: 10px; padding: 12px 16px; }
.filename { font-weight: 600; }
.meta { color: #6b7280; font-size: 12px; }
.badge { padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
.badge.pending { background: #fef3c7; color: #92400e; }
.badge.approved { background: #d1fae5; color: #065f46; }
.badge.rejected { background: #fee2e2; color: #991b1b; }
.empty { color: #6b7280; }
.error { color: #b91c1c; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 12px; width: 90%; max-width: 960px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-weight: 700; font-size: 18px; }
.modal-close { border: none; background: transparent; font-size: 24px; cursor: pointer; }
.modal-sub { color: #6b7280; margin-bottom: 8px; }
.modal-body { max-height: 60vh; overflow: auto; }
.detail-table { width: 100%; border-collapse: collapse; }
.detail-table th, .detail-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: center; }
</style>

