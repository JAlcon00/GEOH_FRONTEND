import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import DocumentoByInmueble from './documentoByInmueble';

interface DocumentoManagerProps {
    inmuebleId: number;
    onClose: () => void;
}

const DocumentoManager: React.FC<DocumentoManagerProps> = ({ inmuebleId, onClose }) => {
    // Aplica el efecto de desenfoque al contenido externo cuando el modal se abre
    useEffect(() => {
        const background = document.getElementById('app-content');
        if (background) {
            background.classList.add('filter', 'blur-sm');
        }
        return () => {
            if (background) {
                background.classList.remove('filter', 'blur-sm');
            }
        };
    }, []);

    // Se utiliza un portal para evitar que el modal se desenfoque
    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Fondo semitransparente que cierra el modal al hacer clic */}
            <div 
                className="absolute inset-0 bg-black opacity-50" 
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-lg shadow-lg max-w-6xl w-full p-6 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Gestor de Documentos</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        X
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                    <DocumentoByInmueble inmuebleId={inmuebleId} />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DocumentoManager;
