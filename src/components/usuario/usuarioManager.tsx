import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { listarUsuarios, eliminarUsuario } from '../../services/auth.service';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  tipo_usuario: string;
}

const UsuarioManager: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Se asume que el token se almacena, por ejemplo, en localStorage.
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    if (!token) {
      console.error("Token no encontrado en localStorage, por favor inicie sesión.");
      return null;
    }
    setLoading(true);
    try {
      const data = await listarUsuarios(token);
      console.log("Usuarios recibidos:", data);
      setUsuarios(data);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!token) return;
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await eliminarUsuario(token, id);
        setUsuarios(usuarios.filter(usuario => usuario.id !== id));
      } catch (error) {
        console.error('Error eliminando usuario:', error);
      }
    }
  };

  const handleVer = (id: number) => {
    // Aquí se podría abrir un modal o redirigir a una página de detalle.
    console.log('Ver usuario', id);
  };

  const handleEditar = (id: number) => {
    // Aquí se podría abrir un formulario para actualizar el usuario.
    console.log('Editar usuario', id);
  };

  return (
    <div className="m-4 p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-gray-800 text-xl md:text-2xl font-bold mb-6">Administración de Usuarios</h2>
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Usuario</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map(usuario => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">{usuario.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{usuario.nombre}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{usuario.apellido}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{usuario.tipo_usuario}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleVer(usuario.id)} title="Ver detalles" className="p-1 hover:bg-gray-100 rounded-full">
                        <FaEye />
                      </button>
                      <button onClick={() => handleEditar(usuario.id)} title="Editar usuario" className="p-1 hover:bg-gray-100 rounded-full">
                        <FaEdit />
                      </button>
                      
                      <button onClick={() => handleEliminar(usuario.id)} title="Eliminar usuario" className="p-1 hover:bg-gray-100 rounded-full">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsuarioManager;