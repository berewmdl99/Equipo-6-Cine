// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/', // Tu URL base de la API
});

export default api;
