<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import ExtractKey from '@/service/ExtractKey.ts'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import Popup from '@/components/PopupAlert.vue'

const financialStore = useFinancialKeyStore()
const route = useRoute()
const router = useRouter()
const isUploading = ref(false)

const pdfUrl = ref<string | null>(null)
const selectedFileName = ref<string | null>(null)
const file = ref<File | null>(null)

const showPopup = ref(false)
const popupMessage = ref('')

function showAutoClosePopup(message: string, duration = 1500) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
  }, duration)
}

onMounted(() => {
  const fileUrl = route.query.fileUrl as string | null
  const fileName = route.query.fileName as string | null

  if (fileUrl) pdfUrl.value = fileUrl
  if (fileName) {
    selectedFileName.value = fileName
    financialStore.setFileName(fileName)
  }

  file.value = (window as any).myFile || null
  if (!file.value) 
  showAutoClosePopup("No file data found to upload.")
  return
})


async function handleUpload() {
  if (!file.value) {
    showAutoClosePopup("No file selected for upload.")
    return
  }

  isUploading.value = true
  try {
    const response = await ExtractKey.processFile(file.value)
    financialStore.setKeys(response.data) // Store in Pinia

    router.push({ name: 'tabularResult' })
  } catch (error) {
    showAutoClosePopup("Upload failed.")
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

  <!-- Popup ALert -->
  <Popup :show="showPopup" :message="popupMessage" @close="showPopup = false" />

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
