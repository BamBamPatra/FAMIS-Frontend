<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import ExtractKey from '@/service/ExtractKey.ts'
import { useFinancialKeyStore } from '@/stores/financialKeyStore'
import Popup from '@/components/PopupAlert.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/popupStore'

const financialStore = useFinancialKeyStore()
const route = useRoute()
const router = useRouter()
const isUploading = ref(false)

const pdfUrls = ref<string[]>([])
const fileNames = ref<string[]>([])
const files = ref<File[]>([])
const currentPreviewIndex = ref(0)

const showPopup = ref(false)
const popupMessage = ref('')

const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const startSound = new Audio('/notify.mp3')

function showAutoClosePopup(message: string, duration = 1500) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
  }, duration)
}

onMounted(() => {
  const fileUrlsQuery = route.query.fileUrls as string | null
  const fileNamesQuery = route.query.fileNames as string | null
  const count = parseInt(route.query.count as string || '0')

  if (fileUrlsQuery && fileNamesQuery) {
    pdfUrls.value = fileUrlsQuery.split('|||')
    fileNames.value = fileNamesQuery.split('|||')
  }

  files.value = (window as any).myFiles || []
  if (files.value.length === 0) {
    showAutoClosePopup("No file data found to upload.")
  }
})


async function handleUpload() {
  if (files.value.length === 0) {
    showAutoClosePopup("No files selected for upload.")
    return
  }

  isUploading.value = true
  try { startSound.currentTime = 0; startSound.play().catch(() => {}) } catch {}
  toastStore.trigger(`Uploading ${files.value.length} file(s)...`, 'info')

  try {
    const user = {
      email: authStore.userInfo?.email as string | undefined,
      user_id: authStore.userInfo?.user_id as number | undefined,
    }

    const response = await ExtractKey.processFiles(files.value, user)

    // Handle response - could be single task_id or multiple task_ids
    const taskIds = response.data.task_ids || [response.data.task_id]

    const oldTasks = JSON.parse(localStorage.getItem('notiTasks') || '[]')

    // Start polling for each task
    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i]
      const fileName = fileNames.value[i] || `File ${i + 1}`

      notificationStore.startPolling(taskId, fileName)

      const newTask = { id: taskId, name: fileName, status: 'processing' }
      oldTasks.push(newTask)
    }

    localStorage.setItem('notiTasks', JSON.stringify(oldTasks))

    showAutoClosePopup(`${taskIds.length} file(s) uploaded successfully!`)

    setTimeout(() => {
      router.push({ name: 'uploadFile' })
    }, 1500)
  } catch (error) {
    showAutoClosePopup("Upload failed.")
    console.error(error)
  } finally {
    isUploading.value = false
  }
}

function pollTaskStatus(taskId: string) {
  const interval = setInterval(async () => {
    try {
      const res = await ExtractKey.getStatus(taskId)
      const job = res.data

      if (job.status === 'completed') {
        clearInterval(interval)
        isUploading.value = false
        financialStore.setKeys(job.result)
        router.push({ name: 'tabularResult' })
      } else if (job.status === 'error') {
        clearInterval(interval)
        isUploading.value = false
        showAutoClosePopup(`Processing failed: ${job.message || ''}`)
      } else {
        console.log("Still processing...")
      }
    } catch (err) {
      clearInterval(interval)
      isUploading.value = false
      showAutoClosePopup("Error polling status.")
      console.error(err)
    }
  }, 2000)
}


function handleCancel() {
  router.push({ name: 'uploadFile' })
}
</script>


<template>
  <div class="file-upload-wrapper" v-if="pdfUrls.length > 0">

    <!-- Display File Count -->
    <div class="file-count-badge">
      {{ files.length }} file(s) selected
    </div>

    <!-- Display File Names -->
    <div class="file-list">
      <div v-for="(name, index) in fileNames" :key="index"
           class="file-name-item"
           :class="{ active: currentPreviewIndex === index }"
           @click="currentPreviewIndex = index">
        📄 {{ name }}
      </div>
    </div>

    <!-- Upload and Cancel Button -->
    <div class="button-group">
      <button class="upload-btn" @click="handleUpload">UPLOAD ALL</button>
      <button class="cancel-btn" @click="handleCancel">CANCEL</button>
    </div>

    <!-- Preview Current File -->
    <div class="pdf-preview" v-if="pdfUrls[currentPreviewIndex]">
      <div class="preview-nav" v-if="pdfUrls.length > 1">
        <button @click="currentPreviewIndex = Math.max(0, currentPreviewIndex - 1)"
                :disabled="currentPreviewIndex === 0">
          ← Previous
        </button>
        <span>{{ currentPreviewIndex + 1 }} / {{ pdfUrls.length }}</span>
        <button @click="currentPreviewIndex = Math.min(pdfUrls.length - 1, currentPreviewIndex + 1)"
                :disabled="currentPreviewIndex === pdfUrls.length - 1">
          Next →
        </button>
      </div>
      <embed :src="pdfUrls[currentPreviewIndex]" type="application/pdf" width="800" height="600" />
    </div>

  </div>

  <div v-else>
    <p>No files selected.</p>
  </div>

  <!-- Loading Overlay -->
  <div v-if="isUploading" class="overlay">
    <div class="spinner-box">
      <div class="spinner"></div>
      <p>Uploading {{ files.length }} file(s)...</p>
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
  margin-top: 40px;
}

.file-count-badge {
  background-color: #582c6d;
  color: white;
  font-size: large;
  font-weight: bold;
  padding: 8px 20px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.file-name-item {
  background-color: white;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  font-size: 14px;
}

.file-name-item:hover {
  background-color: #e8e8e8;
}

.file-name-item.active {
  border-color: #582c6d;
  background-color: #f0e6f6;
  font-weight: bold;
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px 8px 0 0;
  gap: 20px;
}

.preview-nav button {
  background-color: #582c6d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.preview-nav button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.preview-nav span {
  font-weight: bold;
  color: #582c6d;
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
  background-color: #CD3F41;
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
