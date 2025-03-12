import React, { useEffect, useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { getClienteByRFC } from '../../services/cliente.service';

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
    domicilio?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
}

const DetalleCliente: React.FC<{ rfc: string; onClose: () => void }> = ({ rfc, onClose }) => {
    const { collapsed } = useLayout();
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        const fetchCliente = async () => {
            try {
                const response = await getClienteByRFC(rfc);
                setCliente(response);
            } catch (error) {
                console.error('Error obteniendo cliente:', error);
            }
        };

        fetchCliente();
    }, [rfc]);

    if (!cliente) return null;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800">
                {cliente.tipoPersona === 'fisica'
                    ? `${cliente.nombre} ${cliente.apellidoPaterno} ${
                          cliente.apellidoMaterno || ''
                      }`
                    : cliente.razonSocial}
            </h2>
            <p className="text-sm text-gray-600">
            <strong>RFC: </strong> {cliente.rfc}
            </p>
            <p className="text-sm text-gray-600">
                {cliente.correo}
            </p>
            <p className="text-sm text-gray-600">
                <strong>Telefono: </strong>
                {cliente.telefono}
            </p>
            <p className="text-sm text-gray-600">
                <strong>Domicilio: </strong>
                {cliente.domicilio}, {cliente.ciudad}, {cliente.estado},{' '}
                {cliente.pais}
            </p>
            {cliente.tipoPersona === 'fisica' ? (
                <>
                    <p className="text-sm text-gray-600">
                        <strong>Fecha de Nacimiento:</strong> {cliente.fechaNacimiento}
                    </p>
                </>
            ) : (
                <>
                    <p className="text-sm text-gray-600">
                        <strong>Representante Legal:</strong> {cliente.representanteLegal}
                    </p>
                    <p className="text-sm text-gray-600">
                        <strong>Fecha de Constitución:</strong> {cliente.fechaConstitucion}
                    </p>
                </>
            )}
            <button
                type="button"
                className="mt-4 btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                onClick={onClose}
            >
                Cerrar
            </button>
        </div>
    );
}

export default DetalleCliente;