import api from './api';
import { IInmueble } from '../types/inmueble.types';

const getGCSImageUrl = (filename: string): string => {
  // Si el filename ya es una URL completa, se devuelve tal cual
  if (filename.startsWith('http')) {
    return filename;
  }
  const bucketName = import.meta.env.VITE_GOOGLE_BUCKET_NAME || 'geohi';
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
};

export const getInmuebles = async () => {
  const response = await api.get('/inmuebles');
  return response.data;
};


export const getInmuebleById = async (id: number) => {
  const response = await api.get(`/inmuebles/${id}`);
  const inmueble = response.data;
  if (inmueble.foto) {
    inmueble.foto = getGCSImageUrl(inmueble.foto);
  }
  return inmueble;
};


export const getInmueblesByCliente = async (clienteId: number) => {
  const response = await api.get(`/inmuebles/cliente/${clienteId}`);
  const inmuebles = response.data.map((inmueble: any) => {
    if (inmueble.foto) {
      inmueble.foto = getGCSImageUrl(inmueble.foto);
    }
    return inmueble;
  });
  return inmuebles;
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