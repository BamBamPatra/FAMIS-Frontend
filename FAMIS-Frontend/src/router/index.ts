import { createRouter, createWebHistory } from 'vue-router'
import UploadFile from '@/views/UploadFileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UploadFile,
    }
  ],
})

export default router
