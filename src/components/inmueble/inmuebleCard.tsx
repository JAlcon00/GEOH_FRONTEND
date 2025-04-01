import React, { useState } from 'react';
import DocumentoManager from '../documento/documentoManager';

interface Inmueble {
    id: number;
    direccion: string;
    valorMercado: number;
    foto?: string;
    estatus: string;
}

const InmuebleCard: React.FC<Inmueble> = ({ id, direccion, valorMercado, foto, estatus }) => {
    const [imgError, setImgError] = useState(false);
    const [showDocumentoModal, setShowDocumentoModal] = useState(false);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (!imgError) {
            setImgError(true);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-xl p-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Inmueble #{id}
            </h2>
            <h6 className="mb-2">
                {estatus}
            </h6>
            {foto && (
                <img
                    src={imgError ? '/fallback-image.png' : foto}
                    alt={`Inmueble ${id}`}
                    onError={handleError}
                    className="mt-4 w-full max-h-72 object-cover rounded-lg shadow-md mb-6"
                />
            )}
            <p className="text-gray-600">
                <strong>Dirección: </strong> {direccion}
            </p>
            <p className="text-gray-600">
                <strong>Valor de Mercado: </strong> ${valorMercado.toLocaleString()}
            </p>

            <div className="flex items-center justify-center mt-4">
                <button
                    onClick={() => setShowDocumentoModal(true)}
                    className="bg-red-800 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
                >
                    Ver Expediente
                </button>
            </div>

            {showDocumentoModal && (
                <DocumentoManager
                    inmuebleId={id}
                    onClose={() => setShowDocumentoModal(false)}
                />
            )}
        </div>
    );
};

export default InmuebleCard;