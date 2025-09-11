// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import UploadFile from '@/views/Staff/UploadFileView.vue'
import PreviewFile from '@/views/Staff/PreviewFileView.vue'
import TabularResultView from '@/views/Staff/TabularResultView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'
import TaskBoardView from '@/views/Staff/TaskBoardView.vue'
import CheckStatusView from '@/views/Staff/CheckStatusView.vue'
import LoginView from '@/views/LoginView.vue'
import CallbackView from '@/views/CallbackView.vue'
import AdminDashboardView from '@/views/Admin/AdminDashboardView.vue'
import ForCheckView from '@/views/Admin/ForCheckView.vue'
import VerificationDocumentView from '@/views/Admin/VerificationDocumentView.vue'
import ArchiveView from '@/views/Admin/ArchiveView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/callback', name: 'callback', component: CallbackView },

    // Admin routes
    { path: '/admin', name: 'adminDashboard', component: AdminDashboardView },
    { path: '/for-check', name: 'forCheck', component: ForCheckView },
    { path: '/for-check/:fileId', name: 'verificationDocument', component: VerificationDocumentView },
    { path: '/archive', name: 'archive', component: ArchiveView },

    // Staff routes
    { path: '/', name: 'uploadFile', component: UploadFile },
    { path: '/previewFile', name: 'previewFile', component: PreviewFile },
    { path: '/result/:taskId', name: 'tabularResult', component: TabularResultView },
    { path: '/noticeBoard/:taskId', name: 'noticeBoard', component: NoticeBoardView },
    { path: '/taskBoard', name: 'taskBoard', component: TaskBoardView },
    { path: '/history', name: 'checkStatus', component: CheckStatusView },
  ],
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!sessionStorage.getItem('access_token')
  const userInfoRaw = sessionStorage.getItem('user_info')
  let role: string | null = null

  try {
    role = userInfoRaw ? JSON.parse(userInfoRaw)?.role?.toLowerCase() || null : null
  } catch {
    role = null
  }

  if (!isAuthenticated && to.path !== '/login' && to.path !== '/callback') {
    return next('/login')
  }

  if (to.path === '/login' && isAuthenticated) {
    if (role === 'admin') return next('/admin')
    if (role === 'staff') return next('/')
  }

  // Protect admin pages from non-admin users
  const adminPaths = ['/admin', '/for-check', '/archive']
  if (adminPaths.some(p => to.path.startsWith(p))) {
    if (role !== 'admin') return next('/')
  }

  // Redirect admin away from staff home
  if (to.path === '/' && role === 'admin') {
    return next('/admin')
  }

  next()
})



export default router
