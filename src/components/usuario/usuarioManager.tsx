import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { listarUsuarios, eliminarUsuario, actualizarUsuario, registro } from '../../services/auth.service';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  tipo_usuario: string;
}

const UsuarioManager: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
  const [formError, setFormError] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const token = localStorage.getItem('token');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

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
    console.log('Ver usuario', id);
  };

  const openAddModal = () => {
    setEditUser(null);
    setForm({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setEditUser(usuario);
    setForm({ nombre: usuario.nombre, apellido: usuario.apellido, contrasena: '', tipo_usuario: usuario.tipo_usuario });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setForm({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.nombre.trim() || !form.apellido.trim() || (!editUser && !form.contrasena.trim())) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }
    try {
      if (editUser) {
        await actualizarUsuario(token!, editUser.id, {
          nombre: form.nombre,
          apellido: form.apellido,
          tipo_usuario: form.tipo_usuario,
          ...(form.contrasena ? { contrasena: form.contrasena } : {})
        });
      } else {
        await registro(form.nombre, form.apellido, form.contrasena, form.tipo_usuario);
      }
      await fetchUsuarios();
      closeModal();
    } catch (err: any) {
      setFormError('Error al guardar el usuario.');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideNombre = `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase());
    const coincideTipo = filtroTipo === 'todos' || usuario.tipo_usuario === filtroTipo;
    return coincideNombre && coincideTipo;
  });

  return (
    <div className="m-2 sm:m-4 p-2 sm:p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-gray-800 text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 border-b pb-2">Gestión de Usuarios</h2>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-3 sm:mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o apellido..."
          value={filtroNombre}
          onChange={e => setFiltroNombre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent w-full md:w-64"
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent w-full md:w-52"
        >
          <option value="todos">Todos</option>
          <option value="usuario">Usuario</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>
      {tipoUsuario === 'administrador' && (
        <div className="flex justify-end mb-3 sm:mb-4">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg shadow transition-transform duration-200 transform hover:scale-105 w-full sm:w-auto"
            onClick={openAddModal}
          >
            + Agregar usuario
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-24 sm:h-32">
          <span className="text-gray-500 animate-pulse">Cargando usuarios...</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          {/* Vista de tabla en pantallas md+ y tarjetas en móviles */}
          <table className="hidden md:table min-w-[500px] w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Usuario</th>
                <th className="py-2 px-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">No hay usuarios registrados.</td>
                </tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 whitespace-nowrap">{usuario.id}</td>
                    <td className="py-3 px-2 whitespace-nowrap">{usuario.nombre}</td>
                    <td className="py-3 px-2 whitespace-nowrap">{usuario.apellido}</td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${usuario.tipo_usuario === 'administrador' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{usuario.tipo_usuario}</span>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="flex justify-center space-x-1">
                        <button onClick={() => handleVer(usuario.id)} title="Ver detalles" className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                          <FaEye />
                        </button>
                        {tipoUsuario === 'administrador' && (
                          <>
                            <button onClick={() => openEditModal(usuario)} title="Editar usuario" className="p-1 hover:bg-yellow-100 rounded-full text-yellow-600">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleEliminar(usuario.id)} title="Eliminar usuario" className="p-1 hover:bg-red-100 rounded-full text-red-600">
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Tarjetas para móviles */}
          <div className="md:hidden flex flex-col gap-3 p-1">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-white rounded-lg">No hay usuarios registrados.</div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div key={usuario.id} className="bg-white rounded-lg shadow border p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold">ID</span>
                    <span className="text-sm font-bold text-gray-700">{usuario.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold">Nombre</span>
                    <span className="text-sm text-gray-700">{usuario.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold">Apellido</span>
                    <span className="text-sm text-gray-700">{usuario.apellido}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold">Tipo</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${usuario.tipo_usuario === 'administrador' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{usuario.tipo_usuario}</span>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => handleVer(usuario.id)} title="Ver detalles" className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                      <FaEye />
                    </button>
                    {tipoUsuario === 'administrador' && (
                      <>
                        <button onClick={() => openEditModal(usuario)} title="Editar usuario" className="p-1 hover:bg-yellow-100 rounded-full text-yellow-600">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleEliminar(usuario.id)} title="Eliminar usuario" className="p-1 hover:bg-red-100 rounded-full text-red-600">
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 px-2 sm:px-0">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closeModal}
              title="Cerrar"
            >
              &times;
            </button>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 border-b pb-2">{editUser ? 'Editar usuario' : 'Agregar usuario'}</h3>
            {formError && <p className="text-red-500 mb-2">{formError}</p>}
            <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4">
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleFormChange}
                placeholder="Nombre"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                required
              />
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleFormChange}
                placeholder="Apellido"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                required
              />
              {!editUser && (
                <input
                  type="password"
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleFormChange}
                  placeholder="Contraseña"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  required
                />
              )}
              <select
                name="tipo_usuario"
                value={form.tipo_usuario}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                required
              >
                <option value="usuario">Usuario</option>
                <option value="administrador">Administrador</option>
              </select>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-4">
                <button type="button" onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg w-full sm:w-auto">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuarioManager;