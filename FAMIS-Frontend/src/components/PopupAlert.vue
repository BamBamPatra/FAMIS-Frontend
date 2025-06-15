<script setup lang="ts">
defineProps<{
  show: boolean;
  message: string; // Add message to props
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();


</script>

<template>
  <div v-if="show" class="popup">
    <div class="popup-content">
      <p class="popup-message">{{ message }}</p> <slot /> </div>
  </div>
</template>

<style scoped>
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
  max-width: 500px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.popup-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.popup-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
  transition: color 0.2s ease;
}

.popup-close:hover {
  color: #555;
}

.popup-message {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}
</style>