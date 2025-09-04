<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExtractKey from '@/service/ExtractKey'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const fileId = Number(route.params.fileId)

const decision = ref("")

const loading = ref(false)
const error = ref('')
const items = ref<any[]>([])

const pdfUrl = ref<string>('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.getExtractedByFile(fileId)
    if (res.data?.status === 'success') {
      items.value = res.data.items || []
      if (items.value.length > 0) {
        pdfUrl.value = items.value[0].file_url
      }
    } else {
      error.value = res.data?.message || 'Failed to load data'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Network error'
  } finally {
    loading.value = false
  }
}

async function approve() {
  if (!isPending.value) return
  await ExtractKey.approveUpload(fileId)
  window.dispatchEvent(new CustomEvent('for-check-updated'))
  router.push({ name: 'forCheck' })
}

async function reject() {
  if (!isPending.value) return
  await ExtractKey.rejectUpload(fileId)
  window.dispatchEvent(new CustomEvent('for-check-updated'))
  router.push({ name: 'forCheck' })
}

const rejectReason = ref("")
const showRejectModal = ref(false)

async function handleConfirm() {
  if (decision.value === "approved") {
    await approve()
  } else if (decision.value === "rejected") {
    showRejectModal.value = true
  } else {
    alert("Please select Approved or Rejected")
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    alert("Please enter reason for rejection")
    return
  }

  await ExtractKey.rejectUpload(fileId, rejectReason.value)  
  window.dispatchEvent(new CustomEvent('for-check-updated'))
  router.push({ name: 'forCheck' })
}



function getAmountClass(amount: number, page: number) {
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



onMounted(load)

// Derived status from backend to prevent re-approval on browser back
const uploadStatus = computed(() => {
  const st = (items.value?.[0]?.upload_status || '').toString().toLowerCase()
  return st || 'pending'
})
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
      <select v-model="decision" class="decision-dropdown" :disabled="!isPending">
        <option value="" disabled>Select decision</option>
        <option value="approved" class="approved">Approved</option>
        <option value="rejected" class="rejected">Rejected</option>
      </select>

      <div class="button-group">
        <button class="btn-cancel" @click="router.back()">CANCEL</button>
        <button class="btn-confirm" @click="handleConfirm" :disabled="!isPending">CONFIRM</button>
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

.btn-cancel {
  background-color: #d9534f;
  color: white;
  font-weight: bold;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-cancel:hover {
  background-color: #c9302c;
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


</style>
