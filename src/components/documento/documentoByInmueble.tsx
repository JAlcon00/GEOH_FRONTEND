import React, { useState, useEffect, ChangeEvent, useCallback, memo } from 'react';
import DocumentoService from '../../services/documento.service';
import { FaEye, FaTrash, FaSave, FaUpload, FaFileAlt, FaFilePdf, FaFileImage, FaExclamationTriangle } from 'react-icons/fa';
import Dropzone from 'react-dropzone';

interface Documento {
    id: number;
    nombre?: string;
    tipoDocumento: string;
    inmuebleId: number;
    archivoUrl: string;
    estatus: string;
}

interface DocumentoByInmuebleProps {
    inmuebleId: number;
    onStatusUpdate?: () => void;
}

interface UpdateData {
    newStatus: string;
    newFile: File | null;
    editing?: boolean;
}

// Tipos de documentos que deben existir
const REQUIRED_DOCUMENT_TYPES = ['escritura', 'libertad_gravamen', 'avaluo', 'fotografia'];

// Componente para el card de documento
const DocumentoCard = memo(({
    documento,
    isDeleted,
    onView,
    onDelete,
    onStatusChange,
    onSaveStatus,
    onFileChange,
    onSaveFile,
    onUpload,
    updates,
    tipoDocumento
}: {
    documento?: Documento;
    isDeleted?: boolean;
    onView?: (url: string) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSaveStatus?: () => void;
    onFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onSaveFile?: () => void;
    onUpload?: (file: File) => void;
    updates?: UpdateData;
    tipoDocumento: string;
}) => {
    // Función para convertir el tipo de documento a un nombre más amigable
    const getDocumentTitle = (tipo: string) => {
        switch (tipo) {
            case 'escritura': return 'Escritura';
            case 'libertad_gravamen': return 'Libertad de Gravamen';
            case 'avaluo': return 'Avalúo';
            case 'fotografia': return 'Fotografía';
            default: return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
        }
    };

    // Función para obtener el icono según el tipo de documento
    const getDocumentIcon = (tipo: string) => {
        switch (tipo) {
            case 'escritura': return <FaFilePdf className="text-red-500 w-8 h-8" />;
            case 'libertad_gravamen': return <FaFileAlt className="text-blue-500 w-8 h-8" />;
            case 'avaluo': return <FaFilePdf className="text-amber-500 w-8 h-8" />;
            case 'fotografia': return <FaFileImage className="text-green-500 w-8 h-8" />;
            default: return <FaFileAlt className="text-gray-500 w-8 h-8" />;
        }
    };

    // Estilo de la tarjeta según el estado del documento
    let cardStyle = "rounded-lg shadow-md p-5 transition-all duration-200 border";
    let statusBadge;

    if (!documento || isDeleted) {
        cardStyle += " border-red-200 bg-red-50";
        statusBadge = (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <FaExclamationTriangle /> Faltante
            </span>
        );
    } else {
        switch (documento.estatus) {
            case 'aceptado':
                cardStyle += " border-green-200 bg-green-50";
                statusBadge = (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Aprobado
                    </span>
                );
                break;
            case 'rechazado':
                cardStyle += " border-orange-200 bg-orange-50";
                statusBadge = (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                        Rechazado
                    </span>
                );
                break;
            default:
                cardStyle += " border-gray-200 bg-white";
                statusBadge = (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        Pendiente
                    </span>
                );
        }
    }

    return (
        <div className={cardStyle}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getDocumentIcon(tipoDocumento)}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {getDocumentTitle(tipoDocumento)}
                        </h3>
                        <div className="mt-1">
                            {statusBadge}
                        </div>
                    </div>
                </div>
            </div>

            {/* Si no existe el documento o fue eliminado */}
            {(!documento || isDeleted) ? (
                <div className="mt-4">
                    <p className="text-red-600 text-sm mb-2 font-medium flex items-center gap-1">
                        <FaExclamationTriangle /> El documento no está disponible
                    </p>
                    
                    <Dropzone onDrop={(acceptedFiles) => onUpload && acceptedFiles[0] && onUpload(acceptedFiles[0])}>
                        {({ getRootProps, getInputProps }) => (
                            <div 
                                {...getRootProps()} 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <input {...getInputProps()} />
                                <FaUpload className="mx-auto text-gray-400 w-8 h-8 mb-2" />
                                <p className="text-sm text-gray-500">
                                    Arrastra un archivo o haz clic para subir el documento
                                </p>
                            </div>
                        )}
                    </Dropzone>
                </div>
            ) : (
                <div className="mt-4">
                    {/* Si está en modo edición */}
                    {updates?.editing ? (
                        <div className="space-y-3">
                            <input
                                type="file"
                                onChange={onFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <button
                                onClick={onSaveFile}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                <FaSave /> Guardar cambios
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Estado del documento */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={updates?.newStatus || documento.estatus}
                                    onChange={onStatusChange}
                                    className="border rounded-lg p-2 text-sm flex-grow focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="aceptado">Aprobado</option>
                                    <option value="rechazado">Rechazado</option>
                                </select>
                                {updates?.newStatus && updates.newStatus !== documento.estatus && (
                                    <button
                                        onClick={onSaveStatus}
                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                                        title="Guardar cambio de estado"
                                    >
                                        <FaSave className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Acciones para el documento */}
                            <div className="flex justify-between gap-2">
                                
                                <button
                                    onClick={() => onView && onView(documento.archivoUrl)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaEye /> Ver
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaTrash /> Eliminar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

const DocumentoByInmueble: React.FC<DocumentoByInmuebleProps> = ({ inmuebleId, onStatusUpdate }) => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [updates, setUpdates] = useState<{ [id: number]: UpdateData | undefined }>({});
    const [deletedDocs, setDeletedDocs] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar documentos iniciales
    useEffect(() => {
        fetchDocumentos();
    }, [inmuebleId]);

    const fetchDocumentos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await DocumentoService.obtenerDocumentosPorInmueble(inmuebleId);
            setDocumentos(data);
        } catch (error) {
            console.error("Error al obtener documentos:", error);
            setError("Error al cargar los documentos. Por favor, intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    // Actualiza únicamente el estatus usando el servicio
    const handleUpdateStatus = async (docId: number) => {
        const updateData = updates[docId];
        if (!updateData || !updateData.newStatus || updateData.newStatus === documentos.find(d => d.id === docId)?.estatus) {
            console.error('Selecciona un estatus diferente para actualizar.');
            return;
        }
        try {
            await DocumentoService.actualizarEstatusDocumento(docId, updateData.newStatus);
            // Actualiza el estado de los documentos
            await fetchDocumentos();
            setUpdates(prev => {
                const copy = { ...prev };
                delete copy[docId]; // Limpia el estado de actualización
                return copy;
            });
            onStatusUpdate?.();
            mostrarAlerta('Estatus actualizado correctamente', 'success');
        } catch (error) {
            console.error("Error al actualizar estatus:", error);
            mostrarAlerta('Error al actualizar el estatus', 'error');
        }
    };

    // Actualiza la subida del documento (archivo)
    const handleEditFile = async (docId: number) => {
        const updateData = updates[docId];
        if (!updateData || !updateData.newFile) {
            mostrarAlerta('Selecciona un archivo para actualizar el documento', 'warning');
            return;
        }
        try {
            await DocumentoService.actualizarDocumento(docId, updateData.newFile, undefined, undefined);
            fetchDocumentos();
            setUpdates(prev => {
                const copy = { ...prev };
                delete copy[docId]; // Se limpia el estado de edición
                return copy;
            });
            mostrarAlerta('Documento actualizado correctamente', 'success');
        } catch (error) {
            console.error("Error al actualizar documento:", error);
            mostrarAlerta('Error al actualizar el documento', 'error');
        }
    };

    // Sube un nuevo documento
    const handleUploadDocument = useCallback(async (file: File, tipoDocumento: string) => {
        try {
            await DocumentoService.subirDocumento(file, inmuebleId, tipoDocumento);
            await fetchDocumentos();
            mostrarAlerta('Documento subido correctamente', 'success');
            onStatusUpdate?.();
        } catch (error) {
            console.error("Error al subir documento:", error);
            mostrarAlerta('Error al subir el documento', 'error');
        }
    }, [inmuebleId, onStatusUpdate]);

    // Abre el documento en una nueva pestaña para visualizarlo
    const handleView = (archivoUrl: string) => {
        window.open(archivoUrl, '_blank');
    };

    // Para eliminar, se pregunta al usuario; si confirma, se marca como eliminado
    const handleDelete = async (docId: number) => {
        if (window.confirm("¿Está seguro de que desea eliminar el documento?")) {
            try {
                await DocumentoService.eliminarDocumento(docId);
                setDeletedDocs(prev => new Set([...prev, docId]));
                setDocumentos(prev => prev.filter(d => d.id !== docId));
                mostrarAlerta('Documento eliminado exitosamente', 'success');
            } catch (error: any) {
                const status = error?.status || error?.response?.status;
                if (status === 404) {
                    setDeletedDocs(prev => new Set([...prev, docId]));
                    setDocumentos(prev => prev.filter(d => d.id !== docId));
                    mostrarAlerta('El documento ya no existe', 'warning');
                } else {
                    mostrarAlerta('Ocurrió un error al eliminar', 'error');
                }
                console.error("Error al eliminar documento:", error);
            }
        }
    };

    // Maneja el cambio de estatus en el selector
    const handleStatusChange = (docId: number, e: ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setUpdates(prev => ({
            ...prev,
            [docId]: {
                newFile: prev[docId]?.newFile || null,
                newStatus: newStatus,
                editing: prev[docId]?.editing || false
            }
        }));
    };

    // Maneja el cambio en el file input para editar la subida
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, docId: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUpdates(prev => ({
                ...prev,
                [docId]: {
                    newStatus: prev[docId]?.newStatus || "",
                    newFile: file,
                    editing: true
                }
            }));
        }
    };

    // Activa el modo edición para la subida del archivo
    const activateEditMode = (docId: number) => {
        setUpdates(prev => ({
            ...prev,
            [docId]: {
                newStatus: prev[docId]?.newStatus || "",
                newFile: null,
                editing: true
            }
        }));
    };

    // Función auxiliar para mostrar alertas
    const mostrarAlerta = (mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info') => {
        if (typeof window !== 'undefined' && window.toast) {
            switch (tipo) {
                case 'success': window.toast.success(mensaje); break;
                case 'error': window.toast.error(mensaje); break;
                case 'warning': window.toast.warning(mensaje); break;
                case 'info': (window.toast as any).info(mensaje); break;
            }
        } else {
            console.log(`[${tipo.toUpperCase()}]: ${mensaje}`);
        }
    };

    // Organizar documentos por tipo
    const documentosPorTipo = React.useMemo(() => {
        const result: { [key: string]: Documento | null } = {};
        
        // Inicializar con documentos requeridos como nulos
        REQUIRED_DOCUMENT_TYPES.forEach(tipo => {
            result[tipo] = null;
        });
        
        // Actualizar con documentos existentes
        documentos.forEach(doc => {
            result[doc.tipoDocumento] = doc;
        });
        
        return result;
    }, [documentos]);

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Cargando documentos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                <div>
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <button 
                        onClick={fetchDocumentos}
                        className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaFileAlt className="text-blue-600" />
                Documentos del Inmueble #{inmuebleId}
            </h3>

            {/* Mensaje si no hay documentos */}
            {documentos.length === 0 && !loading && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
                    <p className="font-medium">No hay documentos registrados para este inmueble.</p>
                    <p className="text-sm">Debes subir los documentos requeridos: Escritura, Libertad de Gravamen, Avalúo y Fotografía.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {/* Iterar sobre los tipos requeridos */}
                {REQUIRED_DOCUMENT_TYPES.map(tipoDoc => {
                    const documento = documentosPorTipo[tipoDoc];
                    const isDeleted = documento ? deletedDocs.has(documento.id) : true;

                    return (
                        <DocumentoCard
                            key={tipoDoc}
                            tipoDocumento={tipoDoc}
                            documento={documento || undefined}
                            isDeleted={isDeleted}
                            updates={documento ? updates[documento.id] : undefined}
                            onView={documento && !isDeleted ? () => handleView(documento.archivoUrl) : undefined}
                            onEdit={documento && !isDeleted ? () => activateEditMode(documento.id) : undefined}
                            onDelete={documento && !isDeleted ? () => handleDelete(documento.id) : undefined}
                            onStatusChange={documento && !isDeleted ? (e) => handleStatusChange(documento.id, e) : undefined}
                            onSaveStatus={documento && !isDeleted ? () => handleUpdateStatus(documento.id) : undefined}
                            onFileChange={documento && !isDeleted ? (e) => handleFileChange(e, documento.id) : undefined}
                            onSaveFile={documento && !isDeleted ? () => handleEditFile(documento.id) : undefined}
                            onUpload={(file) => handleUploadDocument(file, tipoDoc)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentoByInmueble;