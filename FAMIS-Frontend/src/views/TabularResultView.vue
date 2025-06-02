<script setup lang="ts">
import { ref } from 'vue';
import ExtractKey from '@/service/ExtractKey.ts';
import { useFinancialKeyStore } from '@/stores/financialKeyStore';

const financialStore = useFinancialKeyStore();
const isSaving = ref(false);

async function handleSave() {
  if (!financialStore.financialKeys.length) {
    alert('ไม่มีข้อมูลให้บันทึก');
    return;
  }

  isSaving.value = true;
  try {
    // เรียก saveKeys ส่ง array ของ financialKeys
    const response = await ExtractKey.saveKeys(financialStore.financialKeys);

    if (response.data?.status === 'success') {
      alert('บันทึกสำเร็จ!');
      // หากต้องการ redirect หรือเคลียร์ store ให้ทำตรงนี้
      // เช่น router.push({ name: 'uploadFile' })
    } else {
      alert('เกิดข้อผิดพลาด: ' + (response.data?.message || 'Unknown error'));
    }
  } catch (err: any) {
    console.error('Save error:', err);
    const msg = err.response?.data?.message || 'Save failed';
    alert('บันทึกไม่สำเร็จ: ' + msg);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div v-if="financialStore.fileName" class="file-name">
      {{ financialStore.fileName }}
    </div>

    <table class="bill-table">
      <thead>
        <tr>
          <th>Bill Type</th>
          <th>Bill Number</th>
          <th>Name</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Signature</th>
          <th>Page</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in financialStore.financialKeys" :key="index">
          <td>{{ item.bill_type }}</td>
          <td>{{ item.bill_number || '-' }}</td>
          <td>{{ item.supplier_name }}</td>
          <td>{{ item.payment_date }}</td>
          <td>{{ item.amount }}</td>
          <td>{{ item.signature }}</td>
          <td>{{ item.page }}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-btn">
      <button 
        class="finish-btn" 
        @click="handleSave" 
        :disabled="isSaving"
      >
        {{ isSaving ? 'Saving...' : 'FINISH' }}
      </button>
    </div>
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

.finish-btn {
  background-color: #c1a5d4;
  color: white;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.finish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
