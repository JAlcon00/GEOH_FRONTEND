import React, { useCallback, useMemo } from 'react';
import { IPersonaFisica, IPersonaMoral, ICliente } from '../../../types/cliente.types';

interface ClienteProps {
    isNewClient: boolean;
    tipoPersona: 'fisica' | 'moral' | '';
    cliente: ICliente | null;
    handleClienteChange: (field: string, value: any) => void;
    handleTipoPersonaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleRFCBlur: () => void;
    rfcWarning: string;
}

const ClienteForm: React.FC<ClienteProps> = ({
    isNewClient,
    tipoPersona,
    cliente,
    handleClienteChange,
    handleTipoPersonaChange,
    handleRFCBlur,
    rfcWarning
}) => {

    const PersonaFisicaForm = useMemo(() => {
        if (tipoPersona !== 'fisica') return null;

        // Función auxiliar para formatear fechas
        const formatearFecha = (fecha: any): string => {
            if (!fecha) return '';
            try {
                // Si es una cadena con T, extraer solo la parte de la fecha
                if (typeof fecha === 'string' && fecha.includes('T')) {
                    return fecha.split('T')[0];
                }
                // Si es un objeto Date, convertirlo a formato ISO y extraer la fecha
                if (fecha instanceof Date) {
                    return fecha.toISOString().split('T')[0];
                }
                return String(fecha);
            } catch (error) {
                console.error("Error al formatear fecha:", error);
                return '';
            }
        };

        const formatearFechaVisualizacion = (fechaString: string): string => {
            if (!fechaString) return '';
            try {
                // Crear la fecha ajustando a mediodía para evitar problemas de zona horaria
                const [year, month, day] = fechaString.split('-').map(Number);
                
                // Forzar UTC y usar el mediodía para evitar problemas de zonas horarias
                const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                return fecha.toLocaleDateString('es-MX');
            } catch (error) {
                console.error("Error al formatear fecha para visualización:", error);
                return fechaString;
            }
        };

        const fechaNacimiento = formatearFecha((cliente as IPersonaFisica)?.fechaNacimiento);

        return (
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Nombre"
                    value={(cliente as IPersonaFisica)?.nombre || ''}
                    onChange={(e) => handleClienteChange('nombre', e.target.value)}
                    className="input-primary col-span-2"
                />
                <input
                    type="text"
                    placeholder="Apellido Paterno"
                    value={(cliente as IPersonaFisica)?.apellidoPaterno || ''}
                    onChange={(e) => handleClienteChange('apellidoPaterno', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="text"
                    placeholder="Apellido Materno"
                    value={(cliente as IPersonaFisica)?.apellidoMaterno || ''}
                    onChange={(e) => handleClienteChange('apellidoMaterno', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="text"
                    placeholder="RFC"
                    value={(cliente as IPersonaFisica)?.rfc || ''}
                    onChange={(e) => handleClienteChange('rfc', e.target.value)}
                    onBlur={handleRFCBlur}
                    maxLength={13}
                    className="input-primary col-span-1"
                />
                {rfcWarning && <p className="text-red-500 font-bold mt-2 col-span-1">{rfcWarning}</p>}
                <div className="col-span-1">
                    <input
                        type="date"
                        placeholder="Fecha de nacimiento"
                        value={fechaNacimiento}
                        onChange={(e) => handleClienteChange('fechaNacimiento', e.target.value)}
                        className="input-primary w-full"
                    />
                    {fechaNacimiento && (
                        <div className="text-xs text-gray-600 mt-1">
                            Fecha seleccionada: {formatearFechaVisualizacion(fechaNacimiento)}
                        </div>
                    )}
                </div>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={(cliente as IPersonaFisica)?.correo || ''}
                    onChange={(e) => handleClienteChange('correo', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="tel"
                    placeholder="Teléfono"
                    value={(cliente as IPersonaFisica)?.telefono || ''}
                    onChange={(e) => handleClienteChange('telefono', e.target.value)}
                    className="input-primary col-span-1"
                />
            </div>
        );
    }, [tipoPersona, cliente, handleClienteChange, handleRFCBlur, rfcWarning]);

    const PersonaMoralForm = useMemo(() => {
        if (tipoPersona !== 'moral') return null;

        // Función auxiliar para formatear fechas
        const formatearFecha = (fecha: any): string => {
            if (!fecha) return '';
            try {
                // Si es una cadena con T, extraer solo la parte de la fecha
                if (typeof fecha === 'string' && fecha.includes('T')) {
                    return fecha.split('T')[0];
                }
                // Si es un objeto Date, convertirlo a formato ISO y extraer la fecha
                if (fecha instanceof Date) {
                    return fecha.toISOString().split('T')[0];
                }
                return String(fecha);
            } catch (error) {
                console.error("Error al formatear fecha:", error);
                return '';
            }
        };

        const formatearFechaVisualizacion = (fechaString: string): string => {
            if (!fechaString) return '';
            try {
                // Crear la fecha ajustando a mediodía para evitar problemas de zona horaria
                const [year, month, day] = fechaString.split('-').map(Number);
                
                // Forzar UTC y usar el mediodía para evitar problemas de zonas horarias
                const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                return fecha.toLocaleDateString('es-MX');
            } catch (error) {
                console.error("Error al formatear fecha para visualización:", error);
                return fechaString;
            }
        };

        const fechaConstitucion = formatearFecha((cliente as IPersonaMoral)?.fechaConstitucion);

        return (
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Razón Social"
                    value={(cliente as IPersonaMoral)?.razonSocial || ''}
                    onChange={(e) => handleClienteChange('razonSocial', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="text"
                    placeholder="Representante Legal"
                    value={(cliente as IPersonaMoral)?.representanteLegal || ''}
                    onChange={(e) => handleClienteChange('representanteLegal', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="text"
                    placeholder="RFC"
                    value={(cliente as IPersonaMoral)?.rfc || ''}
                    onChange={(e) => handleClienteChange('rfc', e.target.value)}
                    onBlur={handleRFCBlur}
                    maxLength={12}
                    className="input-primary col-span-1"
                />
                {rfcWarning && <p className="text-red-500 font-bold mt-2 col-span-1">{rfcWarning}</p>}
                <div className="col-span-1">
                    <input
                        type="date"
                        placeholder="Fecha de constitución"
                        value={fechaConstitucion}
                        onChange={(e) => handleClienteChange('fechaConstitucion', e.target.value)}
                        className="input-primary w-full"
                    />
                    {fechaConstitucion && (
                        <div className="text-xs text-gray-600 mt-1">
                            Fecha seleccionada: {formatearFechaVisualizacion(fechaConstitucion)}
                        </div>
                    )}
                </div>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={(cliente as IPersonaMoral)?.correo || ''}
                    onChange={(e) => handleClienteChange('correo', e.target.value)}
                    className="input-primary col-span-1"
                />
                <input
                    type="tel"
                    placeholder="Teléfono"
                    value={(cliente as IPersonaMoral)?.telefono || ''}
                    onChange={(e) => handleClienteChange('telefono', e.target.value)}
                    className="input-primary col-span-1"
                />
            </div>
        );
    }, [tipoPersona, cliente, handleClienteChange, handleRFCBlur, rfcWarning]);

    if (!isNewClient) return null;

    return (
        <div className="cliente-form__columna col-span-1">
            <h3 className="text-xl font-semibold mb-4">Datos del Cliente</h3>
            <select
                value={tipoPersona}
                onChange={handleTipoPersonaChange}
                className='mb-4 input-primary'
            >
                <option value="">Seleccione el tipo de persona</option>
                <option value="fisica">Persona Física</option>
                <option value="moral">Persona Moral</option>
            </select>

            {PersonaFisicaForm}
            {PersonaMoralForm}
        </div>
    );
};

export default ClienteForm;