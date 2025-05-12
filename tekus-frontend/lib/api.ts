import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5248/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service for login/logout functionality
export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/Auth/login', { username, password });
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        return response.data;
      } else {
        throw new Error('Token not received from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

export default api;