import React, { useEffect, useState } from 'react';
import { getClienteByRFC } from '../../services/cliente.service';
import { getInmueblesByCliente } from '../../services/inmueble.service';
import { FaUser, FaBuilding, FaIdCard, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaCity } from 'react-icons/fa';

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

interface Inmueble {
    id: number;
    direccion: string;
    valorMercado: number;
    foto?: string;
    clienteId: number;
    createdAt?: string;
    updatedAt?: string;
}

const DetalleCliente: React.FC<{ rfc: string }> = ({ rfc }) => {
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const formatearFecha = (fechaString?: string): string => {
        if (!fechaString) return 'No disponible';
        try {
            // Parsear la fecha y asegurar que no se vea afectada por la zona horaria
            if (fechaString.includes('T')) {
                // Si incluye 'T', es un formato ISO
                const [year, month, day] = fechaString.split('T')[0].split('-').map(Number);
                // Usar mediodía UTC para evitar problemas de zona horaria
                const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                return fecha.toLocaleDateString('es-MX', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                });
            } else if (fechaString.includes('-')) {
                // Formato YYYY-MM-DD
                const [year, month, day] = fechaString.split('-').map(Number);
                const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                return fecha.toLocaleDateString('es-MX', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                });
            } else {
                // Otros formatos
                const fecha = new Date(fechaString);
                return fecha.toLocaleDateString('es-MX', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                });
            }
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fechaString || 'No disponible';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const clienteData = await getClienteByRFC(rfc);
                setCliente(clienteData);
                
                if (clienteData?.id) {
                    const inmueblesData = await getInmueblesByCliente(clienteData.id);
                    setInmuebles(inmueblesData);
                }
            } catch (error) {
                console.error('Error obteniendo datos del cliente:', error);
                setError('No se pudieron cargar los datos del cliente');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rfc]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="loader-spinner" style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (error || !cliente) {
        return (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow">
                <p className="font-semibold">Error: {error || 'Cliente no encontrado'}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-xl">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 border-b border-gray-300">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {cliente.tipoPersona === 'fisica' 
                                ? `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}` 
                                : cliente.razonSocial}
                        </h2>
                        <div className="flex items-center text-gray-700 mb-1">
                            {cliente.tipoPersona === 'fisica' 
                                ? <FaUser className="mr-2 text-blue-600" /> 
                                : <FaBuilding className="mr-2 text-blue-600" />}
                            <span className="font-semibold">
                                {cliente.tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                            </span>
                        </div>
                        <div className="flex items-center text-gray-700">
                            <FaIdCard className="mr-2 text-blue-600" />
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {cliente.rfc}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información de Contacto</h3>
                        
                        <div className="flex items-center">
                            <FaEnvelope className="mr-3 text-blue-600" />
                            <span>{cliente.correo || 'No disponible'}</span>
                        </div>
                        
                        <div className="flex items-center">
                            <FaPhone className="mr-3 text-blue-600" />
                            <span>{cliente.telefono || 'No disponible'}</span>
                        </div>
                        
                        {cliente.domicilio && (
                            <div className="flex items-center">
                                <FaMapMarkerAlt className="mr-3 text-blue-600 flex-shrink-0" />
                                <span>{cliente.domicilio}</span>
                            </div>
                        )}
                        
                        {(cliente.ciudad || cliente.estado || cliente.pais) && (
                            <div className="flex items-start">
                                <FaCity className="mr-3 mt-1 text-blue-600 flex-shrink-0" />
                                <div>
                                    {cliente.ciudad && <span className="block">{cliente.ciudad}</span>}
                                    {cliente.estado && <span className="block">{cliente.estado}</span>}
                                    {cliente.pais && <span className="block">{cliente.pais}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                            {cliente.tipoPersona === 'fisica' ? 'Información Personal' : 'Datos Fiscales'}
                        </h3>
                        
                        {cliente.tipoPersona === 'fisica' ? (
                            <div className="flex items-center">
                                <FaCalendarAlt className="mr-3 text-blue-600" />
                                <span><strong>Fecha de Nacimiento:</strong> {formatearFecha(cliente.fechaNacimiento)}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center">
                                    <FaUser className="mr-3 text-blue-600" />
                                    <span><strong>Representante Legal:</strong> {cliente.representanteLegal || 'No disponible'}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCalendarAlt className="mr-3 text-blue-600" />
                                    <span><strong>Fecha de Constitución:</strong> {formatearFecha(cliente.fechaConstitucion)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {inmuebles.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Inmuebles Registrados ({inmuebles.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inmuebles.map(inmueble => (
                                <div key={inmueble.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                                    <p className="font-semibold">{inmueble.direccion}</p>
                                    <p className="text-sm">
                                        <span className="text-gray-600">Valor de mercado:</span>{' '}
                                        <span className="font-medium">{inmueble.valorMercado.toLocaleString('es-MX', { 
                                            style: 'currency', 
                                            currency: 'MXN' 
                                        })}</span>
                                    </p>
                                    {inmueble.foto && (
                                        <div className="mt-2">
                                            <img 
                                                src={inmueble.foto} 
                                                alt={`Fotografía de ${inmueble.direccion}`} 
                                                className="h-32 w-full object-cover rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DetalleCliente;