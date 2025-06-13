<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import type { FinancialKey } from '@/type'
import ExtractKey from '@/service/ExtractKey'
import Popup from '@/components/PopupAlert.vue'

const router = useRouter()
const route = useRoute()
const financialStore = useFinancialKeyStore()

const showPopup = ref(false)
const popupMessage = ref('')
const isSaving = ref(false)
const isEditing = ref(false)
const editableKeys = ref<FinancialKey[]>([])
const pdfUrl = ref<string | null>(null)

const taskId = route.params.taskId as string | undefined
const docTypeOptions = ref<{ DocTypeID: number, DocTypeName: string }[]>([])

onMounted(async () => {
  isEditing.value = false // reset edit state
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
    <div v-if="financialStore.fileName" class="file-name">{{ financialStore.fileName }}</div>
    <div v-if="pdfUrl" class="pdf-preview">
      <embed :src="pdfUrl" type="application/pdf" width="800" height="600" />
    </div>

    <!-- Table Header with Edit Controls -->
    <div class="table-header">
      <h2>Financial Key</h2>
      <button type="button" v-if="!isEditing" @click="handleEditAll" class="edit-all-btn">✏️</button>
      <button type="button" v-if="isEditing" @click="handleSaveEdits" class="confirm-btn">SAVE EDITS</button>
      <button type="button" v-if="isEditing" @click="handleCancelEdits" class="cancel-btn">CANCEL</button>
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

    <!-- Final Buttons -->
    <div class="footer-btn">
      <button class="cancel-btn" @click="router.push({ name: 'uploadFile' })">CANCEL</button>
      <button class="confirm-btn" @click="handleSave" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'CONFIRM' }}
      </button>
    </div>

    <!-- Popup -->
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

.doc-type-select {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
}
</style>