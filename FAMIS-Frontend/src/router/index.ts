import { createRouter, createWebHistory } from 'vue-router'
import UploadFile from '@/views/UploadFileView.vue'
import PreviewFile from '@/views/PreviewFileView.vue'
import TabularResultView from '@/views/TabularResultView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'uploadFile',
      component: UploadFile,
    },
    {
      path: '/previewFile',
      name: 'previewFile',
      component: PreviewFile,
    },
    {
      path: '/result/:taskId',
      name: 'tabularResult',
      component: TabularResultView
    },
    {
      path: '/noticeBoard',
      name: 'noticeBoard',
      component: NoticeBoardView,
    }

  ],
})

export default router
