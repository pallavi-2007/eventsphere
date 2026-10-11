import axios from 'axios';

// Use VITE_API_URL in production (Vercel → Render). Fall back to /api which hits the Vite dev proxy.
const rawBase = import.meta.env.VITE_API_URL;
const baseURL = rawBase ? rawBase.replace(/\/$/, '') + '/api' : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional auto logout if token expired
      // localStorage.removeItem('eventsphere_token');
      // localStorage.removeItem('eventsphere_user');
    }
    return Promise.reject(error);
  }
);

export default api;
