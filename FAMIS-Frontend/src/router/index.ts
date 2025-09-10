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
      path: '/for-check/:fileId',
      name: 'verificationDocument',
      component: VerificationDocumentView ,
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
    ,
    {
      path: '/archive',
      name: 'archive',
      component: ArchiveView,
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

  // ถ้า login แล้วไป /login ให้ redirect ตาม role
  if (to.path === '/login' && isAuthenticated) {
    if (role === 'admin') {
      next('/admin')
    } else {
      next('/')
    }
    return
  }

  // ถ้าไม่ login แล้วไปหน้า protected
  if (!isAuthenticated && to.path !== '/login' && to.path !== '/callback') {
    next('/login')
    return
  }

  // Admin-only routes
  const adminOnlyPrefixes = ['/admin', '/for-check', '/archive']
  if (adminOnlyPrefixes.some(prefix => to.path.startsWith(prefix)) && role !== 'admin') {
    next('/') // staff redirect home
    return
  }

  // อย่าบังคับ redirect อัตโนมัติบน refresh; ปล่อยให้คงหน้าเดิม
  // แต่ถ้าเข้า root และเป็น admin ครั้งแรก ให้ส่งไป /admin
  if (to.path === '/' && isAuthenticated && role === 'admin' && from.path === '/') {
    next('/admin')
    return
  }

  next()
})

export default router
