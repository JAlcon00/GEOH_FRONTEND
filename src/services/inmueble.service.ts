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
  try {
    console.log(`Buscando inmuebles para el cliente ID: ${clienteId}`);
    
    // Llamar al endpoint específico para obtener inmuebles por cliente
    const response = await api.get(`/inmuebles/cliente/${clienteId}`);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('La respuesta no contiene un array de inmuebles:', response.data);
      return [];
    }
    
    // Verificar que cada elemento tenga el clienteId correcto
    const inmuebles = response.data
      .filter((inmueble: any) => inmueble.clienteId === clienteId) // Filtro adicional de seguridad
      .map((inmueble: any) => {
        // Aplicar transformación de URL para la foto
        if (inmueble.foto) {
          inmueble.foto = getGCSImageUrl(inmueble.foto);
        }
        return inmueble;
      });
    
    console.log(`Encontrados ${inmuebles.length} inmuebles para el cliente ID: ${clienteId}`);
    return inmuebles;
  } catch (error) {
    console.error(`Error al obtener inmuebles para el cliente ID: ${clienteId}`, error);
    throw error;
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