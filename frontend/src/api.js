import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a response interceptor for logging errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default api;
