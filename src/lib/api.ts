import axios from 'axios';

// const API_BASE = 'https://cgpropertyapi.digilogy.dev/api';
const API_BASE = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cg_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cg_token');
      localStorage.removeItem('cg_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
