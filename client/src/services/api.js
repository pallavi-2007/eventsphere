import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
