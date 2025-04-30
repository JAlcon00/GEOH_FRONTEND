import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import DocumentoByInmueble from './documentoByInmueble';

interface DocumentoManagerProps {
    inmuebleId: number;
    onClose: () => void;
    onStatusUpdate?: () => void   
}

const DocumentoManager: React.FC<DocumentoManagerProps> = ({ inmuebleId, onClose, onStatusUpdate }) => {
    // Si hay callback, no usarlo aquí para nada más; se pasa a DocumentoByInmueble
    if (onStatusUpdate) { /* callback de actualización de estatus listo para usar */ }
    
    // Aplica el efecto de desenfoque al contenido externo cuando el modal se abre
    useEffect(() => {
        const background = document.getElementById('app-content');
        if (background) {
            background.classList.add('filter', 'blur-sm');
        }
        
        // Deshabilitar scroll del body mientras el modal está abierto
        document.body.style.overflow = 'hidden';
        
        return () => {
            if (background) {
                background.classList.remove('filter', 'blur-sm');
            }
            // Restaurar scroll al cerrar modal
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Se utiliza un portal para evitar que el modal se desenfoque
    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
            {/* Fondo semitransparente que cierra el modal al hacer clic */}
            <div 
                className="absolute inset-0 bg-black opacity-50" 
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-lg shadow-lg max-w-6xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Expediente del Inmueble</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    <DocumentoByInmueble inmuebleId={inmuebleId} onStatusUpdate={onStatusUpdate} />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DocumentoManager;
