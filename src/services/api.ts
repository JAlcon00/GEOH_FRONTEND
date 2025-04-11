import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});


api.interceptors.request.use(
  (response) => response,
  (error) => {
     // Aquí puedes centralizar el manejo de errores:
    // - Mostrar un mensaje al usuario
    // - Redirigir a una página de error
    // - Registrar el error, etc.
    
   
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;