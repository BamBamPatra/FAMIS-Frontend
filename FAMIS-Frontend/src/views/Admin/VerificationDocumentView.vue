<script setup lang="ts">
import { onMounted, ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExtractKey from '@/service/ExtractKey'

const route = useRoute()
const router = useRouter()
const fileId = Number(route.params.fileId)

const decision = ref("")

interface ExtractedRow {
  data_id: number
  page: number
  bill_number: string | null
  supplier_name: string | null
  amount: number | null
  payment_date: string | null
  signature: string | null
  doc_type_id: number | null
  doc_type_name?: string | null
  file_url?: string
}

const loading = ref(false)
const error = ref('')
const items = ref<ExtractedRow[]>([])

const pdfUrl = ref<string>('')
const trackStatus = ref<string>('pending')
const trackRejectReason = ref<string>('')

function extractMessage(err: unknown): string {
  try {
    const anyErr = err as { response?: { data?: { message?: string } }, message?: string }
    return anyErr?.response?.data?.message || anyErr?.message || 'Network error'
  } catch { return 'Network error' }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.getExtractedByFile(fileId)
    if (res.data?.status === 'success') {
      items.value = res.data.items || []
      if (items.value.length > 0) {
        pdfUrl.value = items.value[0].file_url || ''
      }
      const ts = (res.data?.track_status || '').toString().toLowerCase()
      trackStatus.value = ts || 'pending'
      const rr = res.data?.track_reject_reason
      if (typeof rr === 'string') trackRejectReason.value = rr
    } else {
      error.value = res.data?.message || 'Failed to load data'
    }
  } catch (e: unknown) {
    error.value = extractMessage(e)
  } finally {
    loading.value = false
  }
}

async function approve() {
  if (!isPending.value) return
  const reviewerId = Number(router.currentRoute.value?.query?.rid || authUserId())
  await ExtractKey.approveUpload(fileId, isNaN(reviewerId) ? undefined : reviewerId)
  window.dispatchEvent(new CustomEvent('for-check-updated'))
  router.push({ name: 'forCheck' })
}

const rejectReason = ref("")
const showRejectModal = ref(false)

// Decision dropdown replaced by explicit buttons; keep helpers for backward-compat if needed

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    alert("Please enter reason for rejection")
    return
  }
  const reviewerId = Number(router.currentRoute.value?.query?.rid || authUserId())
  await ExtractKey.rejectUpload(fileId, rejectReason.value, isNaN(reviewerId) ? undefined : reviewerId)
  window.dispatchEvent(new CustomEvent('for-check-updated'))
  router.push({ name: 'forCheck' })
}

const showDeleteConfirmation = ref(false)

function showDeleteModal() {
  showDeleteConfirmation.value = true
}

async function confirmDelete() {
  try {
    await ExtractKey.deleteUpload(fileId)
    window.dispatchEvent(new CustomEvent('for-check-updated'))
    router.push({ name: 'forCheck' })
  } catch (e: unknown) {
    alert(`Failed to delete: ${extractMessage(e)}`)
  }
}

function getAmountClass(amount: number | null, page: number) {
  if (page === 1) {
    // เทียบกับทุก row ของฝั่งขวา (page > 1)
    const match = items.value.find(r => r.page > 1 && r.amount === amount)
    const mismatch = items.value.find(r => r.page > 1 && r.amount !== amount)
    if (match) return 'highlight-green'
    if (mismatch) return 'highlight-red '
  } else {
    // เทียบกับทุก row ของฝั่งซ้าย (page = 1)
    const match = items.value.find(r => r.page === 1 && r.amount === amount)
    const mismatch = items.value.find(r => r.page === 1 && r.amount !== amount)
    if (match) return 'highlight-green '
    if (mismatch) return 'highlight-red '
  }
  return ''
}

function authUserId(): number | undefined {
  try {
    const raw = sessionStorage.getItem('user_info')
    if (!raw) return undefined
    const obj = JSON.parse(raw)
    return typeof obj?.user_id === 'number' ? obj.user_id : Number(obj?.user_id)
  } catch { return undefined }
}

onMounted(load)

// Derived status from backend tracking to prevent re-approval on browser back
const uploadStatus = computed(() => (trackStatus.value || '').toLowerCase() || 'pending')
const isPending = computed(() => uploadStatus.value === 'pending')

// If already approved/rejected, reflect it in the dropdown so the UI shows current state
watchEffect(() => {
  if (!isPending.value) {
    if (uploadStatus.value === 'approved') decision.value = 'approved'
    else if (uploadStatus.value === 'rejected') decision.value = 'rejected'
  }
})
</script>

<template>
  <div class="content">

    <div class="top-actions">
      <button class="btn-back" @click="router.back()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="icon-back"><path d="M256 96c17.7 0 32 14.3 32 32l0 96 224 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-224 0 0 96c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-7l-160-160c-12.5-12.5-12.5-32.8 0-45.3l160-160c9.2-9.2 22.9-11.9 34.9-7S256 115.1 256 128l0 96 224 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l-224 0 0 96-128-128L256 96z"/></svg>
        Back
      </button>
    </div>

    <div v-if="error" class="error" style="color:#b91c1c; font-weight:600; margin: 8px 0;">
      {{ error }}
    </div>

    <!-- Reference Document Panel -->
    <div class="panels">
      <div class="panel card">
        <h3 class="panel-title">Reference Document</h3>
        <div v-if="pdfUrl" class="pdf-preview">
          <embed :src="pdfUrl + '#page=1'" type="application/pdf" class="pdf-embed" />
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Document Type</th>
              <th>Invoice Number</th>
              <th>Supplier Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items.filter(r => r.page === 1)" :key="row.data_id">
              <td>{{ row.page }}</td>
              <td>{{ row.doc_type_name || row.doc_type_id }}</td>
              <td>{{ row.bill_number }}</td>
              <td>{{ row.supplier_name }}</td>
              <td>{{ row.payment_date }}</td>
              <td :class="getAmountClass(row.amount, row.page)"> {{ row.amount }}</td>
              <td>{{ row.signature }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Financial Document Panel -->
      <div class="panel card">
        <h3 class="panel-title">Financial Document</h3>
        <div v-if="pdfUrl" class="pdf-preview">
          <embed :src="pdfUrl + '#page=2'" type="application/pdf" class="pdf-embed" />
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Document Type</th>
              <th>Invoice Number</th>
              <th>Supplier Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items.filter(r => r.page > 1)" :key="row.data_id">
              <td>{{ row.page }}</td>
              <td>{{ row.doc_type_name || row.doc_type_id }}</td>
              <td>{{ row.bill_number }}</td>
              <td>{{ row.supplier_name }}</td>
              <td>{{ row.payment_date }}</td>
              <td :class="getAmountClass(row.amount, row.page)"> {{ row.amount }}</td>
              <td>{{ row.signature }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Buttons (fixed at bottom-right) -->
    <div class="action-buttons">

      <div class="button-group" v-if="isPending">
        <div class="action-buttons-header">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 640 640" @click="showDeleteModal">
            <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
      </svg>
    </div>
        <button class="btn-reject" @click="showRejectModal = true" :disabled="!isPending">REJECT</button>
        <button class="btn-approve-prominent" @click="approve" :disabled="!isPending">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="icon-approve"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3L278.6 310.6c-12.5 12.5-32.8 12.5-45.3 0L201.4 278.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l31.6 31.6L393.4 105.4c12.5-12.5 32.8-12.5 45.3 0zM128 192c35.3 0 64 28.7 64 64l0 192 256 0c35.3 0 64 28.7 64 64s-28.7 64-64 64l-288 0c-35.3 0-64-28.7-64-64l0-224c0-35.3 28.7-64 64-64z"/></svg>
          Approve
        </button>
      </div>

      <div v-else class="status-display">
        <div v-if="uploadStatus === 'approved'" class="status-badge approved">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="icon-approve"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3L278.6 310.6c-12.5 12.5-32.8 12.5-45.3 0L201.4 278.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l31.6 31.6L393.4 105.4c12.5-12.5 32.8-12.5 45.3 0zM128 192c35.3 0 64 28.7 64 64l0 192 256 0c35.3 0 64 28.7 64 64s-28.7 64-64 64l-288 0c-35.3 0-64-28.7-64-64l0-224c0-35.3 28.7-64 64-64z"/></svg>
          Approved
        </div>
        <div v-else-if="uploadStatus === 'rejected'" class="status-badge rejected">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="icon-reject"><path d="M256 128c0-17.7 14.3-32 32-32l128 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l-128 0c-17.7 0-32-14.3-32-32l0-64zM192 256c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l256 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-256 0zM160 416l0 64c0 17.7 14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-128 0c-17.7 0-32 14.3-32 32zM384 416l0 64c0 17.7 14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-128 0c-17.7 0-32 14.3-32 32z"/></svg>
          Rejected
          <span v-if="trackRejectReason" class="reject-reason"> - {{ trackRejectReason }}</span>
        </div>
        <span v-else class="status-badge pending">{{ uploadStatus }}</span>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showRejectModal" class="modal-backdrop">
      <div class="modal">
        <h3>Reject Reason</h3>
        <textarea v-model="rejectReason" placeholder="Enter reason"></textarea>
        <div class="modal-actions">
          <button @click="showRejectModal = false">Cancel</button>
          <button @click="confirmReject">Submit</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="modal-backdrop">
      <div class="modal">
        <h3>Delete File</h3>
        <p>Are you sure you want to delete this file? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="showDeleteConfirmation = false">Cancel</button>
          <button @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>


  </div>

</template>

<style scoped>
/* Layout */
.content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.panels {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.top-actions {
  display: flex;
  justify-content: flex-start;
  padding: 4px 0 0 4px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.btn-back:hover { background: #e5e7eb; }
.icon-back { width: 18px; height: 18px; fill: #111827; }


@media (min-width: 1024px) {
  .panels {
    flex-direction: row;
  }
}

.card {
  flex: 1;
  padding-left: 20px;
  padding-right: 20px;
}

.panel-title {
  font-size:30px;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 0;
}

.pdf-preview {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  height: 700px;
}
.pdf-embed {
  width: 100%;
  height: 100%;
}

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table th, .table td {
  border-bottom: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #555;
}

.table tbody tr:hover {
  background-color: #fafafa;
  transition: background-color 0.2s;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  margin-top: 15px;
  padding-right: 20px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  padding-top: 10px;
}

.decision-dropdown {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 15px;
  margin-right: 20px;
}

.decision-dropdown option.approved {
  color: green;
}

.decision-dropdown option.rejected {
  color: red;
}

.btn-confirm {
  background-color: #9370db;
  color: white;
  font-weight: bold;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-confirm:hover {
  background-color: #387F39;
}

.btn-reject {
  background-color: #ef4444;
  color: white;
  font-weight: bold;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-reject:hover {
  background-color: #b91c1c;
}

.btn-approve-prominent {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #10b981; /* emerald-500 */
  color: #ffffff;
  font-weight: 800;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 17px;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
  transition: transform 0.05s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn-approve-prominent:hover {
  background: #059669; /* emerald-600 */
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4);
}

.btn-approve-prominent:active {
  transform: translateY(1px);
}

.icon-approve { width: 18px; height: 18px; fill: #ffffff; }

/* Make disabled buttons keep their colors */
.btn-approve-prominent:disabled {
  opacity: 1;
  cursor: default;
  filter: grayscale(0%);
}
.btn-reject:disabled {
  opacity: 1;
  cursor: default;
}
.status-buttons { display: flex; align-items: center; gap: 8px; }
.status-display { display: flex; align-items: center; gap: 8px; }
.rejected-wrap { display: inline-flex; align-items: center; gap: 6px; }
.reject-reason { color: #991b1b; font-weight: 600; }

/* Status badge styles */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: default;
  border: 1px solid transparent;
  transition: none;
}

.status-badge:hover {
  transform: none;
  box-shadow: none;
}

.status-badge.approved {
  background-color: #D1FAE5;
  color: #065f46;
  border-color: #10B981;
}

.status-badge.rejected {
  background-color: #FECACA;
  color: #991b1b;
  border-color: #EF4444;
}

.status-badge.pending {
  background-color: #FEF3C7;
  color: #92400e;
  border-color: #F59E0B;
}

.icon-approve { width: 16px; height: 16px; fill: currentColor; }
.icon-reject { width: 16px; height: 16px; fill: currentColor; }

/* Modal backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* Modal box */
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 600px;
  max-width: 95%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInScale 0.2s ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.modal h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

/* Fixed textarea */
.modal textarea {
  width: 100%;
  height: 180px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border 0.2s;
}

.modal textarea:focus {
  border-color: #9370db;
}

/* Modal actions */
/* Modal box */
.modal {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  width: 640px;
  max-width: 95%;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeInScale 0.25s ease-out;
}

/* Heading */
.modal h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #222;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

.modal textarea {
  width: 610px;
  border-radius: 12px;
  border: 1.5px solid #ddd;
  font-size: 25px;
  background: #fafafa;
  transition: border 0.25s, background 0.25s;
}


/* Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 8px;
}

.modal-actions button {
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 17px;
  transition: all 0.2s;
}

/* Cancel */
.modal-actions button:first-child {
  background: #f5f5f5;
  color: #444;
}

.modal-actions button:first-child:hover {
  background: #e57373;
  color: #fff;
}

/* Submit */
.modal-actions button:last-child {
  background: #7a5dc7;
  color: #fff;
}

.modal-actions button:last-child:hover {
  background: #387F39;
}

.highlight-green {
  color: green;
  font-weight: bold;
  background-color: #e6ffed;
  border-radius: 6px;
  padding: 2px 6px;
}

.highlight-red {
  color: red;
  font-weight: bold;
  background-color: #ffe6e6;
  border-radius: 6px;
  padding: 2px 6px;
}
.action-buttons-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  gap: 12px;
}

.icon {
  width: 30px;
  cursor: pointer;
  transition: fill 0.3s;
  fill: #000000;
}

.icon:hover {
  fill: #8568a6;
}
</style>
