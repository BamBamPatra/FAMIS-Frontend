<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExtractKey from '@/service/ExtractKey'

const route = useRoute()
const router = useRouter()
const fileId = Number(route.params.fileId)

const loading = ref(false)
const error = ref('')
const items = ref<any[]>([])
const fileName = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.getExtractedByFile(fileId)
    if (res.data?.status === 'success') {
      items.value = res.data.items || []
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
  try {
    await ExtractKey.approveUpload(fileId)
    window.dispatchEvent(new CustomEvent('for-check-updated'))
    router.push({ name: 'forCheck' })
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Approve failed')
  }
}

const rejectReason = ref('')
const showReject = ref(false)
async function reject() {
  try {
    await ExtractKey.rejectUpload(fileId, rejectReason.value || undefined)
    window.dispatchEvent(new CustomEvent('for-check-updated'))
    router.push({ name: 'forCheck' })
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Reject failed')
  }
}

onMounted(load)
</script>

<template>
  <div class="container">
    <div class="header">
      <button class="ghost" @click="$router.back()">Back</button>
      <h2>Verification</h2>
      <div class="spacer"></div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="loading">Loading...</div>
    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Document type</th>
            <th>Invoice number</th>
            <th>Supplier Name</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.data_id">
            <td>{{ row.page }}</td>
            <td>{{ row.doc_type_name || row.doc_type_id }}</td>
            <td>{{ row.bill_number }}</td>
            <td>{{ row.supplier_name }}</td>
            <td>{{ row.payment_date }}</td>
            <td>{{ row.amount }}</td>
            <td>{{ row.signature }}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <button class="approve" @click="approve">Approve</button>
        <template v-if="!showReject">
          <button class="reject ghost" @click="showReject = true">Reject</button>
        </template>
        <template v-else>
          <input v-model="rejectReason" class="reason" placeholder="Reason for rejection" />
          <button class="reject" @click="reject">Confirm Reject</button>
          <button class="ghost" @click="showReject = false">Cancel</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { 
  padding: 24px; display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.ghost { 
  background: transparent; 
  border: 1px solid #ddd; padding: 6px 10px; 
  border-radius: 8px; 
  cursor: pointer; 
}

.spacer { 
  flex: 1; 
}
.footer { display: flex; gap: 10px; align-items: center; justify-content: flex-end; margin-top: 16px; }
.approve { background: #10b981; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
.reason { border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; min-width: 260px; }
.reject { background: #ef4444; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }

.table { width: 100%; 
  border-collapse: collapse; 
}

.table th, .table td { 
  border-bottom: 1px solid #eee; 
  padding: 10px; text-align: left; 
}

.error { color: #b91c1c; }
</style>


