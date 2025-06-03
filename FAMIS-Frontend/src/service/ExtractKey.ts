import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5001',  
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    
  }
});

export default {
  processFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'  
      }
    });
  },
  saveKeys(keys: Array<Record<string, any>>) {
    return apiClient.post('/save', keys, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
