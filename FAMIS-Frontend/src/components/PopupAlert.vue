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
      <p class="popup-message">{{ message }}</p> <slot /> 
    </div>
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
  padding: 0px 32px 20px 32px;
  border-radius: 12px;
  max-width: 500px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
}
</style>