import { createRouter, createWebHistory } from 'vue-router'
import UploadFile from '@/views/UploadFileView.vue'
import PreviewFile from '@/views/PreviewFileView.vue'
import TabularResultView from '@/views/TabularResultView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'
import TaskBoardView from '@/views/TaskBoardView.vue'
import LoginView from '@/views/LoginView.vue'
import CallbackView from '@/views/CallbackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView,
    },
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
      path: '/noticeBoard/:taskId',
      name: 'noticeBoard',
      component: NoticeBoardView,
    },
    {
      path: '/taskBoard',
      name: 'taskBoard',
      component: TaskBoardView,
    }

  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!sessionStorage.getItem('access_token')
  
  // If user is authenticated and trying to access login, redirect to home
  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }
  
  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && to.path !== '/login' && to.path !== '/callback') {
    next('/login')
    return
  }
  
  next()
})

export default router
