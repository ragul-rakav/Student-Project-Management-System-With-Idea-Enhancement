import axios from 'axios';

// Detect API base URL from Vite environment variables (e.g. on Vercel pointing to Railway)
const rawApiUrl = import.meta.env.VITE_API_URL;
let calculatedBaseUrl = '/api';

if (rawApiUrl && typeof rawApiUrl === 'string' && rawApiUrl.trim() !== '') {
  const cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
  calculatedBaseUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

export const API_BASE_URL = calculatedBaseUrl;

// Helper to resolve uploaded asset URLs if stored on the server
export const getUploadUrl = (relativePath) => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  if (rawApiUrl) {
    const origin = rawApiUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    return `${origin}${cleanPath}`;
  }
  return cleanPath;
};

const api = axios.create({
  baseURL: calculatedBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('projecthub_jwt');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
