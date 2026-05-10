import axios from 'axios';
import { attachApiAuthInterceptors } from './attachApiAuthInterceptors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachApiAuthInterceptors(api, API_BASE_URL);

export default api;
