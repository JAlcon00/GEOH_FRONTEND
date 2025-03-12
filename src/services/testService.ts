import api from './api';

export const testConnection = async () => {
  const response = await api.get('/ping');
  return response.data;
};