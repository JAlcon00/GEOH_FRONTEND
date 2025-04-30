import React from 'react';
import UsuarioManager from '../components/usuario/usuarioManager';

const Usuario: React.FC = () => {
  // Bloquear acceso si no es administrador
  const tipoUsuario = localStorage.getItem('tipo_usuario');
  if (tipoUsuario !== 'administrador') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Acceso denegado</h2>
          <p className="text-gray-700">No tienes permisos para acceder a la gestión de usuarios.</p>
        </div>
      </div>
    );
  }
  return <UsuarioManager />;
};

export default Usuario;