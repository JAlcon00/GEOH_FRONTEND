import api from './api';

export const login = async (nombre: string, contrasena: string) => {
  const response = await api.post('/auth/login', { nombre, contrasena });
  return response.data;
};

export const registro = async (nombre: string, apellido: string, contrasena: string, tipo_usuario: string = 'usuario') => {
  const response = await api.post('/auth/registro', { nombre, apellido, contrasena, tipo_usuario });
  return response.data;
};

export const getProfile = async (token: string) => {
  const response = await api.get('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const actualizarProfile = async (token: string, data: any) => {
  const response = await api.put('/auth/profile', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const eliminarProfile = async (token: string) => {
  const response = await api.delete('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const listarUsuarios = async (token: string) => {
  const response = await api.get('/auth/usuarios', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const obtenerUsuario = async (token: string, id: number) => {
  const response = await api.get(`/auth/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const actualizarUsuario = async (token: string, id: number, data: any) => {
  const response = await api.put(`/auth/usuarios/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const eliminarUsuario = async (token: string, id: number) => {
  const response = await api.delete(`/auth/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};