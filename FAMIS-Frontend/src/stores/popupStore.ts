import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const show = ref(false)
  const message = ref('')
  const type = ref<'success' | 'error' | 'info'>('success')

  function trigger(msg: string, msgType: 'success' | 'error' | 'info' = 'success') {
    message.value = msg
    type.value = msgType
    show.value = true
    setTimeout(() => (show.value = false), 5000)
  }

  return { show, message, type, trigger }
})
