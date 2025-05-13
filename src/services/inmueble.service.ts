import api from './api';
import { IInmueble } from '../types/inmueble.types';

export const getInmuebles = async () => {
  const response = await api.get('/inmuebles');
  return response.data;
};

export const getInmuebleById = async (id: number) => {
  const response = await api.get(`/inmuebles/${id}`);
  const inmueble = response.data;
  return inmueble; // Asumimos que el backend ya proporciona la URL firmada
};

export const getInmueblesByCliente = async (clienteId: number) => {
  try {
    console.log(`Buscando inmuebles para el cliente ID: ${clienteId}`);
    const response = await api.get(`/inmuebles/cliente/${clienteId}`);

    if (!response.data || !Array.isArray(response.data)) {
      console.error('La respuesta no contiene un array de inmuebles:', response.data);
      return [];
    }

    return response.data; // Asumimos que el backend ya proporciona las URLs firmadas
  } catch (err) {
    console.error('Error al obtener inmuebles por cliente:', err);
    throw err;
  }
};

export const createInmueble = async (inmueble: any) => {
  const response = await api.post('/inmuebles', inmueble);
  return response.data;
};

export const updateInmueble = async (id: number, inmueble: IInmueble): Promise<IInmueble> => {
  const response = await api.put(`/inmuebles/${id}`, inmueble);
  return response.data;
};

export const deleteInmueble = async (id: number) => {
  const response = await api.delete(`/inmuebles/${id}`);
  return response.data;
};