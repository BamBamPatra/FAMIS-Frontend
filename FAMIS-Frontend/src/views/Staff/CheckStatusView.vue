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
    const nameMatch = !q || (u.title || u.file_name || '').toLowerCase().includes(q)
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

async function deleteSelected() {
  if (!selectedFile.value) return
  try {
    await api.deleteUpload(selectedFile.value.file_id)
    closeDetail()
    await fetchMyUploads()
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || 'Delete failed'
  }
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

const showDeleteConfirmation = ref(false)

function showDeleteModal() {
  showDeleteConfirmation.value = true
}

async function confirmDelete() {
  if (!selectedFile.value) return
  try {
    await api.deleteUpload(selectedFile.value.file_id)
    closeDetail()
    showDeleteConfirmation.value = false
    await fetchMyUploads()
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || 'Delete failed'
  }
}

</script>

<template>
  <div class="container">
    <!-- Top bar -->
    <div class="top-bar">
      <!-- Status Dropdown -->
      <select v-model="statusFilter" class="status-select">
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <!-- Search bar -->
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="Search by filename..." class="search-input"/>
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512">
          <path d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"/>
        </svg>
      </div>

      <!-- Filter Date -->
      <button ref="filterButtonRef" @click="toggleDatePicker" class="filter-button">
        <svg xmlns="http://www.w3.org/2000/svg" class="filter-icon" viewBox="0 0 640 640">
          <path d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM160 304L160 336C160 344.8 167.2 352 176 352L208 352C216.8 352 224 344.8 224 336L224 304C224 295.2 216.8 288 208 288L176 288C167.2 288 160 295.2 160 304zM288 304L288 336C288 344.8 295.2 352 304 352L336 352C344.8 352 352 344.8 352 336L352 304C352 295.2 344.8 288 336 288L304 288C295.2 288 288 295.2 288 304zM432 288C423.2 288 416 295.2 416 304L416 336C416 344.8 423.2 352 432 352L464 352C472.8 352 480 344.8 480 336L480 304C480 295.2 472.8 288 464 288L432 288zM160 432L160 464C160 472.8 167.2 480 176 480L208 480C216.8 480 224 472.8 224 464L224 432C224 423.2 216.8 416 208 416L176 416C167.2 416 160 423.2 160 432zM304 416C295.2 416 288 423.2 288 432L288 464C288 472.8 295.2 480 304 480L336 480C344.8 480 352 472.8 352 464L352 432C352 423.2 344.8 416 336 416L304 416zM416 432L416 464C416 472.8 423.2 480 432 480L464 480C472.8 480 480 472.8 480 464L480 432C480 423.2 472.8 416 464 416L432 416C416 423.2 416 432 416 432z"/>
        </svg>
      </button>

      <!-- Datepicker Popup -->
      <div v-if="showDatePicker" class="date-range-popup" :style="datePickerStyle">
        <Datepicker v-model="dateRange" range clearable :enable-time-picker="false" placeholder="date range"
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
    <div v-else-if="filtered.length === 0" class="empty">No uploads found.</div>
    
    <!-- List -->
    <div v-else class="list">
      <div v-for="u in filtered" :key="u.file_id" class="row" @click="openDetail(u)" style="cursor: pointer;">
    
        <div class="left">
          <span class="filename">
            {{ u.file_name }}
            <span v-if="u.title" class="displayname">({{ u.title }})</span>
          </span>
          <span class="status-text" :class="(u.status || 'pending').toLowerCase()">
            {{ u.status || 'pending' }}
          </span>
        </div>

        <div class="right">
          <div class="time">{{ fmtTime(u.uploaded_at) }}</div>
          <div class="date">{{ fmtDate(u.uploaded_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showDetail" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal">

        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title">
            {{ selectedFile?.file_name }}
            <span v-if="selectedFile?.title" class="displayname">({{ selectedFile.title }})</span>
          </div>
          <div class="modal-actions">
            <button class="modal-close" @click="closeDetail">×</button>
          </div>
        </div>

      <div class="modal-sub">
        <div class="left-info">
          Uploaded {{ fmtDate(selectedFile?.uploaded_at) }} • {{ fmtTime(selectedFile?.uploaded_at) }}
          <span class="status-badge" :class="(selectedFile?.status || 'pending').toLowerCase()">
            {{ selectedFile?.status || 'pending' }}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon delete-inline" 
            viewBox="0 0 640 640" @click="showDeleteModal">
          <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 
                  110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 
                  529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 
                  48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 
                  208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 
                  576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
        </svg>
      </div>



        <!-- Reject reason -->
        <div v-if="selectedFile?.status?.toLowerCase() === 'rejected' && selectedFile?.reject_reason" class="reject-box">
          <strong>Reject reason:</strong> {{ selectedFile.reject_reason }}
        </div>

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
    <div v-if="showDeleteConfirmation" class="modal-backdrop" @click.self="showDeleteConfirmation = false">

      <!-- Modal delete -->
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete <strong>{{ selectedFile?.file_name }}</strong>?</p>
        <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="cancel-btn" @click="showDeleteConfirmation = false">Cancel</button>
          <button class="delete-btn" @click="confirmDelete">Yes, Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.container { 
  padding: 24px; 
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  justify-content: center;
}

.status-select {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
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
  background: transparent;
  border: none;
  cursor: pointer;
}

.filter-icon {
  width: 32px;
  height: 32px;
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

.list { 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
}

.row {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  border: 1px solid #eee;
  border-radius: 10px;
  padding-top: 30px; 
  padding-bottom: 30px;
  padding-left: 20px;
  padding-right: 20px;
  background: #fff;
}

.left {
  display: flex; 
  align-items: center; 
  gap: 6px;
  font-size: 14px;
}

.filename { 
  font-weight: 600;
  font-size: 18px; 
}

.status-text {
  font-size: 16px;
  font-weight: 600;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 8px;
  padding-bottom: 8px;
  border-radius: 9999px; 
  text-transform: capitalize;
  display: inline-block;
}

.status-text.pending {
  background-color: #FEF3C7; 
  color: #92400e;
}

.status-text.approved {
  background-color: #D1FAE5; 
  color: #065f46;
}

.status-text.rejected {
  background-color: #FECACA; 
  color: #991b1b;
}

.right {
  text-align: right;
  font-size: 12px; 
  color: #6b7280;
}

.time { 
  font-weight: 600; 
  font-size: 16px;
}

.date { 
  margin-top: 2px; 
  font-size: 14px;
}

.empty { 
  color: #6b7280; 
  text-align: center;
  margin: 50px;
}
.error { 
  color: #b91c1c; 
}

/* Modal */
.modal-backdrop { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.4); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 100; 
}

.modal { 
  background: #fff; 
  border-radius: 12px; 
  width: 90%; 
  max-width: 960px; 
  padding: 16px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
}

.modal-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.modal-title { 
  font-weight: 700; 
  font-size: 18px; 
}

.modal-close { 
  border: none; 
  background: transparent; 
  font-size: 24px; 
  cursor: pointer; 
}

.modal-sub {
  display: flex;
  align-items: center;
  color: #6b7280;
  margin-bottom: 8px;
}

.left-info {
  display: flex;
  align-items: center;
}

.modal-body { 
  max-height: 60vh; 
  overflow: auto; 
}

.detail-table { 
  width: 100%; 
  border-collapse: collapse; 
}

.detail-table th, .detail-table td { 
  border: 1px solid #e5e7eb; 
  padding: 8px; 
  text-align: center; 
}

/* Status badge */
.status-badge {
  display: inline-block;
  margin-left: 10px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: capitalize;
}
.status-badge.pending {
  background-color: #FEF3C7; 
  color: #92400e;
}
.status-badge.approved {
  background-color: #D1FAE5; 
  color: #065f46;
}
.status-badge.rejected {
  background-color: #FECACA; 
  color: #991b1b;
}

/* Reject reason box */
.reject-box {
  background: #FEE2E2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 5px;
  font-size: 15px;
}

/* Table modern style */
.detail-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 12px;
  font-size: 14px;
}
.detail-table th {
  background: #f9fafb;
  font-weight: 600;
  padding: 10px;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
}
.detail-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-table tr:hover {
  background: #f9fafb;
}

.displayname {
  font-weight: 500;
  color: #4b5563; 
  margin-left: 6px;
  font-size: 15px;
  font-style: italic;
}

.delete-btn {
  background-color: #ef4444; 
  color: white;
  border: none;
  border-radius: 9999px; 
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.cancel-btn {
  background-color: #797878; 
  color: white;
  border: none;
  border-radius: 9999px; 
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.cancel-btn:hover {
  background-color: #979292;
}

.delete-inline {
  width: 25px;
  height: 25px;
  cursor: pointer;
  fill: #6b7280;
  transition: fill 0.2s;
  padding-bottom: 0;
  padding-left: 10px;
}
.delete-inline:hover {
  fill: #dc2626;
}
</style>

