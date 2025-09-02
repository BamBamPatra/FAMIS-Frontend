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
  listMyUploads(payload: { user_id?: number; email?: string }) {
    return apiClient.post('/uploads/by-user', payload, { headers: { 'Content-Type': 'application/json' } })
  },
  listPendingUploads() {
    // Backend endpoint returns: { status: 'success', uploads: PendingUpload[] }
    return apiClient.get('/admin/uploads/pending')
  },
  getExtractedByFile(fileId: number) {
    return apiClient.get(`/uploads/${fileId}/extracted`)
  },
  approveUpload(fileId: number) {
    return apiClient.post(`/admin/uploads/${fileId}/approve`)
  },
  rejectUpload(fileId: number, reason?: string) {
    return apiClient.post(`/admin/uploads/${fileId}/reject`, { reason })
  }
};
