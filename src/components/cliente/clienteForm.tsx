import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Modal } from '@material-ui/core';
import { FaSearch } from 'react-icons/fa';
import { IPersonaFisica, IPersonaMoral, ICliente, IClienteConTipo } from '../../types/cliente.types';
import PlacesAutocomplete, { geocodeByAddress } from 'react-places-autocomplete';
import { loadGoogleMaps } from '../../services/geocode.service';
import { IInmueble } from '../../types/inmueble.types';
import { TipoDocumento } from '../../types/documento.types';
import { getClienteByRFC, createCliente } from '../../services/cliente.service';
import DocumentoService from '../../services/documento.service';
import { createInmueble } from '../../services/inmueble.service';
import { useLayout } from '../../contexts/LayoutContext';
import './clienteForm.css';
import Dropzone, { Accept } from 'react-dropzone';

// Función auxiliar para convertir string de tipos a objeto Accept
const convertAcceptTypesToObject = (acceptTypesString: string): Accept => {
    if (acceptTypesString === 'image/*') {
        return {
            'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        };
    }

    if (acceptTypesString === '.pdf,.doc,.docx') {
        return {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        };
    }

    // Para otros casos, convertir genéricamente
    const extensions = acceptTypesString.split(',');
    const result: Accept = {};

    extensions.forEach(ext => {
        const cleanExt = ext.trim();
        // Mapear extensiones a tipos MIME aproximados
        if (cleanExt.startsWith('.')) {
            result[`application/${cleanExt.substring(1)}`] = [cleanExt];
        } else {
            result[cleanExt] = [];
        }
    });

    return result;
};

// Interfaz para las props del componente dropzone
interface DocumentoDropzoneProps {
    label: string;
    documento: File | null;
    onDrop: (file: File) => void;
    onRemove: () => void;
    acceptTypes: string;
}

// Componente memoizado para dropzone
const MemoizedDocumentoDropzone = memo<DocumentoDropzoneProps>(({
    label,
    documento,
    onDrop,
    onRemove,
    acceptTypes
}) => {
    const handleDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            onDrop(acceptedFiles[0]);
        }
    }, [onDrop]);

    return (
        <div className="documento-input col-span-1">
            <label>{label}</label>
            <Dropzone onDrop={handleDrop} accept={convertAcceptTypesToObject(acceptTypes)}>
                {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                        <input {...getInputProps()} />
                        {documento ? (
                            <>
                                <p className="text-gray-700">Archivo seleccionado: {documento.name}</p>
                                <button
                                    type="button"
                                    className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove();
                                    }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500">Arrastra y suelta un archivo aquí, o haz clic para seleccionar uno</p>
                                <button type="button" className="btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </Dropzone>
        </div>
    );
});

// Componente memoizado para la sección de dirección con autocompletado
interface AddressInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    placeholder?: string;
}

const MemoizedAddressInput = memo<AddressInputProps>(({
    value,
    onChange,
    onSelect,
    placeholder
}) => {
    return (
        <div className='input-primary col-span-2 relative mb-8'>
            <PlacesAutocomplete
                value={value}
                onChange={onChange}
                onSelect={onSelect}
            >
                {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                    <div className="autocomplete-root">
                        <input
                            {...getInputProps({
                                placeholder: placeholder || 'Busca dirección...',
                                className: 'col-span-2 pr-10',
                            })}
                        />
                        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <div className="autocomplete-dropdown">
                            {suggestions.map((sug) => (
                                <div
                                    {...getSuggestionItemProps(sug)}
                                    key={sug.placeId}
                                    className="p-3 cursor-pointer hover:bg-gray-100 border-b last:border-none"
                                >
                                    {sug.description}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </PlacesAutocomplete>
        </div>
    );
});

// Componente principal optimizado
const ClienteForm = memo(() => {
    useLayout();
    const [isNewClient, setIsNewClient] = useState<boolean | null>(null);
    const [rfc, setRFC] = useState<string>('');
    const [cliente, setCliente] = useState<ICliente | null>(null);
    const [inmueble, setInmueble] = useState<IInmueble>({
        direccion: '',
        valorMercado: 0
    });

    const [isEditingValorMercado, setIsEditingValorMercado] = useState(false);
    const [valorMercadoInput, setValorMercadoInput] = useState<string>(inmueble.valorMercado.toString());
    const [documentos, setDocumentos] = useState<Record<TipoDocumento, File | null>>({
        escritura: null,
        libertad_gravamen: null,
        avaluo: null,
        fotografia: null
    });
    const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | ''>('');
    const [openModal, setOpenModal] = useState(false);
    const [address, setAddress] = useState<string>('');

    // Efecto optimizado para cargar Google Maps API una sola vez
    useEffect(() => {
        loadGoogleMaps(() => {
            console.log('Google Maps API loaded');
        });
    }, []);

    //Efecto para cerrar modal despues de ser enviado formulario
    useEffect(() => {
        let timeoutId: number;

        if (openModal) {
            timeoutId = setTimeout(() => {
                // Cerrar el modal y reiniciar el formulario
                setOpenModal(false);
                setIsNewClient(null);
                setCliente(null);
                setRFC('');
                setInmueble({ direccion: '', valorMercado: 0 });
                setDocumentos({ escritura: null, libertad_gravamen: null, avaluo: null, fotografia: null });
                setTipoPersona('');
                setAddress('');
            }, 3000); // 3 segundos
        }

        // Limpieza del temporizador si el componente se desmonta
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [openModal]);

    // Callbacks memorizados para evitar recreación en cada renderizado
    const handleValorMercadoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        setValorMercadoInput(rawValue);
    }, []);

    const handleValorMercadoBlur = useCallback(() => {
        const numericValue = parseFloat(valorMercadoInput);
        if (!isNaN(numericValue)) {
            setInmueble(prev => ({ ...prev, valorMercado: numericValue }));
        }
        setIsEditingValorMercado(false);
    }, [valorMercadoInput]);

    const handleValorMercadoFocus = useCallback(() => {
        setIsEditingValorMercado(true);
    }, []);

    const handleSelect = useCallback(async (value: string, field: 'cliente' | 'inmueble') => {
        await geocodeByAddress(value);
        if (field === 'cliente') {
            setCliente(cliente => cliente ? { ...cliente, domicilio: value } : null);
        } else {
            setAddress(value);
            setInmueble(prev => ({ ...prev, direccion: value }));
        }
    }, []);

    const handleRFCSubmit = useCallback(async () => {
        try {
            console.log('Buscando cliente con RFC:', rfc);
            const clienteData = await getClienteByRFC(rfc);
            setCliente(clienteData);
            console.log(`Se encontró el RFC correspondiente: ${rfc}`);
            setIsNewClient(null);
        } catch (error) {
            console.error('Cliente no encontrado', error);
            alert('Cliente no encontrado. Por favor, verifique el RFC ingresado.');
        }
    }, [rfc]);

    // Crear una función para validar que el RFC no exista. Si ya existe, se muestra un aviso y se impide enviar el formulario.
    const handleValidateRFC = useCallback(async () => {
        try {
            const clienteData = await getClienteByRFC(rfc);
            if (clienteData) {
                alert(`El RFC ${rfc} ya existe. Será reeviado a mandar solo sus datos del inmueble.`);
                setIsNewClient(false);
                setCliente(clienteData);
                return false; // Indica que el RFC ya existe
            }
            // Si no se encuentra un cliente, se asume que el RFC es para un cliente nuevo
            setIsNewClient(true);
            return true; // Indica que el RFC es válido (cliente nuevo)
        } catch (error) {
            // En caso de error (por ejemplo, cliente no encontrado), se asume cliente nuevo
            setIsNewClient(true);
            return true;
        }
    }, [rfc]);

    const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();


        if (isNewClient && cliente?.rfc) {
            setRFC(cliente.rfc);
            const isValid = await handleValidateRFC();
            if (!isValid) return; // Detener el envío si el RFC ya existe
        }
    
        if (!cliente) {
            alert('Por favor, complete los datos del cliente.');
            return;
        }

        if (!tipoPersona && isNewClient) {
            alert('Por favor, seleccione el tipo de persona.');
            return;
        }

        if (!inmueble.direccion) {
            alert('Por favor, ingrese una dirección válida.');
            return;
        }

        if (isNaN(inmueble.valorMercado) || inmueble.valorMercado <= 0) {
            alert('Por favor, ingrese un valor de mercado válido.');
            return;
        }

        try {
            let clienteId = cliente?.id;
            if (isNewClient) {
                const clienteConTipo: IClienteConTipo = { ...(cliente as unknown as ICliente), tipoPersona: tipoPersona as 'fisica' | 'moral' };
                const newCliente = await createCliente(clienteConTipo);
                clienteId = newCliente.id;
            }

            const formData = new FormData();
            formData.append('direccion', inmueble.direccion);
            formData.append('valorMercado', inmueble.valorMercado.toString());
            formData.append('clienteId', clienteId!.toString());
            if (inmueble.foto) {
                formData.append('file', inmueble.foto);
            }

            const newInmueble = await createInmueble(formData);

            // Subir documentos
            const documentosPromises = Object.entries(documentos)
                .filter(([_, file]) => file !== null)
                .map(([tipo, file]) => {
                    return DocumentoService.subirMultiplesDocumentos([file as File], newInmueble.id, tipo as TipoDocumento);
                });

            await Promise.all(documentosPromises);
            setOpenModal(true);

            // Reiniciar estado
            setIsNewClient(null);
            setCliente(null);
            setRFC('');
            setInmueble({ direccion: '', valorMercado: 0 });
            setDocumentos({ escritura: null, libertad_gravamen: null, avaluo: null, fotografia: null });
            setTipoPersona('');
            setAddress('');
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    }, [cliente, tipoPersona, isNewClient, inmueble, documentos, handleValidateRFC, setRFC]);

    const handleSetNewClient = useCallback((isNew: boolean) => {
        setIsNewClient(isNew);

        // Si es cliente nuevo, inicializar objeto base
        if (isNew) {
            setCliente({
                tipoPersona: '' // Valor inicial necesario para ICliente
            } as unknown as ICliente);
        }
    }, []);

    const handleCancelForm = useCallback(() => {
        setIsNewClient(null);
        setRFC('');
        setCliente(null);
    }, []);

    const handleRFCChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRFC(e.target.value);
    }, []);

    const handleAddressChange = useCallback((value: string) => {
        setAddress(value);
    }, []);

    const handleTipoPersonaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setTipoPersona(e.target.value as 'fisica' | 'moral');
    }, []);

    const handleClienteChange = useCallback((field: string, value: any) => {
        setCliente(prev => {
            // Si no hay cliente previo, crear un objeto nuevo con tipoPersona
            if (!prev) {
                return {
                    [field]: value,
                    tipoPersona: tipoPersona || 'fisica' // Asegurarse de que tipoPersona tenga un valor
                } as unknown as ICliente; // Realizar una conversión de tipo en dos pasos
            }
            // Si existe, actualizar el campo específico
            return { ...prev, [field]: value };
        });
    }, [tipoPersona]);

    // Funciones para manejar documentos
    const handleDocumentoChange = useCallback((tipo: TipoDocumento, file: File | null) => {
        setDocumentos(prev => ({ ...prev, [tipo]: file }));
    }, []);

    // Valores memorizados
    const valorMercadoFormatted = useMemo(() => {
        return isEditingValorMercado
            ? valorMercadoInput
            : inmueble.valorMercado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }, [isEditingValorMercado, valorMercadoInput, inmueble.valorMercado]);

    // Handlers para cada tipo de documento
    const handleDocumentoEscrituraDrop = useCallback((file: File) => {
        handleDocumentoChange('escritura', file);
    }, [handleDocumentoChange]);

    const handleDocumentoEscrituraRemove = useCallback(() => {
        handleDocumentoChange('escritura', null);
    }, [handleDocumentoChange]);

    const handleDocumentoLibertadDrop = useCallback((file: File) => {
        handleDocumentoChange('libertad_gravamen', file);
    }, [handleDocumentoChange]);

    const handleDocumentoLibertadRemove = useCallback(() => {
        handleDocumentoChange('libertad_gravamen', null);
    }, [handleDocumentoChange]);

    const handleDocumentoAvaluoDrop = useCallback((file: File) => {
        handleDocumentoChange('avaluo', file);
    }, [handleDocumentoChange]);

    const handleDocumentoAvaluoRemove = useCallback(() => {
        handleDocumentoChange('avaluo', null);
    }, [handleDocumentoChange]);

    const handleDocumentoFotografiaDrop = useCallback((file: File) => {
        handleDocumentoChange('fotografia', file);
    }, [handleDocumentoChange]);

    const handleDocumentoFotografiaRemove = useCallback(() => {
        handleDocumentoChange('fotografia', null);
    }, [handleDocumentoChange]);

    const handleInmuebleFotoDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            setInmueble(prev => ({ ...prev, foto: acceptedFiles[0] }));
        }
    }, []);

    const handleInmuebleFotoRemove = useCallback(() => {
        setInmueble(prev => ({ ...prev, foto: null }));
    }, []);

    // Eliminé handleSelectCliente que no se utilizaba
    const handleSelectInmueble = useCallback((value: string) => handleSelect(value, 'inmueble'), [handleSelect]);

    const handleCloseModal = useCallback(() => setOpenModal(false), []);

    // Componentes de formulario basados en el tipo de persona
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
            // Nos aseguramos que la fecha sea procesada correctamente ajustando la zona horaria
            if (!fechaString) return '';

            try {
                // Dividir la fecha en partes
                const [year, month, day] = fechaString.split('-').map(Number);

                // Crear fecha con el día correcto (año, mes (0-indexado), día)
                return new Date(year, month - 1, day).toLocaleDateString('es-MX');
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
                    onBlur={() => {
                        if ((cliente as IPersonaFisica)?.rfc) {
                            setRFC((cliente as IPersonaFisica)?.rfc);
                            handleValidateRFC();
                        }
                    }}
                    className="input-primary col-span-1"
                />
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
    }, [tipoPersona, cliente, handleClienteChange]);
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
            // Nos aseguramos que la fecha sea procesada correctamente ajustando la zona horaria
            if (!fechaString) return '';

            try {
                // Dividir la fecha en partes
                const [year, month, day] = fechaString.split('-').map(Number);

                // Crear fecha con el día correcto (año, mes (0-indexado), día)
                return new Date(year, month - 1, day).toLocaleDateString('es-MX');
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
                    onBlur={() => {
                        if ((cliente as IPersonaMoral)?.rfc) {
                            setRFC((cliente as IPersonaMoral)?.rfc);
                            handleValidateRFC();
                        }
                    }}
                    className="input-primary col-span-1"
                />
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
    }, [tipoPersona, cliente, handleClienteChange]);

    return (
        <div className="cliente-form">
            {isNewClient === null && !cliente && (
                <div className="text-center">
                    <p className="text-lg font-semibold">¿Es un cliente nuevo?</p>
                    <div className="flex justify-center mt-4 gap-4">
                        <button
                            className="btn-primary bg-green-500 hover:bg-green-700"
                            onClick={() => handleSetNewClient(true)}
                        >
                            Sí
                        </button>
                        <button
                            className="btn-primary bg-red-500 hover:bg-red-700"
                            onClick={() => handleSetNewClient(false)}
                        >
                            No
                        </button>
                    </div>
                </div>
            )}

            {isNewClient === false && !cliente && (
                <div className="cliente-form__rfc-container">
                    <div className="cliente-form__rfc">
                        <input
                            type="text"
                            placeholder="Ingrese RFC"
                            value={rfc}
                            onChange={handleRFCChange}
                            className="text-center input-primary-rfc"
                        />
                        <div className="cliente-form__navigation col-span-1 md:col-span-2">
                            <button
                                type="button"
                                className="m-4 mb-4 btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={handleCancelForm}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                                </svg>
                            </button>
                            <button
                                className="m-6 btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={handleRFCSubmit}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(isNewClient === true || cliente) && (
                <div className='form-container'>
                    <form className="cliente-form__grid" onSubmit={handleFormSubmit}>
                        {isNewClient && (
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
                        )}

                        <div className="cliente-form__columna col-span-1">
                            <h3 className="text-xl font-semibold mb-4">Datos del Inmueble</h3>
                            <div className="cliente-form__section gap-4">
                                <MemoizedAddressInput
                                    value={address}
                                    onChange={handleAddressChange}
                                    onSelect={handleSelectInmueble}
                                    placeholder="Busca dirección..."
                                />

                                <input
                                    type="text"
                                    placeholder="Valor de Mercado"
                                    value={valorMercadoFormatted}
                                    onChange={handleValorMercadoChange}
                                    onBlur={handleValorMercadoBlur}
                                    onFocus={handleValorMercadoFocus}
                                    className="input-primary"
                                />
                            </div>

                            <div className="cliente-form__section col-span-1 md:col-span-2">
                                <h4 className="text-s font-semibold mt-4 mb-4">Fotografía del Inmueble</h4>
                                <Dropzone onDrop={handleInmuebleFotoDrop} accept={convertAcceptTypesToObject('image/*')}>
                                    {({ getRootProps, getInputProps }) => (
                                        <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                            <input {...getInputProps()} />
                                            {inmueble.foto ? (
                                                <>
                                                    <p className="text-gray-700">Archivo seleccionado: {inmueble.foto.name}</p>
                                                    <button
                                                        type="button"
                                                        className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInmuebleFotoRemove();
                                                        }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-gray-500">Arrastra y suelta una imagen aquí, o haz clic para seleccionar una</p>
                                                    <button type="button" className="btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Dropzone>
                            </div>
                        </div>

                        <div className="cliente-form__columna col-span-1">
                            <h3 className="text-xl font-semibold mb-4">Documentos</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <MemoizedDocumentoDropzone
                                    label="Escritura"
                                    documento={documentos.escritura}
                                    onDrop={handleDocumentoEscrituraDrop}
                                    onRemove={handleDocumentoEscrituraRemove}
                                    acceptTypes=".pdf,.doc,.docx"
                                />

                                <MemoizedDocumentoDropzone
                                    label="Libertad de Gravamen"
                                    documento={documentos.libertad_gravamen}
                                    onDrop={handleDocumentoLibertadDrop}
                                    onRemove={handleDocumentoLibertadRemove}
                                    acceptTypes=".pdf,.doc,.docx"
                                />

                                <MemoizedDocumentoDropzone
                                    label="Avalúo"
                                    documento={documentos.avaluo}
                                    onDrop={handleDocumentoAvaluoDrop}
                                    onRemove={handleDocumentoAvaluoRemove}
                                    acceptTypes=".pdf,.doc,.docx"
                                />

                                <MemoizedDocumentoDropzone
                                    label="Fotografía"
                                    documento={documentos.fotografia}
                                    onDrop={handleDocumentoFotografiaDrop}
                                    onRemove={handleDocumentoFotografiaRemove}
                                    acceptTypes="image/*"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center col-span-3 mt-4 gap-4">
                            <button
                                type="button"
                                className="m-4 mb-4 btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={handleCancelForm}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                                </svg>
                            </button>
                            <button
                                type="submit"
                                className="m-4 mb-4 btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}





            <Modal open={openModal} onClose={handleCloseModal}>
                <div className="modal-content p-6 bg-white rounded-lg shadow-xl max-w-md mx-auto text-center">
                    <svg
                        className="w-16 h-16 mx-auto text-green-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">¡Datos guardados exitosamente!</h2>
                    <p className="text-gray-600 mb-4">Esta ventana se cerrará automáticamente en 3 segundos</p>
                </div>
            </Modal>
        </div>
    );
});

// Añadir displayName para herramientas de desarrollo
ClienteForm.displayName = 'ClienteForm';
MemoizedDocumentoDropzone.displayName = 'MemoizedDocumentoDropzone';
MemoizedAddressInput.displayName = 'MemoizedAddressInput';

export default ClienteForm;