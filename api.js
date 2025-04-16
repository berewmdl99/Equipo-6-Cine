import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Changed to true for CORS
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request details for debugging
  console.log(`Request to ${config.url}:`, {
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  response => {
    // Log successful response
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;