<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import ExtractKey from '@/service/ExtractKey.ts'
import Popup from '@/components/PopupAlert.vue'

const router = useRouter()
const route = useRoute()
const financialStore = useFinancialKeyStore()

const showPopup = ref(false)
const popupMessage = ref('')
const isSaving = ref(false)

const taskId = route.params.taskId as string | undefined

onMounted(async () => {
  try {
    if (!taskId) {
      showPopup.value = true
      popupMessage.value = 'ไม่พบ Task ID ใน URL'
      return
    }
    const response = await ExtractKey.getStatus(taskId)
    console.log('Fetched result:', response.data)

    if (response.data.status === 'error') {
      showPopup.value = true
      popupMessage.value = response.data.message || 'Error fetching data'
      return
    }

    financialStore.setKeys(response.data.result) // ถ้า backend ส่ง field result จริง ๆ
    financialStore.setFileName(`task_${taskId}.pdf`)
  } catch (error) {
    console.error('Failed to load task result:', error)
    showPopup.value = true
    popupMessage.value = 'Failed to load result'
  }
})

function showAutoClosePopup(message: string, duration = 1500, onClose?: () => void) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
    if (onClose) onClose()
  }, duration)
}

async function handleSave() {
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

    const response = await ExtractKey.saveKeys(payload)

    if (response.data?.status === 'success') {
      showAutoClosePopup("Successfully recorded!", 1500, () => {
        router.push({ name: 'uploadFile' })
      })
    } else {
      alert('Error: ' + (response.data?.message || 'Unknown error'))
    }
  } catch (err: any) {
    console.error('Save error:', err)
    const msg = err.response?.data?.message || 'Save failed'
    showAutoClosePopup("Fail to record: " + msg)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="container">
    <div v-if="financialStore.fileName" class="file-name">
      {{ financialStore.fileName }}
    </div>

    <!-- Table Result -->
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
        <tr v-for="item in financialStore.financialKeys" :key="item.id || item.bill_number || item.page">
          <td>{{ item.document_type }}</td>
          <td>{{ item.bill_number || '-' }}</td>
          <td>{{ item.supplier_name }}</td>
          <td>{{ item.payment_date }}</td>
          <td>{{ item.amount }}</td>
          <td>{{ item.signature }}</td>
          <td>{{ item.page }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Cancle Button -->
    <div class="footer-btn">
      <button class="cancel-btn" @click="router.push({ name: 'uploadFile' })">
        CANCEL
      </button>

      <button
        class="confirm-btn"
        @click="handleSave"
        :disabled="isSaving"
      >
        {{ isSaving ? 'Saving...' : 'CONFIRM' }}
      </button>
    </div>

    <!-- Popup ALert -->
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
  margin-top: 30px;
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
</style>
