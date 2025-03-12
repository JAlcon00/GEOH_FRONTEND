import api from './api';

export const getClientes = async () => {
  const response = await api.get('/clientes');
  return response.data;
};

export const getClienteById = async (id: number) => {
  const response = await api.get(`/clientes/${id}`);
  return response.data;
};

export const getClienteByRFC = async (rfc: string) => {
  const response = await api.get(`/clientes/rfc/${rfc}`);
  return response.data;
};

export const createCliente = async (cliente: any) => {
  const response = await api.post('/clientes', cliente);
  return response.data;
};

export const updateCliente = async (id: number, cliente: any) => {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data;
};

export const deleteCliente = async (id: number) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};

