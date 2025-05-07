import React, { useEffect, useState, useCallback, memo } from 'react';
import { FaEye, FaEdit, FaTrash, FaHome, FaSearch, FaUser, FaBuilding, FaFilter } from 'react-icons/fa';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../../services/cliente.service';
import { deleteInmueble } from '../../services/inmueble.service';
import documentoService from '../../services/documento.service';
import DetalleCliente from './detalleCliente';
import { getInmueblesByCliente } from '../../services/inmueble.service';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import InmuebleByCliente from '../inmueble/inmuebleByCliente';
import './clienteManager.css';

interface Cliente {
    id: number;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    rfc?: string;
    razonSocial?: string;
    representanteLegal?: string;
    fechaNacimiento?: string;
    fechaConstitucion?: string;
    correo?: string;
    telefono?: string;
    tipoPersona: string;
}

interface ClienteRowProps {
    cliente: Cliente;
    tipoPersonaFiltro: string;
    openDetalleCliente: (rfc: string) => void;
    handleEdit: (cliente: Cliente) => void;
    openModal: (id: number) => void;
    handleFetchInmuebles: (id: number) => void;
}

interface VirtualizedClienteListProps {
    clientes: Cliente[];
    tipoPersonaFiltro: string;
    openDetalleCliente: (rfc: string) => void;
    handleEdit: (cliente: Cliente) => void;
    openModal: (id: number) => void;
    handleFetchInmuebles: (id: number) => void;
}

// Función auxiliar para formatear fechas correctamente
const formatearFecha = (fechaString?: string): string => {
    if (!fechaString) return 'N/A';
    try {
        // Crear la fecha con configuración UTC explícita para evitar desplazamiento por zona horaria
        const fecha = new Date(fechaString);
        
        // Ajuste para compensar el desplazamiento horario
        const fechaAjustada = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60 * 1000);
        
        // Formatear la fecha con opciones explícitas
        return fechaAjustada.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            timeZone: 'UTC'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'N/A';
    }
};

// Obtener el tipo de usuario desde localStorage
const tipoUsuario = localStorage.getItem('tipo_usuario');

// Componente memorizado para la fila de cliente
const ClienteRow = memo<ClienteRowProps>(({
    cliente,
    tipoPersonaFiltro,
    openDetalleCliente,
    handleEdit,
    openModal,
    handleFetchInmuebles
}) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors duration-200">
            {tipoPersonaFiltro === 'fisica' ? (
                <>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{cliente.nombre}</td>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{`${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}</td>
                    <td className="py-4 px-4 whitespace-nowrap font-medium text-gray-700">{cliente.rfc}</td>
                    <td className="hidden lg:table-cell py-4 px-4 whitespace-nowrap text-gray-600">
                        {formatearFecha(cliente.fechaNacimiento)}
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                        <div className="text-sm">
                            <p className="text-gray-800 font-medium">{cliente.correo}</p>
                            <p className="text-gray-500">{cliente.telefono}</p>
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td className="py-4 px-4 whitespace-nowrap font-medium">{cliente.razonSocial}</td>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{cliente.representanteLegal}</td>
                    <td className="py-4 px-4 whitespace-nowrap font-medium text-gray-700">{cliente.rfc}</td>
                    <td className="hidden lg:table-cell py-4 px-4 whitespace-nowrap text-gray-600">
                        {formatearFecha(cliente.fechaConstitucion)}
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                        <div className="text-sm">
                            <p className="text-gray-800 font-medium">{cliente.correo}</p>
                            <p className="text-gray-500">{cliente.telefono}</p>
                        </div>
                    </td>
                </>
            )}
            <td className="py-4 px-4">
                <div className="flex justify-center space-x-2">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openDetalleCliente(cliente.rfc!)}>
                        <FaEye className="w-5 h-5 text-blue-600" />
                    </button>
                    {tipoUsuario === 'administrador' && (
                        <>
                            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => handleEdit(cliente)}>
                                <FaEdit className="w-5 h-5 text-amber-500" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openModal(cliente.id)}>
                                <FaTrash className="w-5 h-5 text-red-500" />
                            </button>
                        </>
                    )}
                    <button className="hidden sm:block p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => handleFetchInmuebles(cliente.id)}>
                        <FaHome className="w-5 h-5 text-green-600" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// Componente para virtualización de la tabla (para listas grandes)
const VirtualizedClienteList = memo<VirtualizedClienteListProps>(({
    clientes,
    tipoPersonaFiltro,
    openDetalleCliente,
    handleEdit,
    openModal,
    handleFetchInmuebles
}) => {
    // Altura aproximada de una fila
    const ROW_HEIGHT = 72;

    const ClienteItem = memo(({ index, style }: ListChildComponentProps) => {
        const cliente = clientes[index];
        return (
            <div style={style} className="border-b border-gray-200 hover:bg-slate-50">
                <div className="flex items-center px-4 py-2">
                    {tipoPersonaFiltro === 'fisica' ? (
                        <>
                            <div className="hidden md:block w-1/5 font-medium">{cliente.nombre}</div>
                            <div className="hidden md:block w-1/5">{`${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}</div>
                            <div className="w-1/5 font-medium text-gray-700">{cliente.rfc}</div>
                            <div className="hidden lg:block w-1/5 text-gray-600">
                                {formatearFecha(cliente.fechaNacimiento)}
                            </div>
                            <div className="hidden md:block w-1/5">
                                <div className="text-sm">
                                    <p className="text-gray-800 font-medium">{cliente.correo}</p>
                                    <p className="text-gray-500">{cliente.telefono}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-1/5 font-medium">{cliente.razonSocial}</div>
                            <div className="hidden md:block w-1/5">{cliente.representanteLegal}</div>
                            <div className="w-1/5 font-medium text-gray-700">{cliente.rfc}</div>
                            <div className="hidden lg:block w-1/5 text-gray-600">
                                {formatearFecha(cliente.fechaConstitucion)}
                            </div>
                            <div className="hidden md:block w-1/5">
                                <div className="text-sm">
                                    <p className="text-gray-800 font-medium">{cliente.correo}</p>
                                    <p className="text-gray-500">{cliente.telefono}</p>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="w-1/5">
                        <div className="flex justify-center space-x-1">
                            <button
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                onClick={() => openDetalleCliente(cliente.rfc!)}
                                aria-label="Ver detalles"
                            >
                                <FaEye className="w-4 h-4 text-blue-600" />
                            </button>
                            {tipoUsuario === 'administrador' && (
                                <>
                                    <button
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                        onClick={() => handleEdit(cliente)}
                                        aria-label="Editar cliente"
                                    >
                                        <FaEdit className="w-4 h-4 text-amber-500" />
                                    </button>
                                    <button
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                        onClick={() => openModal(cliente.id)}
                                        aria-label="Eliminar cliente"
                                    >
                                        <FaTrash className="w-4 h-4 text-red-500" />
                                    </button>
                                </>
                            )}
                            <button 
                                className="hidden sm:block p-2 hover:bg-slate-100 rounded-full transition-colors" 
                                onClick={() => handleFetchInmuebles(cliente.id)}>
                                <FaHome className="w-4 h-4 text-green-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    return (
        <List
            height={Math.min(600, clientes.length * ROW_HEIGHT)}
            itemCount={clientes.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            className="rounded-lg border border-gray-200 shadow-sm"
        >
            {ClienteItem}
        </List>
    );
});

const ClienteManager: React.FC = memo(() => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [tipoPersonaFiltro, setTipoPersonaFiltro] = useState<string>('fisica');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);
    const [detalleClienteRFC, setDetalleClienteRFC] = useState<string | null>(null);
    const [inmuebles, setInmuebles] = useState<number | null>(null);

    // Memoizar funciones con useCallback
    const openModal = useCallback((id: number) => {
        setClienteToDelete(id);
        setModalIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalIsOpen(false);
        setClienteToDelete(null);
    }, []);

    const openDetalleCliente = useCallback((rfc: string) => {
        setDetalleClienteRFC(rfc);
    }, []);

    const closeDetalleCliente = useCallback(() => {
        setDetalleClienteRFC(null);
    }, []);

    const handleEdit = useCallback((cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsEditing(true);
    }, []);

    const handleFetchInmuebles = useCallback((id: number) => {
        setInmuebles(id);
    }, []);

    const closehandleFetchInmuebles = useCallback(() => {
        setInmuebles(null);
    }, []);

    const handleDelete = useCallback(async (id: number) => {
        try {
            // Obtener inmuebles del cliente
            const inmuebles = await getInmueblesByCliente(id);

            // Eliminar documentos asociados a cada inmueble
            for (const inmueble of inmuebles) {
                const documentos = await documentoService.obtenerDocumentosPorInmueble(inmueble.id);
                for (const documento of documentos) {
                    await documentoService.eliminarDocumento(documento.id);
                }
                // Eliminar inmueble
                await deleteInmueble(inmueble.id);
            }

            // Eliminar cliente
            await deleteCliente(id);

            setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
            closeModal();
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            setError('Error al eliminar cliente');
            closeModal();
        }
    }, [closeModal]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleSave = useCallback(async () => {
        if (selectedCliente) {
            try {
                if (isEditing) {
                    await updateCliente(selectedCliente.id, selectedCliente);
                } else {
                    await createCliente(selectedCliente);
                }
                setSelectedCliente(null);
                setIsEditing(false);
                const response = await getClientes();
                setClientes(response);
            } catch (error) {
                console.error('Error al guardar cliente:', error);
                setError('Error al guardar cliente');
            }
        }
    }, [selectedCliente, isEditing]);

    // Memoizar el filtrado de clientes
    const filteredClientes = React.useMemo(() =>
        clientes.filter(
            (cliente) =>
                cliente.tipoPersona === tipoPersonaFiltro &&
                (
                    (cliente.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.apellidoPaterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.apellidoMaterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.rfc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.razonSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cliente.representanteLegal || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
        ), [clientes, tipoPersonaFiltro, searchTerm]);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await getClientes();
                setClientes(response);
            } catch (error) {
                console.error('Error al obtener clientes:', error);
                setError('Error al obtener clientes');
            }
        };
        fetchClientes();
    }, []);

    const handleCancelEdit = useCallback(() => {
        setSelectedCliente(null);
        setIsEditing(false);
    }, []);

    const handleChangeSelectedCliente = useCallback((field: string, value: string) => {
        setSelectedCliente(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    return (
        <div className="m-4 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-gray-800 text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-red-500 to-red-700 text-white p-2 rounded-lg inline-flex items-center justify-center shadow-sm">
                    {tipoPersonaFiltro === 'fisica' ? <FaUser className="w-5 h-5" /> : <FaBuilding className="w-5 h-5" />}
                </span>
                Gestor de Clientes
            </h2>
            
            {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <p className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar clientes..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                    />
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-gray-200 shadow-sm">
                        <FaFilter className="text-gray-500" />
                        <select
                            value={tipoPersonaFiltro}
                            onChange={(e) => setTipoPersonaFiltro(e.target.value)}
                            className="p-1 bg-transparent border-none focus:ring-0 text-gray-700"
                        >
                            <option value="fisica">Persona Física</option>
                            <option value="moral">Persona Moral</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredClientes.length > 30 ? (
                // Usar virtualización para grandes listas
                <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm mb-6">
                    <VirtualizedClienteList
                        clientes={filteredClientes}
                        tipoPersonaFiltro={tipoPersonaFiltro}
                        openDetalleCliente={openDetalleCliente}
                        handleEdit={handleEdit}
                        openModal={openModal}
                        handleFetchInmuebles={handleFetchInmuebles}
                    />
                </div>
            ) : (
                // Renderizado responsivo: tabla en md+ y tarjetas en móvil
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-6">
                  {/* Tabla tradicional en md+ */}
                  <table className="hidden md:table min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                      {tipoPersonaFiltro === 'fisica' ? (
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Representante</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Const.</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClientes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No hay clientes registrados.
                          </td>
                        </tr>
                      ) : (
                        filteredClientes.map((cliente) => (
                          <ClienteRow
                            key={cliente.id}
                            cliente={cliente}
                            tipoPersonaFiltro={tipoPersonaFiltro}
                            openDetalleCliente={openDetalleCliente}
                            handleEdit={handleEdit}
                            openModal={openModal}
                            handleFetchInmuebles={handleFetchInmuebles}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                  {/* Tarjetas para móvil */}
                  <div className="md:hidden flex flex-col gap-4 p-3">
                    {filteredClientes.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-white rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        No hay clientes registrados.
                      </div>
                    ) : (
                      filteredClientes.map(cliente => (
                        <div key={cliente.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow duration-200 hover:shadow-md">
                          {tipoPersonaFiltro === 'fisica' ? (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  <FaUser className="text-red-500" />
                                  {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">RFC</span>
                                  <span className="text-sm font-semibold text-gray-700">{cliente.rfc}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Fecha Nac.</span>
                                  <span className="text-sm text-gray-700">{formatearFecha(cliente.fechaNacimiento)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Correo</span>
                                  <span className="text-sm text-gray-700">{cliente.correo}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Teléfono</span>
                                  <span className="text-sm text-gray-700">{cliente.telefono}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  <FaBuilding className="text-red-500" />
                                  {cliente.razonSocial}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Representante</span>
                                  <span className="text-sm font-semibold text-gray-700">{cliente.representanteLegal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">RFC</span>
                                  <span className="text-sm text-gray-700">{cliente.rfc}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Fecha Const.</span>
                                  <span className="text-sm text-gray-700">{formatearFecha(cliente.fechaConstitucion)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Correo</span>
                                  <span className="text-sm text-gray-700">{cliente.correo}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-medium">Teléfono</span>
                                  <span className="text-sm text-gray-700">{cliente.telefono}</span>
                                </div>
                              </div>
                            </>
                          )}
                          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openDetalleCliente(cliente.rfc!)}>
                              <FaEye className="w-5 h-5 text-blue-600" />
                            </button>
                            {tipoUsuario === 'administrador' && (
                              <>
                                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => handleEdit(cliente)}>
                                  <FaEdit className="w-5 h-5 text-amber-500" />
                                </button>
                                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => openModal(cliente.id)}>
                                  <FaTrash className="w-5 h-5 text-red-500" />
                                </button>
                              </>
                            )}
                            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={() => handleFetchInmuebles(cliente.id)}>
                              <FaHome className="w-5 h-5 text-green-600" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
            )}

            {modalIsOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Estás seguro de eliminar este cliente?</h3>
                        <p className="text-gray-600 mb-6">Esta acción no se puede deshacer y se eliminarán todos los inmuebles y documentos asociados.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                                onClick={closeModal}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                onClick={() => handleDelete(clienteToDelete!)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detalleClienteRFC && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0 overflow-y-auto backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl md:max-w-4xl lg:max-w-5xl my-6 mx-auto relative animate-scaleIn">
                        <div className="flex items-center justify-between p-4 border-b rounded-t">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg">
                                    <FaEye className="w-4 h-4 text-white" />
                                </span>
                                Detalles del Cliente
                            </h3>
                            <button
                                type="button"
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 ml-auto inline-flex items-center justify-center"
                                onClick={closeDetalleCliente}
                            >
                                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 12 12M13 1 1 13" />
                                </svg>
                                <span className="sr-only">Cerrar modal</span>
                            </button>
                        </div>
                        <div className="p-4 md:p-6 overflow-y-auto max-h-[70vh]">
                            <DetalleCliente rfc={detalleClienteRFC} />
                        </div>
                        <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                onClick={closeDetalleCliente}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inmuebles && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0 overflow-y-auto backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl my-6 mx-auto relative animate-scaleIn">
                        <div className="flex items-center justify-between p-4 border-b rounded-t">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span className="p-1.5 bg-gradient-to-r from-green-500 to-green-700 rounded-lg">
                                    <FaHome className="w-4 h-4 text-white" />
                                </span>
                                Inmuebles del Cliente
                            </h3>
                            <button
                                type="button"
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 ml-auto inline-flex items-center justify-center"
                                onClick={closehandleFetchInmuebles}
                                aria-label="Cerrar"
                            >
                                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 12 12M13 1 1 13" />
                                </svg>
                                <span className="sr-only">Cerrar modal</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[70vh]">
                            <InmuebleByCliente clienteId={inmuebles} />
                        </div>
                        <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                onClick={closehandleFetchInmuebles}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedCliente && (
                <div className="bg-white rounded-xl shadow-md mt-6 p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <span className="p-1.5 bg-gradient-to-r from-amber-500 to-amber-700 rounded-lg">
                            {isEditing ? 
                                <FaEdit className="w-4 h-4 text-white" /> : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            }
                        </span>
                        {isEditing ? 'Editar Cliente' : 'Agregar Cliente'}
                    </h3>
                    <form className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={selectedCliente.nombre || ''}
                                    onChange={(e) => handleChangeSelectedCliente('nombre', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                                <input
                                    type="text"
                                    placeholder="Apellido Paterno"
                                    value={selectedCliente.apellidoPaterno || ''}
                                    onChange={(e) => handleChangeSelectedCliente('apellidoPaterno', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                                <input
                                    type="text"
                                    placeholder="Apellido Materno"
                                    value={selectedCliente.apellidoMaterno || ''}
                                    onChange={(e) => handleChangeSelectedCliente('apellidoMaterno', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                                <input
                                    type="text"
                                    placeholder="RFC"
                                    value={selectedCliente.rfc || ''}
                                    onChange={(e) => handleChangeSelectedCliente('rfc', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                                <input
                                    type="email"
                                    placeholder="Correo"
                                    value={selectedCliente.correo || ''}
                                    onChange={(e) => handleChangeSelectedCliente('correo', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    placeholder="Teléfono"
                                    value={selectedCliente.telefono || ''}
                                    onChange={(e) => handleChangeSelectedCliente('telefono', e.target.value)}
                                    className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                                onClick={handleCancelEdit}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                onClick={handleSave}
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
});

export default ClienteManager;