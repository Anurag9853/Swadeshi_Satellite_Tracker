import axios from 'axios';

console.log("🔥 VITE_BACKEND_URL =", import.meta.env.VITE_BACKEND_URL);


const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL + '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error', error?.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
