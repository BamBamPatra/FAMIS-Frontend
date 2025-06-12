<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import type { FinancialKey } from '@/type.ts'
import ExtractKey from '@/service/ExtractKey.ts'
import Popup from '@/components/PopupAlert.vue'

const router = useRouter()
const route = useRoute()
const financialStore = useFinancialKeyStore()

// UI state
const showPopup     = ref(false)
const popupMessage  = ref('')
const isSaving      = ref(false)
const isEditing     = ref(false)
const editableKeys  = ref<FinancialKey[]>([])
const pdfUrl        = ref<string | null>(null)

const taskId = route.params.taskId as string | undefined

onMounted(async () => {
  try {
    if (!taskId) {
      showPopup.value = true
      popupMessage.value = 'Task ID not found'
      return
    }
    // load filename from localStorage
    const notiTasks = JSON.parse(localStorage.getItem('notiTasks') || '[]')
    const taskInfo  = notiTasks.find((t: any) => t.id === taskId)
    financialStore.setFileName(taskInfo?.name ?? `task_${taskId}.pdf`)

    // fetch status/result
    const res = await ExtractKey.getStatus(taskId)
    if (res.data.status === 'error') {
      showPopup.value = true
      popupMessage.value = res.data.message || 'Error fetching data'
      return
    }

    financialStore.setKeys(res.data.result)

    // optional base64 PDF preview
    if (res.data.file_base64) {
      const bin = atob(res.data.file_base64)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      pdfUrl.value = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }))
    }
  } catch {
    showPopup.value = true
    popupMessage.value = 'Failed to load result'
  }
})

onUnmounted(() => {
  if (pdfUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(pdfUrl.value)
  }
})

function showAutoClosePopup(message: string, duration = 1500, onClose?: () => void) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
    onClose?.()
  }, duration)
}

// --- Inline Edit Handlers ---
function handleEditAll() {
  editableKeys.value = JSON.parse(JSON.stringify(financialStore.financialKeys))
  isEditing.value = true
}

function handleSaveEdits() {
  financialStore.setKeys(editableKeys.value)
  isEditing.value = false
}

function handleCancelEdits() {
  editableKeys.value = []
  isEditing.value = false
}

// --- Final Confirm (save to backend) ---
async function handleSave() {
  if (isEditing.value) {
    handleSaveEdits()
  }

  if (!financialStore.financialKeys.length) {
    showAutoClosePopup("No information to record.")
    return
  }

  isSaving.value = true
  try {
    const payload = {
      user_id: '1',
      filename: financialStore.fileName || 'unknown.pdf',
      image_path: `/tmp/${financialStore.fileName || 'unknown.pdf'}`,
      structured_data: financialStore.financialKeys
    }
    const res = await ExtractKey.saveKeys(payload)
    if (res.data.status === 'success') {
      showAutoClosePopup("Successfully recorded!", 1500, () => {
        router.push({ name: 'uploadFile' })
      })
    } else {
      showAutoClosePopup("Error: " + (res.data.message || 'Unknown error'))
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Save failed'
    showAutoClosePopup("Fail to record: " + msg)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="container">
    <!-- File Name & PDF Preview -->
    <div v-if="financialStore.fileName" class="file-name">
      {{ financialStore.fileName }}
    </div>
    <div v-if="pdfUrl" class="pdf-preview">
      <embed :src="pdfUrl" type="application/pdf" width="800" height="600" />
    </div>

    <!-- Table Header with Icon & Edit Controls -->
    <div class="table-header">
      <h2>Financial Key</h2>
      <!-- Edit Icon -->
      <button
  v-if="!isEditing"
  @click="handleEditAll"
  class="edit-all-btn"
  aria-label="Edit All"
>
  <svg xmlns="http://www.w3.org/2000/svg"
       width="20" height="20"
       fill="currentColor"
       viewBox="0 0 512 512">
    <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3
             11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2
             37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5
             23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7
             253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5
             5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4
             6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32
             0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3
             67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3
             22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3
             18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144
             144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144
             c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"/>
        </svg>
      </button>
      <!-- Save Edits & Cancel Buttons -->
      <button
        v-if="isEditing"
        @click="handleSaveEdits"
        class="confirm-btn"
      >
        SAVE EDITS
      </button>
      <button
        v-if="isEditing"
        @click="handleCancelEdits"
        class="cancel-btn"
      >
        CANCEL
      </button>
    </div>

    <!-- Editable Table -->
    <table class="bill-table">
      <thead>
        <tr>
          <th>Document type</th>
          <th>Invoice number</th>
          <th>Supplier Name</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Signature</th>
          <th>Page</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, idx) in (isEditing ? editableKeys : financialStore.financialKeys)"
          :key="item.page"
        >
          <!-- Document type -->
          <td>
            <template v-if="!isEditing">{{ item.document_type }}</template>
            <template v-else>
              <input v-model="editableKeys[idx].document_type" />
            </template>
          </td>
          <!-- Invoice number -->
          <td>
            <template v-if="!isEditing">{{ item.bill_number || '-' }}</template>
            <template v-else>
              <input v-model="editableKeys[idx].bill_number" />
            </template>
          </td>
          <!-- Supplier Name -->
          <td>
            <template v-if="!isEditing">{{ item.supplier_name }}</template>
            <template v-else>
              <input v-model="editableKeys[idx].supplier_name" />
            </template>
          </td>
          <!-- Date -->
          <td>
            <template v-if="!isEditing">{{ item.payment_date }}</template>
            <template v-else>
              <input v-model="editableKeys[idx].payment_date" />
            </template>
          </td>
          <!-- Amount -->
          <td>
            <template v-if="!isEditing">{{ item.amount }}</template>
            <template v-else>
              <input type="number" v-model.number="editableKeys[idx].amount" />
            </template>
          </td>
          <!-- Signature -->
          <td>
            <template v-if="!isEditing">{{ item.signature }}</template>
            <template v-else>
              <input v-model="editableKeys[idx].signature" />
            </template>
          </td>
          <!-- Page (read-only) -->
          <td>{{ item.page }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Final Confirm to Backend -->
    <div class="footer-btn">
      <button class="cancel-btn" @click="router.push({ name: 'uploadFile' })">
        CANCEL
      </button>
      <button class="confirm-btn" @click="handleSave" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'CONFIRM' }}
      </button>
    </div>

    <!-- Popup Alert -->
    <Popup :show="showPopup" :message="popupMessage" @close="showPopup = false" />
  </div>
</template>

<style scoped>
.container {
  padding: 40px;
  border-radius: 4px;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  min-height: 90vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.file-name {
  background-color: #582c6d;
  color: white;
  padding: 10px 24px;
  font-size: 1.25rem;
  border-radius: 10px;
  font-weight: bold;
  width: 100%;
}

.close-btn {
  position: absolute;
  right: 0;
  background-color: transparent;
  color: white;
  font-size: 1.5rem;
  margin-right: 20px;
  border: none;
  cursor: pointer;
  background-color: #582c6d;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table */
.bill-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 30px;
}

.bill-table th,
.bill-table td {
  border-top: none;
  border-bottom: none;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 12px;
  text-align: center;
}

.bill-table th:first-child,
.bill-table td:first-child {
  border-left: none;
}

.bill-table th:last-child,
.bill-table td:last-child {
  border-right: none;
}

.bill-table tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}

.bill-table tbody tr:nth-child(even) {
  background-color: #ffffff;
}

.bill-table th {
  background-color: #f3f3f3;
  font-weight: bold;
}

.bill-table td {
  padding: 20px 12px;
}

.footer-btn {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 16px; 
}

/* Confirm Button */
.confirm-btn {
  background-color: #a675c6;
  color: white;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cancle Button */
.cancel-btn {
  background-color: #CD3F41;
  color: #333;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  margin-right: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn:hover {
  background-color: #bbb;
}

/* Popup alert */
.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.popup-content {
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
}

.popup-content p {
  font-size: 18px;
  margin-bottom: 20px;
}

.popup-content button {
  background-color: #4b255f;
  color: white;
  border: none;
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}

/* Preview file */
.pdf-preview {
  margin-top: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 800px;  
  height: 600px; 
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.pdf-preview embed {
  width: 100%;
  height: 100%;
  display: block;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 960px;
}

/* Edit icon */
.edit-all-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #582c6d;
  padding: 4px;
  transition: color 0.2s ease;
}

.edit-all-btn:hover {
  color: #a675c6;
}

</style>