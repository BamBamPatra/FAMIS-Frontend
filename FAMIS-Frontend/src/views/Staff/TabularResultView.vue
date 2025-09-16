<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import type { FinancialKey } from '@/type'
import ExtractKey from '@/service/ExtractKey'
import Popup from '@/components/PopupAlert.vue'
import { useTaskBoardStore } from '@/stores/taskboardStore'
import { useAuthStore } from '@/stores/authStore'
const taskStore = useTaskBoardStore()

const router = useRouter()
const route = useRoute()
const financialStore = useFinancialKeyStore()

const showPopup = ref(false)
const popupMessage = ref('')
const isSaving = ref(false)
const isEditing = ref(false)
const editableKeys = ref<FinancialKey[]>([])
const pdfUrl = ref<string | null>(null)
const showConfirmCancelPopup = ref(false)
const fileBase64 = ref<string | null>(null)
const auth = useAuthStore()

const taskId = route.params.taskId as string | undefined
const docTypeOptions = ref<{ DocTypeID: number, DocTypeName: string }[]>([])

onMounted(async () => {
  isEditing.value = false
  try {
    if (!taskId) {
      showPopup.value = true
      popupMessage.value = 'Task ID not found'
      return
    }

    await fetchDocTypes()

    const notiTasks = JSON.parse(localStorage.getItem('notiTasks') || '[]')
    const taskInfo = notiTasks.find((t: any) => t.id === taskId)
    financialStore.setFileName(taskInfo?.name ?? `task_${taskId}.pdf`)

    // If the task is DB-backed (file:ID), fetch via file id instead of /status
    if (taskId.startsWith('file:')) {
      const rawId = taskId.split(':', 2)[1]
      const fileId = Number(rawId)
      if (!Number.isFinite(fileId)) {
        showPopup.value = true
        popupMessage.value = 'Invalid file id'
        return
      }
      const res = await ExtractKey.getExtractedByFile(fileId)
      if (res.data.status !== 'success') {
        showPopup.value = true
        popupMessage.value = res.data.message || 'Error fetching file data'
        return
      }
      const items = Array.isArray(res.data.items) ? res.data.items : []
      // Map backend shape to FinancialKey[] used by store
      const keys: FinancialKey[] = items.map((r: any) => ({
        document_type: r.doc_type_name || r.doc_type_id,
        bill_number: r.bill_number,
        supplier_name: r.supplier_name,
        amount: r.amount,
        payment_date: r.payment_date,
        signature: r.signature,
        page: r.page,
        description: ''
      }))
      financialStore.setKeys(keys)
      const fileUrl = items[0]?.file_url
      if (fileUrl) {
        pdfUrl.value = `${fileUrl}`
      }
    } else {
      // Memory task: use /status
      const res = await ExtractKey.getStatus(taskId)
      if (res.data.status === 'error') {
        showPopup.value = true
        popupMessage.value = res.data.message || 'Error fetching data'
        return
      }

      financialStore.setKeys(res.data.result)

      if (res.data.file_base64) {
        const bin = atob(res.data.file_base64)
        const arr = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
        pdfUrl.value = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }))
        fileBase64.value = res.data.file_base64
      }
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

async function fetchDocTypes() {
  try {
    const res = await ExtractKey.getDocTypes()
    if (res.data.status === 'success') {
      docTypeOptions.value = res.data.doc_types
    }
  } catch {
    docTypeOptions.value = []
  }
}

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

function showAutoClosePopup(message: string, duration = 1500, onClose?: () => void) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
    onClose?.()
  }, duration)
}

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
      user_id: auth.userInfo?.user_id,
      email: auth.userInfo?.email,
      filename: financialStore.fileName || 'unknown.pdf',
      image_path: fileBase64.value ? `data:application/pdf;base64,${fileBase64.value}` : `/tmp/${financialStore.fileName || 'unknown.pdf'}`,
      structured_data: financialStore.financialKeys,
      task_id: taskId
    }
    console.log('[SAVE PAYLOAD - RESULT VIEW]', payload)
    const res = await ExtractKey.saveKeys(payload)
    if (res.data.status === 'success') {
    if (taskId) {
      taskStore.removeTask(taskId)
    }
    showAutoClosePopup("Successfully recorded!", 1500, () => {
      router.push({ name: 'uploadFile' })
    })
    }else {
      showAutoClosePopup("Error: " + (res.data.message || 'Unknown error'))
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Save failed'
    showAutoClosePopup("Fail to record: " + msg)
  } finally {
    isSaving.value = false
  }
}

function confirmDiscard() {
  showConfirmCancelPopup.value = false
  if (!taskId) {
    showAutoClosePopup('Task ID not found')
    return
  }
  ExtractKey.deleteTask(taskId)
    .then(() => {
      taskStore.removeTask(taskId)
      financialStore.setKeys([])
      showAutoClosePopup('Deleted successfully', 1200, () => {
        router.push({ name: 'uploadFile' })
      })
    })
    .catch((e: any) => {
      const msg = e?.response?.data?.message || 'Delete failed'
      showAutoClosePopup(msg)
    })
}
</script>

<template>
  <div class="container">
    <!-- File Name & PDF Preview -->
    <div v-if="financialStore.fileName" class="file-name">{{ financialStore.fileName }}</div>
    <div v-if="pdfUrl" class="pdf-preview">
      <embed :src="pdfUrl" type="application/pdf" width="800" height="600" />
    </div>

    <!-- Table Header with Edit Controls -->
    <div class="table-header">
      <h2>Financial Key</h2>
      <div class="action-icons" v-if="!isEditing">
        <button type="button" @click="handleEditAll" class="icon-btn" aria-label="Edit All">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 512 512">
            <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144 c6.2 6.2 16.4 6.2 22.6 0s6.2 16.4 0 22.6z" />
          </svg>
        </button>
        <button type="button" @click="showConfirmCancelPopup = true" class="icon-btn" aria-label="Delete Task">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"viewBox="0 0 448 512">
            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
          </svg>
        </button>
      </div>

      <div class="footer-buttons" v-if="isEditing">
        <button @click="handleCancelEdits" class="cancel-btn">CANCEL EDIT</button>
        <button @click="handleSaveEdits" class="confirm-btn">CONFIRM EDIT</button>
      </div>
    </div>

    <!-- Table -->
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
        <tr v-for="(item, idx) in (isEditing ? editableKeys : financialStore.financialKeys)" :key="item.page">
          <td>
            <template v-if="!isEditing">
              {{ item.document_type }}
            </template>
            <template v-else>
              <select v-model="editableKeys[idx].document_type" class="doc-type-select">
                <option v-for="opt in docTypeOptions" :key="opt.DocTypeID" :value="opt.DocTypeName">
                  {{ opt.DocTypeName }}
                </option>
              </select>
            </template>
          </td>
          <td>
            <template v-if="!isEditing">{{ item.bill_number || '-' }}</template>
            <template v-else><input v-model="editableKeys[idx].bill_number" /></template>
          </td>
          <td>
            <template v-if="!isEditing">{{ item.supplier_name }}</template>
            <template v-else><input v-model="editableKeys[idx].supplier_name" /></template>
          </td>
          <td>
            <template v-if="!isEditing">{{ item.payment_date }}</template>
            <template v-else><input v-model="editableKeys[idx].payment_date" /></template>
          </td>
          <td>
            <template v-if="!isEditing">{{ item.amount }}</template>
            <template v-else><input type="number" v-model.number="editableKeys[idx].amount" /></template>
          </td>
          <td>
            <template v-if="!isEditing">{{ item.signature }}</template>
            <template v-else><input v-model="editableKeys[idx].signature" /></template>
          </td>
          <td>{{ item.page }}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-btn" v-if="!isEditing">
      <button class="danger-btn" @click="router.push({ name: 'taskBoard' })">CANCEL</button>
      <button class="confirm-btn" @click="handleSave" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'CONFIRM' }}
      </button>
    </div>

  </div>

    <Popup :show="showPopup" :message="popupMessage" @close="showPopup = false" />

    <!-- Confirm Discard Popup -->
    <Popup :show="showConfirmCancelPopup" @close="showConfirmCancelPopup = false">
      <div class="popup-header">
        <h3 class="popup-title">Discard Data?</h3>
        <button class="popup-close" @click="showConfirmCancelPopup = false">×</button>
      </div>
      <p class="popup-message">
        Are you sure you want to discard all extracted data? <br />
        This action cannot be undone.
      </p>
      <div class="popup-actions">
        <button class="danger-btn" @click="confirmDiscard">Discard</button>
      </div>
    </Popup>

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
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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
  margin-top: 30px;
}

/* Edit icon */
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #582c6d;
  padding: 10px;
  transition: color 0.2s ease;

}

.icon-btn:hover {
  color: #a675c6;
}

.doc-type-select {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* ===== Global Button Styles ===== */
.btn {
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary {
  background-color: #a675c6;
  color: white;
}
.btn-primary:hover { background-color: #8c5ba8; }

.btn-danger {
  background-color: #CD3F41;
  color: white;
}
.btn-danger:hover { background-color: #b53638; }

.btn-secondary {
  background-color: #e5e5e5;
  color: #333;
}
.btn-secondary:hover { background-color: #d4d4d4; }

/* ===== Buttons ===== */
.cancel-btn {
  background-color: #e5e5e5;
  color: #333;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.cancel-btn:hover {
  background-color: #d4d4d4;
}

.confirm-btn {
  background-color: #a675c6;
  color: white;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.confirm-btn:hover {
  background-color: #387F39;
  color: white;
}

.danger-btn {
  background-color: #e5e5e5;
  color: #333;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.danger-btn:hover {
  background-color: #b53638;
  color: white;
}

/* ===== Popup ===== */
.popup-card {
  background: white;
  padding: 28px 32px;
  border-radius: 16px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  animation: popupFadeIn 0.25s ease-out;
  text-align: center;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.popup-title {
  font-size: 20px;
  font-weight: bold;
}

.popup-close {
  position: absolute;
  right: 0px;
  top: 0px;
  border: none;
  background: transparent;
  font-size: 25px;
  cursor: pointer;
}

.popup-close:hover { color: #555; }

.popup-message {
  margin: 0;
}

.popup-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.popup-actions .cancel-btn,
.popup-actions .danger-btn {
  padding: 8px 20px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 100px;
}

.popup-actions .cancel-btn {
  background-color: #e5e5e5;
  color: #333;
}

.popup-actions .cancel-btn:hover {
  background-color: #d4d4d4;
}

.popup-actions .danger-btn {
  background-color: #cd3f41;
  color: white;
}

.popup-actions .danger-btn:hover {
  background-color: #b53638;
}
</style>
