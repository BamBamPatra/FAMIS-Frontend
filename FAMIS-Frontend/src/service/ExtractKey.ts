import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000',  
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    
  }
});

export default {
  authorize(email: string, department?: string | null) {
    const payload: Record<string, any> = { email }
    if (department) payload.department = department
    return apiClient.post('/auth/authorize', payload, { headers: { 'Content-Type': 'application/json' } })
  },
  processFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

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
  }
};
