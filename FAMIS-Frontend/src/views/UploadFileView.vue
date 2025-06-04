<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Popup from '@/components/PopupAlert.vue'

const router = useRouter()
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const showPopup = ref(false)
const popupMessage = ref('')

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files?.length) selectFile(files[0])
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) selectFile(file)
}

function showAutoClosePopup(message: string, duration = 1500) {
  popupMessage.value = message
  showPopup.value = true
  setTimeout(() => {
    showPopup.value = false
  }, duration)
}

function selectFile(file: File) {
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/zip",
    "application/x-zip-compressed"
  ]
  const maxSize = 25 * 1024 * 1024 // 25MB

  if (!allowedTypes.includes(file.type)) {
    showAutoClosePopup("Unsupported file format. Please upload PDF, PNG, JPG or ZIP.")
    return
  }

  if (file.size > maxSize) {
    showAutoClosePopup("File is too large. Maximum size is 25MB.")
    return
  }

  (window as any).myFile = file
  const fileUrl = URL.createObjectURL(file)

  router.push({
    name: "previewFile",
    query: {
      fileUrl: fileUrl,
      fileName: file.name
    }
  })
}

</script>

<template>
  <div class="upload-container">

    <!-- Drag and Drop -->
    <div class="drop-zone" @drop="handleDrop" @dragover="handleDragOver" @click="triggerFileInput">

      <!-- Upload icon -->
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" aria-hidden="true" focusable="false" viewBox="0 0 448 512">
        <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z"/>
      </svg>
      <div class="text">DROP FILE</div>
      <input type="file" id="fileInput" ref="fileInputRef" hidden @change="handleFileChange"/>
    </div>
    
    <!-- File Select Button -->
    <input type="file" id="fileInput" hidden @change="handleFileChange" />
    <label for="fileInput" class="file-select-button">SELECT FILE</label>

    <!-- Popup ALert -->
    <Popup :show="showPopup" :message="popupMessage" @close="showPopup = false" />

  </div>
</template>


<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.text {
  margin-top: 8px;
  font-size: 18px;
  color: white;
  font-weight: 500;
}

.icon {
  width: 3em;
  height: 5em;
  vertical-align: -0.125em;
}

/* Drop Zone Style */
.drop-zone {
  width: 800px;
  height: 300px;
  background-color: #d9d9d9;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* File Select Button */
.file-select-button {
  background-color: #4b255f;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  user-select: none;
  display: inline-block;
  margin-top: 15px;
  width: 200px;
  text-align: center;
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