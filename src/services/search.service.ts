import api from './api';

export const buscarInmuebles = async (params: { direccion?: string; lat?: number; lon?: number; rfc?: string }) => {
  const response = await api.get('/search', { params });
  return response.data;
};