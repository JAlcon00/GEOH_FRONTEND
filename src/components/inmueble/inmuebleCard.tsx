import React, { useState } from 'react';
import DocumentoManager from '../documento/documentoManager';

interface Inmueble {
    id: number;
    direccion: string;
    valorMercado: number;
    foto?: string;
    estatus: string;
}

const InmuebleCard: React.FC<Omit<Inmueble, 'foto'>> = ({ id, direccion, valorMercado, estatus }) => {
    const [showDocumentoModal, setShowDocumentoModal] = useState(false);

    return (
        <div className="bg-white shadow-xl rounded-xl p-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Inmueble #{id}
            </h2>
            <h6 className="mb-2">
                {estatus}
            </h6>
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