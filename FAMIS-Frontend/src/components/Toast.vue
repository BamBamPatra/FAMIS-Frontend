<script setup lang="ts">
import { useToastStore } from '@/stores/popupStore'
const toast = useToastStore()
</script>

<template>
  <transition name="fade">
    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>
  </transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  animation: fadeInOut 3s ease forwards;
}

.success { background-color: #4BB543; }
.error { background-color: #E74C3C; }
.info { background-color: #9B7EBD; }

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}
</style>
