<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import ExtractKey from '@/service/ExtractKey.ts'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'

const financialStore = useFinancialKeyStore()
const route = useRoute()
const router = useRouter()
const isUploading = ref(false)

const pdfUrl = ref<string | null>(null)
const selectedFileName = ref<string | null>(null)
const file = ref<File | null>(null)

onMounted(() => {
  const fileUrl = route.query.fileUrl as string | null
  const fileName = route.query.fileName as string | null

  if (fileUrl) pdfUrl.value = fileUrl
  if (fileName) {
    selectedFileName.value = fileName
    financialStore.setFileName(fileName)
  }

  file.value = (window as any).myFile || null
  if (!file.value) alert('No file data found to upload.')
})

async function handleUpload() {
  if (!file.value) {
    alert('No file selected for upload.')
    return
  }

  isUploading.value = true
  try {
    const response = await ExtractKey.processFile(file.value)
    financialStore.setKeys(response.data) // 👉 Store in Pinia

    router.push({ name: 'tabularResult' })
  } catch (error) {
    alert('Upload failed.')
    console.error(error)
  } finally {
    isUploading.value = false
  }
}

function handleCancel() {
  router.push({ name: 'uploadFile' })
}
</script>


<template>
  <div class="file-upload-wrapper" v-if="pdfUrl">

    <!-- Display File Name -->
    <div v-if="selectedFileName" class="file-name">
      {{ selectedFileName }}
    </div>

    <!-- Upload and Cancel Button -->
    <div class="button-group">
      <button class="upload-btn" @click="handleUpload">UPLOAD</button>
      <button class="cancel-btn" @click="handleCancel">CANCEL</button>
    </div>

    <!-- Preview PDF -->
    <div class="pdf-preview">
      <embed :src="pdfUrl" type="application/pdf" width="800" height="600" />
    </div>

  </div>

  <div v-else>
    <p>No file selected.</p>
  </div>

  <!-- Loading Overlay -->
  <div v-if="isUploading" class="overlay">
    <div class="spinner-box">
      <div class="spinner"></div>
      <p>Uploading and Processing...</p>
    </div>
  </div>

</template>

<style scoped>
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.file-name {
  background-color: #582c6d; 
  color: white;
  font-size: x-large;
  font-weight: bold;
  padding: 10px 24px;
  border-radius: 12px;
  user-select: text;
  cursor: pointer;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 80%;
}

.file-name:hover {
  color: #8e50b2;
}

.button-group {
  display: flex;
  gap: 12px;
}

.upload-btn {
  background-color: #a787c0;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background-color: #d64545;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

.pdf-preview {
  margin-top: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  max-width: 100%;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner-box {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #ccc;
  border-top-color: #8e50b2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
