import React, { useEffect, useState, useCallback, memo } from 'react';
import { FaEye, FaEdit, FaTrash, FaSearch, FaUser, FaUserShield, FaFilter } from 'react-icons/fa';
import { listarUsuarios, eliminarUsuario, actualizarUsuario, registro } from '../../services/auth.service';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  tipo_usuario: string;
}

interface UsuarioRowProps {
  usuario: Usuario;
  openEditModal: (usuario: Usuario) => void;
  openEliminarModal: (id: number) => void;
}

// Componente memorizado para la fila de usuario
const UsuarioRow = memo<UsuarioRowProps>(({
  usuario,
  openEditModal,
  openEliminarModal
}) => {
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  return (
    <tr className="hover:bg-slate-50 transition-colors duration-200">
      <td className="py-3 px-4 whitespace-nowrap">{usuario.id}</td>
      <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-700">{usuario.nombre}</td>
      <td className="py-3 px-4 whitespace-nowrap">{usuario.apellido}</td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          usuario.tipo_usuario === 'administrador' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {usuario.tipo_usuario}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex justify-center space-x-2">
          
          {tipoUsuario === 'administrador' && (
            <>
              <button 
                onClick={() => openEditModal(usuario)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Editar usuario"
              >
                <FaEdit className="w-5 h-5 text-amber-500" />
              </button>
              <button 
                onClick={() => openEliminarModal(usuario.id)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Eliminar usuario"
              >
                <FaTrash className="w-5 h-5 text-red-500" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

const UsuarioManager: React.FC = memo(() => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [eliminarModalIsOpen, setEliminarModalIsOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const token = localStorage.getItem('token');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  // Memoizar funciones con useCallback
  const fetchUsuarios = useCallback(async () => {
    if (!token) {
      console.error("Token no encontrado en localStorage, por favor inicie sesión.");
      return null;
    }
    setLoading(true);
    try {
      const data = await listarUsuarios(token);
      setUsuarios(data);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleEliminar = useCallback(async (id: number) => {
    if (!token) return;
    try {
      await eliminarUsuario(token, id);
      setUsuarios(prevUsuarios => prevUsuarios.filter(usuario => usuario.id !== id));
      setEliminarModalIsOpen(false);
      setUsuarioToDelete(null);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  }, [token]);

  const openEliminarModal = useCallback((id: number) => {
    setUsuarioToDelete(id);
    setEliminarModalIsOpen(true);
  }, []);

  const closeEliminarModal = useCallback(() => {
    setEliminarModalIsOpen(false);
    setUsuarioToDelete(null);
  }, []);

  const handleVer = useCallback((id: number) => {
    console.log('Ver usuario', id);
    // Implementar visualización detallada del usuario
  }, []);

  const openAddModal = useCallback(() => {
    setEditUser(null);
    setForm({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
    setFormError('');
    setModalIsOpen(true);
  }, []);

  const openEditModal = useCallback((usuario: Usuario) => {
    setEditUser(usuario);
    setForm({ 
      nombre: usuario.nombre, 
      apellido: usuario.apellido, 
      contrasena: '', 
      tipo_usuario: usuario.tipo_usuario 
    });
    setFormError('');
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    setEditUser(null);
    setForm({ nombre: '', apellido: '', contrasena: '', tipo_usuario: 'usuario' });
    setFormError('');
  }, []);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
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
        // Actualizar usuario en el estado local inmediatamente para reflejar los cambios
        setUsuarios(prevUsuarios => prevUsuarios.map(user => 
          user.id === editUser.id 
            ? { ...user, nombre: form.nombre, apellido: form.apellido, tipo_usuario: form.tipo_usuario }
            : user
        ));
      } else {
        await registro(form.nombre, form.apellido, form.contrasena, form.tipo_usuario);
        // Refrescar la lista completa de usuarios al agregar uno nuevo
        await fetchUsuarios();
      }
      closeModal();
    } catch (err: any) {
      setFormError('Error al guardar el usuario.');
    }
  }, [form, editUser, token, fetchUsuarios, closeModal]);

  // Memoizar el filtrado de usuarios
  const usuariosFiltrados = React.useMemo(() =>
    usuarios.filter(usuario => {
      const coincideNombre = `${usuario.nombre} ${usuario.apellido}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const coincideTipo = filtroTipo === 'todos' || usuario.tipo_usuario === filtroTipo;
      return coincideNombre && coincideTipo;
    }), 
  [usuarios, searchTerm, filtroTipo]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return (
    <div className="m-4 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-gray-800 text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-2 rounded-lg inline-flex items-center justify-center shadow-sm">
          <FaUserShield className="w-5 h-5" />
        </span>
        Gestor de Usuarios
      </h2>
      
      {formError && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {formError}
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200 shadow-sm">
            <FaFilter className="text-gray-500" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="p-1 bg-transparent border-none focus:ring-0 text-gray-700"
            >
              <option value="todos">Todos</option>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
        </div>
        
        {tipoUsuario === 'administrador' && (
          <div className="ml-auto">
            <button
              className="bg-gradient-to-r from-green-600 to-green-700 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-2"
              onClick={openAddModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Agregar Usuario
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-6">
          <table className="hidden md:table min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <UsuarioRow
                    key={usuario.id}
                    usuario={usuario}
                    openEditModal={openEditModal}
                    openEliminarModal={openEliminarModal}
                  />
                ))
              )}
            </tbody>
          </table>
          <div className="md:hidden flex flex-col gap-4 p-3">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-white rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                No hay usuarios registrados.
              </div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div key={usuario.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      {usuario.tipo_usuario === 'administrador' ? 
                        <FaUserShield className="text-blue-500" /> : 
                        <FaUser className="text-blue-500" />
                      }
                      {usuario.nombre} {usuario.apellido}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">ID</span>
                      <span className="text-sm font-semibold text-gray-700">{usuario.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">Tipo</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        usuario.tipo_usuario === 'administrador' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {usuario.tipo_usuario}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => handleVer(usuario.id)}>
                      <FaEye className="w-5 h-5 text-blue-600" />
                    </button>
                    {tipoUsuario === 'administrador' && (
                      <>
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openEditModal(usuario)}>
                          <FaEdit className="w-5 h-5 text-amber-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openEliminarModal(usuario.id)}>
                          <FaTrash className="w-5 h-5 text-red-500" />
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
      
      {modalIsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md transform transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg">
                {editUser ? 
                  <FaEdit className="w-4 h-4 text-white" /> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                }
              </span>
              {editUser ? 'Editar Usuario' : 'Agregar Usuario'}
            </h3>
            {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleFormChange}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleFormChange}
                  placeholder="Apellido"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  required
                />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    name="contrasena"
                    value={form.contrasena}
                    onChange={handleFormChange}
                    placeholder="Contraseña"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    required={!editUser}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                <select
                  name="tipo_usuario"
                  value={form.tipo_usuario}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  required
                >
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {eliminarModalIsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md transform transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Estás seguro de eliminar este usuario?</h3>
            <p className="text-gray-600 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                onClick={closeEliminarModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                onClick={() => handleEliminar(usuarioToDelete!)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default UsuarioManager;