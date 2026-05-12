import axios from 'axios';

const api = axios.create({
  baseURL: 'https://coursesphere-backend-xxud.onrender.com/api', //porta no render
});

// Interceptor: Antes de qualquer requisição sair, ele roda esse código para adicionar o token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@CourseSphere:token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;