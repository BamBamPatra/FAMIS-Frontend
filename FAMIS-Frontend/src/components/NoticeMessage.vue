<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  status: 'processing' | 'complete' | 'error'
  time?: string
  message: string
  clickable?: boolean
}>()

const emit = defineEmits(['click'])
</script>

<template>
  <div
    class="noti-box"
    :class="status"
    :style="{ cursor: clickable ? 'pointer' : 'default' }"
    @click="clickable && emit('click')"
  >
    <div class="noti-icon">
      <template v-if="status === 'complete'">
        <div class="circle-icon success">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="white" d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/>
          </svg>
        </div>
      </template>
      <template v-else-if="status === 'error'">
        <div class="circle-icon error">✖️</div>
      </template>
      <template v-else>
        <div class="doc-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="white" d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          </svg>
        </div>
      </template>
    </div>
    
    <div class="noti-text">
      <div v-if="time" class="noti-time">{{ time }}</div>
      <div class="noti-message">{{ message }}</div>
    </div>
  </div>
</template>


<style scoped>
.noti-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #ddd;
  max-width: 700px;
  cursor: default;
}

.noti-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.circle-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-icon.success {
  background-color: black;
}

.doc-icon {
  width: 48px;
  height: 48px;
  background-color: black;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.noti-text {
  display: flex;
  flex-direction: column;
}

.noti-time {
  font-size: 1rem;
  font-weight: 500;
  color: #111;
}

.noti-message {
  font-size: 1.15rem;
  font-weight: 400;
  color: #111;
}

</style>
