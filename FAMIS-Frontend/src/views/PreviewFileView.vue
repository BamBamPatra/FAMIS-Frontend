<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import ExtractKey from '@/service/ExtractKey.ts' 

const route = useRoute()
const router = useRouter()

const pdfUrl = ref<string | null>(null)
const selectedFileName = ref<string | null>(null)
const file = ref<File | null>(null)

onMounted(() => {
  const fileUrl = route.query.fileUrl as string | null
  const fileName = route.query.fileName as string | null

  if (fileUrl) pdfUrl.value = fileUrl
  if (fileName) selectedFileName.value = fileName

  file.value = (window as any).myFile || null
  if (!file.value) {
    alert('No file data found to upload.')
  }
})

async function handleUpload() {
  if (!file.value) {
    alert('No file selected for upload.')
    return
  }

  try {
    const response = await ExtractKey.processFile(file.value)
    console.log('Response from backend:', response.data)  
    alert('Upload success! Check console for response.')
  } catch (error) {
    alert('Upload failed. Please try again.')
    console.error(error)
  }
}


function handleCancel() {
  router.push({ name: 'uploadFile' })
}

</script>

<template>
  <div class="file-upload-wrapper" v-if="pdfUrl">

    <!-- Display File Name -->
    <div v-if="selectedFileName" class="file-name" @click="pdfUrl && window.open(pdfUrl, '_blank')">
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
</template>

<style scoped>
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.file-name {
  cursor: pointer;
  color: #6a347f;
  font-weight: bold;
  margin-bottom: 8px;
  user-select: text;
  text-decoration: underline;
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
</style>
