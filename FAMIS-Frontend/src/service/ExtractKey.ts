import axios from 'axios';

// During dev, prefer hitting the Vite proxy at /api to avoid CORS
const defaultBase = (typeof window !== 'undefined' && window.location?.hostname === 'localhost')
  ? '/api'
  : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000')

const apiClient = axios.create({
  baseURL: defaultBase as string,
  withCredentials: false,
  headers: {
    Accept: 'application/json',

  }
});

// Attach Authorization header automatically if access token exists
apiClient.interceptors.request.use((config) => {
  try {
    const token = sessionStorage.getItem('access_token')
    if (token) {
      config.headers = config.headers || {}
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
  } catch {
    /* no-op */
  }
  return config
})

export default {
  authorize(email: string, department?: string | null) {
    const payload: Record<string, any> = { email }
    if (department) payload.department = department
    return apiClient.post('/auth/authorize', payload, { headers: { 'Content-Type': 'application/json' } })
  },
  processFile(file: File, user?: { email?: string; user_id?: number }) {
    const formData = new FormData();
    formData.append('file', file);
    if (user?.email) formData.append('email', user.email)
    if (user?.user_id) formData.append('user_id', String(user.user_id))

    return apiClient.post('/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  saveKeys(payload: Record<string, any>) {
    return apiClient.post('/save', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  getStatus(taskId: string) {
  return apiClient.get(`/status/${taskId}`)
  },
  getDocTypes() {
  return apiClient.get('/doc-types')
  },
  getTaskBoard(params?: { user_id?: number; email?: string }) {
    const q: Record<string, any> = {}
    if (params?.user_id) q.user_id = params.user_id
    if (params?.email) q.email = params.email

    // Fallback: ensure uploader filter is always sent
    if (!q.user_id && !q.email) {
      try {
        const raw = sessionStorage.getItem('user_info')
        if (raw) {
          const u = JSON.parse(raw)
          if (typeof u?.user_id === 'number') q.user_id = u.user_id
          else if (u?.email) q.email = u.email
        }
      } catch {
        /* no-op */
      }
    }

    console.log('Calling /task-board with params:', q)

    return apiClient.get('/task-board', { params: q })
  },
  listMyUploads(payload: { user_id?: number; email?: string }) {
    return apiClient.post('/uploads/by-user', payload, { headers: { 'Content-Type': 'application/json' } })
  },
  listPendingUploads() {
    // Backend endpoint returns: { status: 'success', uploads: PendingUpload[] }
    return apiClient.get('/admin/uploads/pending')
  },
  listArchivedUploads() {
    // Backend endpoint returns: { status: 'success', uploads: ArchivedUpload[] }
    return apiClient.get('/admin/uploads/archive')
  },
  getExtractedByFile(fileId: number) {
    return apiClient.get(`/uploads/${fileId}/extracted`)
  },
  deleteTask(taskId: string) {
    return apiClient.delete(`/tasks/${taskId}`)
  },
  deleteUpload(fileId: number) {
    return apiClient.delete(`/uploads/${fileId}`)
  },
  approveUpload(fileId: number, reviewerId?: number) {
    const body: Record<string, any> = {}
    if (typeof reviewerId === 'number') body.reviewer_id = reviewerId
    return apiClient.post(`/admin/uploads/${fileId}/approve`, body)
  },
  rejectUpload(fileId: number, reason?: string, reviewerId?: number) {
    const body: Record<string, any> = { reason }
    if (typeof reviewerId === 'number') body.reviewer_id = reviewerId
    return apiClient.post(`/admin/uploads/${fileId}/reject`, body)
  },
  // Notifications
  listNotifications(params: { user_id?: number; email?: string; only_unread?: boolean }) {
    const q: Record<string, any> = {}
    if (params.user_id) q.user_id = params.user_id
    if (params.email) q.email = params.email
    if (params.only_unread) q.only_unread = 1
    return apiClient.get('/notifications', { params: q })
  },
  markNotificationRead(body: { notification_id: number; user_id?: number; email?: string }) {
    return apiClient.post('/notifications/mark-read', body)
  }
};
