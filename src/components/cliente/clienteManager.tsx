import React, { useEffect, useState, useCallback, memo } from 'react';
import { FaEye, FaEdit, FaTrash, FaHome } from 'react-icons/fa';
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
        <tr className="hover:bg-gray-50">
            {tipoPersonaFiltro === 'fisica' ? (
                <>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{cliente.nombre}</td>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{`${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{cliente.rfc}</td>
                    <td className="hidden lg:table-cell py-4 px-4 whitespace-nowrap">
                        {cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                        <div className="text-sm">
                            <p className="text-gray-900">{cliente.correo}</p>
                            <p className="text-gray-500">{cliente.telefono}</p>
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td className="py-4 px-4 whitespace-nowrap">{cliente.razonSocial}</td>
                    <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">{cliente.representanteLegal}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{cliente.rfc}</td>
                    <td className="hidden lg:table-cell py-4 px-4 whitespace-nowrap">
                        {cliente.fechaConstitucion ? new Date(cliente.fechaConstitucion).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                        <div className="text-sm">
                            <p className="text-gray-900">{cliente.correo}</p>
                            <p className="text-gray-500">{cliente.telefono}</p>
                        </div>
                    </td>
                </>
            )}
            <td className="py-4 px-4">
                <div className="flex justify-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => openDetalleCliente(cliente.rfc!)}>
                        <FaEye className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => handleEdit(cliente)}>
                        <FaEdit className="w-5 h-5 text-yellow-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => openModal(cliente.id)}>
                        <FaTrash className="w-5 h-5 text-red-500" />
                    </button>
                    <button className="hidden sm:block p-1 hover:bg-gray-100 rounded-full" onClick={() => handleFetchInmuebles(cliente.id)}>
                        <FaHome className="w-5 h-5 text-green-500" />
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
            <div style={style} className="border-b border-gray-200">
                <div className="flex items-center px-4 py-2">
                    {tipoPersonaFiltro === 'fisica' ? (
                        <>
                            <div className="hidden md:block w-1/5">{cliente.nombre}</div>
                            <div className="hidden md:block w-1/5">{`${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}</div>
                            <div className="w-1/5">{cliente.rfc}</div>
                            <div className="hidden lg:block w-1/5">
                                {cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="hidden md:block w-1/5">
                                <div className="text-sm">
                                    <p className="text-gray-900">{cliente.correo}</p>
                                    <p className="text-gray-500">{cliente.telefono}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-1/5">{cliente.razonSocial}</div>
                            <div className="hidden md:block w-1/5">{cliente.representanteLegal}</div>
                            <div className="w-1/5">{cliente.rfc}</div>
                            <div className="hidden lg:block w-1/5">
                                {cliente.fechaConstitucion ? new Date(cliente.fechaConstitucion).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="hidden md:block w-1/5">
                                <div className="text-sm">
                                    <p className="text-gray-900">{cliente.correo}</p>
                                    <p className="text-gray-500">{cliente.telefono}</p>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="w-1/5">
                        <div className="flex justify-center space-x-2">
                            <button
                                className="p-1 hover:bg-gray-100 rounded-full"
                                onClick={() => openDetalleCliente(cliente.rfc!)}
                                aria-label="Ver detalles"
                            >
                                <FaEye className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                className="p-1 hover:bg-gray-100 rounded-full"
                                onClick={() => handleEdit(cliente)}
                                aria-label="Editar cliente"
                            >
                                <FaEdit className="w-5 h-5 text-yellow-500" />
                            </button>
                            <button
                                className="p-1 hover:bg-gray-100 rounded-full"
                                onClick={() => openModal(cliente.id)}
                                aria-label="Eliminar cliente"
                            >
                                <FaTrash className="w-5 h-5 text-red-500" />
                            </button>
                            <button 
                                className="hidden sm:block p-1 hover:bg-gray-100 rounded-full" 
                                onClick={() => handleFetchInmuebles(cliente.id)}>
                                <FaHome className="w-5 h-5 text-green-500" />
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
            className="rounded-lg border border-gray-200"
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
        <div className="m-4 p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-gray-800 text-xl md:text-2xl font-bold mb-6">Gestor de Clientes</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
                    <label className="text-gray-700 text-sm md:text-base">Tipo de Persona:</label>
                    <select
                        value={tipoPersonaFiltro}
                        onChange={(e) => setTipoPersonaFiltro(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                        <option value="fisica">Persona Física</option>
                        <option value="moral">Persona Moral</option>
                    </select>
                </div>
            </div>

            {filteredClientes.length > 30 ? (
                // Usar virtualización para grandes listas
                <VirtualizedClienteList
                    clientes={filteredClientes}
                    tipoPersonaFiltro={tipoPersonaFiltro}
                    openDetalleCliente={openDetalleCliente}
                    handleEdit={handleEdit}
                    openModal={openModal}
                    handleFetchInmuebles={handleFetchInmuebles}
                />
            ) : (
                // Renderizado normal para listas pequeñas
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {tipoPersonaFiltro === 'fisica' ? (
                                <tr>
                                    <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                                    <th className="hidden lg:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                                    <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                                    <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Representante</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                                    <th className="hidden lg:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Const.</th>
                                    <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredClientes.map((cliente) => (
                                <ClienteRow
                                    key={cliente.id}
                                    cliente={cliente}
                                    tipoPersonaFiltro={tipoPersonaFiltro}
                                    openDetalleCliente={openDetalleCliente}
                                    handleEdit={handleEdit}
                                    openModal={openModal}
                                    handleFetchInmuebles={handleFetchInmuebles}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalIsOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold">¿Estás seguro de eliminar este cliente?</h3>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                type="button"
                                className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={closeModal}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => handleDelete(clienteToDelete!)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detalleClienteRFC && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <button
                            type="button"
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                            onClick={closeDetalleCliente}
                        >
                            &times;
                        </button>
                        <DetalleCliente rfc={detalleClienteRFC} onClose={closeDetalleCliente} />
                    </div>
                </div>
            )}

            {inmuebles && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <button
                            type="button"
                            className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-2xl"
                            onClick={closehandleFetchInmuebles}
                        >
                            &times;
                        </button>
                        <InmuebleByCliente clienteId={inmuebles} />
                    </div>
                </div>
            )}

            {selectedCliente && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold">{isEditing ? 'Editar Cliente' : 'Agregar Cliente'}</h3>
                    <form className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={selectedCliente.nombre || ''}
                                onChange={(e) => handleChangeSelectedCliente('nombre', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Apellido Paterno"
                                value={selectedCliente.apellidoPaterno || ''}
                                onChange={(e) => handleChangeSelectedCliente('apellidoPaterno', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Apellido Materno"
                                value={selectedCliente.apellidoMaterno || ''}
                                onChange={(e) => handleChangeSelectedCliente('apellidoMaterno', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="RFC"
                                value={selectedCliente.rfc || ''}
                                onChange={(e) => handleChangeSelectedCliente('rfc', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Correo"
                                value={selectedCliente.correo || ''}
                                onChange={(e) => handleChangeSelectedCliente('correo', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={selectedCliente.telefono || ''}
                                onChange={(e) => handleChangeSelectedCliente('telefono', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                type="button"
                                className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={handleCancelEdit}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
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