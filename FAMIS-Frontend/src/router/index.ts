import { createRouter, createWebHistory } from 'vue-router'
import UploadFile from '@/views/UploadFileView.vue'
import PreviewFile from '@/views/PreviewFileView.vue'
import TabularResultView from '@/views/TabularResultView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'
import TaskBoardView from '@/views/TaskBoardView.vue'
import CheckStatusView from '@/views/CheckStatusView.vue'
import LoginView from '@/views/LoginView.vue'
import CallbackView from '@/views/CallbackView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import ForCheckView from '@/views/ForCheckView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/admin',
      name: 'adminDashboard',
      component: AdminDashboardView,
    },
    {
      path: '/for-check',
      name: 'forCheck',
      component: ForCheckView,
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
    ,
    {
      path: '/history',
      name: 'checkStatus',
      component: CheckStatusView,
    }

  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!sessionStorage.getItem('access_token')
  const userInfoRaw = sessionStorage.getItem('user_info')
  let role: string | null = null
  try {
    role = userInfoRaw ? (JSON.parse(userInfoRaw)?.role || null) : null
  } catch {
    role = null
  }

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

  // Admin-only routes
  const adminOnlyPrefixes = ['/admin', '/for-check', '/archive']
  if (adminOnlyPrefixes.some(prefix => to.path.startsWith(prefix))) {
    if (role !== 'admin') {
      next('/')
      return
    }
  }

  next()
})

export default router
