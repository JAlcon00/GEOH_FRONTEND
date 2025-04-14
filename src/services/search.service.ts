import api from './api';

export const buscarInmuebles = async (params: { direccion?: string; lat?: number; lon?: number; rfc?: string; nombre?: string }) => {
  const response = await api.get('/search', { params });
  return response.data;
};