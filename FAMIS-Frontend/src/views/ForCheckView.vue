<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import ExtractKey from '@/service/ExtractKey'

type PendingStatus = 'pending' | 'approved' | 'rejected'

interface PendingUpload {
  file_id: number
  file_name: string
  uploaded_at: string
  uploaded_by?: string
  uploader_email?: string
  uploader_department?: string
  status?: PendingStatus
  size?: string | number
}

const loading = ref(false)
const error = ref('')
const uploads = ref<PendingUpload[]>([])

const searchQuery = ref('')
const statusFilter = ref<'all' | PendingStatus>('all')

async function fetchPending() {
  loading.value = true
  error.value = ''
  try {
    const res = await ExtractKey.listPendingUploads()
    uploads.value = Array.isArray(res.data?.uploads) ? res.data.uploads : []
  } catch (e: any) {
    const detail = e?.response?.data?.message || e?.message || JSON.stringify(e)
    error.value = `Failed to load pending uploads: ${detail}`
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const st = statusFilter.value
  return uploads.value.filter(u => {
    const nameMatch = !q || (u.file_name || '').toLowerCase().includes(q)
    const stMatch = st === 'all' || (u.status || 'pending') === st
    return nameMatch && stMatch
  })
})

function fmtDate(ts?: string) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

function fmtTime(ts?: string) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

onMounted(fetchPending)
</script>

<template>
  <div class="container">
    <div class="header-row">
      <h2 class="title">Waiting for check</h2>
      <div class="actions">
        <button class="icon-btn" title="Refresh" @click="fetchPending" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512"><path d="M256 64c106 0 192 86 192 192h48L416 352 336 256h64c0-79.5-64.5-144-144-144s-144 64.5-144 144 64.5 144 144 144c38.2 0 73-15 98.6-39.4l34 34C351.8 426.2 306 448 256 448 150 448 64 362 64 256S150 64 256 64z"/></svg>
        </button>
      </div>
    </div>

    <div class="search-bar">
      <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512"><path d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"/></svg>
      <input v-model="searchQuery" class="search-input" placeholder="Search filename..." />
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="filtered.length === 0" class="empty">No pending uploads.</div>

    <div v-else class="list">
      <div v-for="u in filtered" :key="u.file_id" class="item">
        <div class="left">
          <div class="name">{{ u.file_name }} <span class="muted">waiting for check</span></div>
          <div class="dept">{{ u.uploader_department || '-' }}</div>
        </div>
        <div class="right">
          <div class="time">{{ fmtTime(u.uploaded_at) }}</div>
          <div class="date">{{ fmtDate(u.uploaded_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.header-row { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 20px; font-weight: 700; }
.actions { display: flex; gap: 8px; }
.icon-btn { border: 1px solid #ddd; background: white; padding: 8px; border-radius: 8px; cursor: pointer; }
.icon-btn:disabled { opacity: .6; cursor: not-allowed; }

.search-bar { position: relative; display: flex; align-items: center; background: #eee; border-radius: 999px; padding: 8px 12px; }
.search-icon { width: 18px; height: 18px; fill: #555; margin-right: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; }

.error { color: #b91c1c; margin-top: 8px; }
.empty { color: #6b7280; margin-top: 12px; }
.list { display: flex; flex-direction: column; gap: 0; margin-top: 8px; }
.item { display: flex; justify-content: space-between; align-items: center; padding: 14px 4px; border-bottom: 1px solid #ddd; }
.left .name { font-weight: 700; }
.left .name .muted { font-weight: 400; color: #555; margin-left: 6px; }
.left .dept { color: #777; font-size: 12px; margin-top: 2px; }
.right { text-align: right; color: #555; }
.right .time { font-size: 14px; }
.right .date { font-size: 12px; }
</style>


