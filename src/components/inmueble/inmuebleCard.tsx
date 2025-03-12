import React, { useState } from 'react';

interface Inmueble {
    id: number;
    direccion: string;
    valorMercado: number;
    foto?: string;
}

const InmuebleCard: React.FC<Inmueble> = ({ id, direccion, valorMercado, foto }) => {
    const [imgError, setImgError] = useState(false);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // Evitamos loops infinitos si ya se está mostrando el fallback
        if (!imgError) {
            setImgError(true);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-xl p-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Inmueble #{id}
            </h2>
            {foto && (
                <img
                    src={imgError ? '/fallback-image.png' : foto}
                    alt={`Inmueble ${id}`}
                    onError={handleError}
                    className="mt-4 w-full max-h-72 object-cover rounded-lg shadow-md"
                />
            )}
            <p className="text-gray-600">
                <strong>Dirección:</strong> {direccion}
            </p>
            <p className="text-gray-600">
                <strong>Valor de Mercado:</strong> ${valorMercado.toLocaleString()}
            </p>

            <button>Ver Expediente</button>
        </div>
    );
};

export default InmuebleCard;