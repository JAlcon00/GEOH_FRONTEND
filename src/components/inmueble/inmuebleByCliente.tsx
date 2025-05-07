import React, { useEffect, useState, useCallback, memo } from 'react';
import { getInmueblesByCliente, deleteInmueble } from '../../services/inmueble.service';
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaFileAlt, FaCamera, FaCalendarAlt, FaEdit, FaTrash, FaFolderOpen } from 'react-icons/fa';
import DocumentoService from '../../services/documento.service';
import DocumentoManager from '../documento/documentoManager';
import './inmuebleByCliente.css';

interface Inmueble {
  id: number;
  clienteId: number;
  direccion: string;
  valorMercado: number;
  foto?: string;
  estatus: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Documento {
  id: number;
  inmuebleId: number;
  tipo: string;
  url: string;
  nombre: string;
}

interface InmuebleWithDocumentos extends Inmueble {
  documentos?: Documento[];
}

interface InmuebleByClienteProps {
  clienteId: number;
}

const InmuebleByCliente: React.FC<InmuebleByClienteProps> = memo(({ clienteId }) => {
  const [inmuebles, setInmuebles] = useState<InmuebleWithDocumentos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [showExpediente, setShowExpediente] = useState(false);
  const [selectedInmueble, setSelectedInmueble] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inmuebleToDelete, setInmuebleToDelete] = useState<number | null>(null);

  const fetchInmuebles = useCallback(async () => {
    if (!clienteId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await getInmueblesByCliente(clienteId);
      
      const inmueblesConDocumentos: InmuebleWithDocumentos[] = await Promise.all(
        data.map(async (inmueble: Inmueble) => {
          try {
            const documentos = await DocumentoService.obtenerDocumentosPorInmueble(inmueble.id);
            return {
              ...inmueble,
              documentos
            };
          } catch (error) {
            console.error(`Error al obtener documentos para inmueble ID ${inmueble.id}:`, error);
            return {
              ...inmueble,
              documentos: []
            };
          }
        })
      );
      
      setInmuebles(inmueblesConDocumentos);
    } catch (err) {
      console.error(err);
      setError('Error al obtener los inmuebles.');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchInmuebles();
  }, [fetchInmuebles]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      // Parsear la fecha y asegurar que no se vea afectada por la zona horaria
      if (dateString.includes('T')) {
        // Si incluye 'T', es un formato ISO
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
        // Usar mediodía UTC para evitar problemas de zona horaria
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        return date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } else {
        // Para otros formatos, intentamos crear la fecha directamente
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString || 'N/A';
    }
  };

  const handleTabClick = (inmuebleId: number) => {
    setActiveTab(activeTab === inmuebleId ? null : inmuebleId);
  };

  const handleVerExpediente = (e: React.MouseEvent, inmuebleId: number) => {
    e.stopPropagation();
    setSelectedInmueble(inmuebleId);
    setShowExpediente(true);
  };

  const handleOpenDeleteModal = (e: React.MouseEvent, inmuebleId: number) => {
    e.stopPropagation();
    setInmuebleToDelete(inmuebleId);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setInmuebleToDelete(null);
  };

  const handleDeleteInmueble = async () => {
    if (!inmuebleToDelete) return;

    setLoading(true);
    try {
      const documentos = await DocumentoService.obtenerDocumentosPorInmueble(inmuebleToDelete);
      for (const documento of documentos) {
        await DocumentoService.eliminarDocumento(documento.id);
      }
      
      await deleteInmueble(inmuebleToDelete);
      
      setInmuebles(prevInmuebles => prevInmuebles.filter(i => i.id !== inmuebleToDelete));
      
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error al eliminar el inmueble:', error);
      setError('No se pudo eliminar el inmueble. Intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseExpediente = () => {
    setShowExpediente(false);
    setSelectedInmueble(null);
    fetchInmuebles();
  };

  const handleEditInmueble = (e: React.MouseEvent, inmuebleId: number) => {
    e.stopPropagation();
    alert(`Función para editar inmueble ID: ${inmuebleId} (implementar según flujo)`);
  };

  if (!loading && !error && inmuebles.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 rounded-lg p-8 shadow-sm border border-gray-200">
          <FaBuilding className="text-gray-400 mx-auto text-5xl mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Sin inmuebles registrados</h3>
          <p className="text-gray-500">Este cliente no tiene inmuebles registrados en el sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800">Inmuebles del Cliente</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 font-medium rounded-full text-sm">
          {inmuebles.length} {inmuebles.length === 1 ? 'inmueble' : 'inmuebles'}
        </span>
      </div>
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando inmuebles...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && inmuebles.length > 0 && (
        <div className="space-y-6">
          {inmuebles.map((inmueble) => (
            <div 
              key={inmueble.id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border transition-all duration-200 hover:shadow-md ${activeTab === inmueble.id ? 'border-blue-400' : 'border-gray-200'}`}
            >
              <div 
                className="flex flex-col md:flex-row items-start cursor-pointer p-4"
                onClick={() => handleTabClick(inmueble.id)}
              >
                <div className="md:w-1/4 w-full mb-4 md:mb-0 md:mr-4">
                  {inmueble.foto ? (
                    <img 
                      src={inmueble.foto} 
                      alt={`Foto de ${inmueble.direccion}`} 
                      className="w-full h-40 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md">
                      <FaBuilding className="text-gray-400 text-4xl" />
                    </div>
                  )}
                </div>
                
                <div className="md:w-3/4 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                        <h4 className="font-semibold text-lg text-gray-800 leading-tight">{inmueble.direccion}</h4>
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <FaMoneyBillWave className="text-green-600 mr-2" />
                        <span className="font-medium text-gray-900">{formatCurrency(inmueble.valorMercado)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inmueble.estatus === 'Activo' ? 'bg-green-100 text-green-800' : 
                        inmueble.estatus === 'En revisión' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inmueble.estatus || 'No definido'}
                      </span>
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <FaCalendarAlt className="mr-1" />
                        <span>Registrado: {formatDate(inmueble.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap items-center justify-between">
                    <div className="mr-4 flex items-center text-sm text-gray-500">
                      <FaFileAlt className="inline mr-1" />
                      <span>{inmueble.documentos?.length || 0} documentos</span>
                    </div>
                    
                    <div className="flex mt-2 md:mt-0 space-x-2">
                      <button
                        onClick={(e) => handleEditInmueble(e, inmueble.id)}
                        className="flex items-center py-1 px-3 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                        title="Editar inmueble"
                      >
                        <FaEdit className="mr-1" /> Editar
                      </button>
                      <button
                        onClick={(e) => handleVerExpediente(e, inmueble.id)}
                        className="flex items-center py-1 px-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        title="Ver expediente"
                      >
                        <FaFolderOpen className="mr-1" /> Expediente
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteModal(e, inmueble.id)}
                        className="flex items-center py-1 px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                        title="Eliminar inmueble"
                      >
                        <FaTrash className="mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {activeTab === inmueble.id && (
                <div className="bg-gray-50 p-4 border-t border-gray-200 animate-fadeIn">
                  <h5 className="font-medium text-gray-700 mb-3">Documentos del inmueble</h5>
                  
                  {inmueble.documentos && inmueble.documentos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {inmueble.documentos.map(doc => (
                        <a 
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          {doc.tipo.includes('fotografia') ? (
                            <FaCamera className="text-blue-500 mr-2" />
                          ) : (
                            <FaFileAlt className="text-blue-500 mr-2" />
                          )}
                          <div className="overflow-hidden">
                            <span className="block font-medium text-sm truncate">
                              {doc.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="block text-xs text-gray-500 truncate">{doc.nombre}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No hay documentos disponibles para este inmueble.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este inmueble? Esta acción eliminará todos los documentos asociados y no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteInmueble}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpediente && selectedInmueble && (
        <DocumentoManager 
          inmuebleId={selectedInmueble} 
          onClose={handleCloseExpediente}
          onStatusUpdate={fetchInmuebles} 
        />
      )}
    </div>
  );
});

InmuebleByCliente.displayName = 'InmuebleByCliente';

export default InmuebleByCliente;