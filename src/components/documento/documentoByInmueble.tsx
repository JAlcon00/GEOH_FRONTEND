import React, { useState, useEffect, ChangeEvent } from 'react';
import DocumentoService from '../../services/documento.service';
import { FaEye, FaEdit, FaTrash, FaSave } from 'react-icons/fa';

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

const DocumentoByInmueble: React.FC<DocumentoByInmuebleProps> = ({ inmuebleId, onStatusUpdate }) => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [updates, setUpdates] = useState<{ [id: number]: UpdateData }>({});
    // Para marcar documentos eliminados y así mostrar "Documento faltante"
    const [deletedDocs, setDeletedDocs] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchDocumentos();
        setDeletedDocs(new Set());
    }, [inmuebleId]);

    const fetchDocumentos = async () => {
        try {
            const data = await DocumentoService.obtenerDocumentosPorInmueble(inmuebleId);
            setDocumentos(data);
        } catch (error) {
            console.error("Error al obtener documentos:", error);
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
                copy[docId].newStatus = "";
                console.log("Estatus actualizado:", copy[docId].newStatus);
                return copy;
            });
            onStatusUpdate?.();
        } catch (error) {
            console.error("Error al actualizar estatus:", error);
        }
    };

    // Actualiza la subida del documento (archivo)
    const handleEditFile = async (docId: number) => {
        const updateData = updates[docId];
        if (!updateData || !updateData.newFile) {
            console.error('Selecciona un archivo para actualizar el documento.');
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
        } catch (error) {
            console.error("Error al actualizar documento:", error);
        }
    };

    // Abre el documento en una nueva pestaña para visualizarlo
    const handleView = (archivoUrl: string) => {
        window.open(archivoUrl, '_blank');
    };

    // Para eliminar, se pregunta al usuario; si confirma, se marca como eliminado
    const handleDelete = async (docId: number) => {
        if (window.confirm("¿Está seguro de que desea eliminar el documento?")) {
            try {
                await DocumentoService.eliminarDocumento(docId);
                setDeletedDocs(prev => new Set(prev).add(docId));
            } catch (error) {
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

    return (
        <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Documentos del Inmueble #{inmuebleId}
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                                Tipo Documento
                            </th>
                            <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                                Estatus
                            </th>
                            <th className="py-3 px-4 text-center font-medium text-gray-600 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {documentos.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 border-b">{doc.tipoDocumento}</td>
                                {deletedDocs.has(doc.id) ? (
                                    <td colSpan={2} className="py-3 px-4 border-b text-center text-red-600 font-semibold">
                                        Documento faltante
                                    </td>
                                ) : (
                                    <>
                                        <td className="py-3 px-4 border-b">
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={updates[doc.id]?.newStatus || doc.estatus}
                                                    onChange={(e) => handleStatusChange(doc.id, e)}
                                                    className="border rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="aceptado">Aprobado</option>
                                                    <option value="rechazado">Rechazado</option>
                                                </select>
                                                {updates[doc.id]?.newStatus && updates[doc.id]?.newStatus !== doc.estatus && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(doc.id)}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <FaSave className="w-5 h-5 text-blue-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            <div className="flex items-center justify-center space-x-2">
                                                {updates[doc.id]?.editing ? (
                                                    <>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileChange(e, doc.id)}
                                                            className="inline-block text-xs"
                                                        />
                                                        <button
                                                            onClick={() => handleEditFile(doc.id)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        >
                                                            <FaSave className="w-5 h-5 text-yellow-500" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => activateEditMode(doc.id)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        >
                                                            <FaEdit className="w-5 h-5 text-yellow-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleView(doc.archivoUrl)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        >
                                                            <FaEye className="w-5 h-5 text-green-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                        >
                                                            <FaTrash className="w-5 h-5 text-red-500" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
};

export default DocumentoByInmueble;