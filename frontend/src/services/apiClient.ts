import axios from 'axios';
import { API_URL, LOCAL_CONFIG, isDevelopment, authConfig } from '@/config';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 giây
});

// Request interceptor: tự động thêm token
apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem(authConfig.TOKEN_KEY);
    
    // Trong local dev, dùng mock token nếu không có token
    if (isDevelopment && !token) {
      token = LOCAL_CONFIG.MOCK_TOKEN;
      console.log('🔧 Using mock token:', token);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Unauthorized - clearing token');
      localStorage.removeItem(authConfig.TOKEN_KEY);
      localStorage.removeItem('user');
      
      // Redirect to login (nếu không phải local dev)
      if (!isDevelopment) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;