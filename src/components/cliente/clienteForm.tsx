import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Modal } from '@material-ui/core';
import { IPersonaFisica, IPersonaMoral, ICliente, IClienteConTipo } from '../../types/cliente.types';
import { loadGoogleMaps } from '../../services/geocode.service';
import { IInmueble } from '../../types/inmueble.types';
import { TipoDocumento } from '../../types/documento.types';
import { getClienteByRFC, createCliente } from '../../services/cliente.service';
import DocumentoService from '../../services/documento.service';
import { createInmueble } from '../../services/inmueble.service';
import { useLayout } from '../../contexts/LayoutContext';
import './clienteForm.css';

// Importar componentes modularizados
import ClienteFormComponent from './clienteForm/cliente';
import InmuebleForm from './clienteForm/inmueble';
import DocumentosForm from './clienteForm/documentos';

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
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [rfcWarning, setRfcWarning] = useState('');

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
        if (field === 'cliente') {
            setCliente(cliente => cliente ? { ...cliente, domicilio: value } : null);
        } else {
            setAddress(value);
            setInmueble(prev => ({ ...prev, direccion: value }));
        }
    }, []);

    // Validación de RFC según tipo de persona
    const validarLongitudRFC = useCallback(() => {
        if (tipoPersona === 'fisica' && rfc.length !== 13) {
            alert('El RFC de persona física debe tener exactamente 13 caracteres.');
            return false;
        }
        if (tipoPersona === 'moral' && rfc.length !== 12) {
            alert('El RFC de persona moral debe tener exactamente 12 caracteres.');
            return false;
        }
        return true;
    }, [rfc, tipoPersona]);

    const handleRFCSubmit = useCallback(async () => {
        if (!rfc || rfc.trim() === '') {
            alert('Por favor, ingrese un RFC antes de buscar.');
            return;
        }
        if (!validarLongitudRFC()) return;
        try {
            console.log('Buscando cliente con RFC:', rfc);
            const clienteData = await getClienteByRFC(rfc);
            setCliente(clienteData);
            console.log(`Se encontró el RFC correspondiente: ${rfc}`);
            setIsNewClient(false); // Si encontramos el cliente, no es nuevo
            setRfcWarning(''); // Limpiar advertencia
        } catch (error) {
            console.error('Cliente no encontrado', error);
            setRfcWarning('RFC NO EXISTENTE');
            setCliente(null);
        }
    }, [rfc, validarLongitudRFC]);

    const handleRFCChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();
        if (tipoPersona === 'fisica') value = value.slice(0, 13);
        else if (tipoPersona === 'moral') value = value.slice(0, 12);
        setRFC(value);
        setRfcWarning('');
    }, [tipoPersona]);

    const handleRFCBlur = useCallback(async () => {
        if (!rfc) return;
        if ((tipoPersona === 'fisica' && rfc.length !== 13) || (tipoPersona === 'moral' && rfc.length !== 12)) return;
        setRfcWarning('');
        try {
            const clienteData = await getClienteByRFC(rfc);
            if (isNewClient) {
                setRfcWarning('ESTE RFC YA EXISTE');
                setCliente(null);
            } else {
                setCliente(clienteData);
            }
        } catch (error: any) {
            if (!isNewClient) {
                setRfcWarning('RFC NO EXISTENTE');
                setCliente(null);
            } else {
                setRfcWarning('');
                setCliente(null);
                
            }
        }
    }, [rfc, tipoPersona, isNewClient]);

    const isFormValid = useCallback(() => {
        if (isNewClient) {
            if (!cliente || !cliente.rfc || !tipoPersona) return false;
            if (tipoPersona === 'fisica') {
                const c = cliente as IPersonaFisica;
                if (!c.nombre || !c.apellidoPaterno || !c.apellidoMaterno || !c.fechaNacimiento || !c.correo || !c.telefono) return false;
            } else if (tipoPersona === 'moral') {
                const c = cliente as IPersonaMoral;
                if (!c.razonSocial || !c.representanteLegal || !c.fechaConstitucion || !c.correo || !c.telefono) return false;
            }
        }
        if (!inmueble.direccion || !inmueble.valorMercado || !inmueble.foto) return false;
        if (!documentos.escritura || !documentos.libertad_gravamen || !documentos.avaluo || !documentos.fotografia) return false;
        if (rfcWarning) return false;
        return true;
    }, [isNewClient, cliente, tipoPersona, inmueble, documentos, rfcWarning]);

    const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isFormValid()) {
            alert('Por favor, llena todos los campos y documentos obligatorios.');
            return;
        }

        // Verificar existencia del RFC antes de continuar
        try {
            const clienteRFC = cliente?.rfc || rfc;
            if (clienteRFC && isNewClient) {
                try {
                    const existingCliente = await getClienteByRFC(clienteRFC);
                    if (existingCliente) {
                        setRfcWarning('ESTE CLIENTE YA EXISTE');
                        alert('No se puede continuar. Este RFC ya está registrado en el sistema.');
                        return;
                    }
                } catch (error) {
                    // Si hay un error 404, significa que el cliente no existe, lo cual es correcto
                    console.log('RFC disponible, continuando con el registro');
                }
            }
            
            setIsLoading(true);
            setUploadProgress(0);
            
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
            if (inmueble.foto) formData.append('file', inmueble.foto);
            // Simular progreso
            setUploadProgress(20);
            const newInmueble = await createInmueble(formData);
            setUploadProgress(50);
            // Subir documentos con progreso
            const totalDocs = 4;
            let docsDone = 0;
            for (const [tipo, file] of Object.entries(documentos)) {
                if (file) {
                    await DocumentoService.subirMultiplesDocumentos([file as File], newInmueble.id, tipo as TipoDocumento);
                }
                docsDone++;
                setUploadProgress(50 + Math.round((docsDone / totalDocs) * 50));
            }
            setOpenModal(true);
            setIsLoading(false);
            setUploadProgress(100);
            // Reset
            setIsNewClient(null);
            setCliente(null);
            setRFC('');
            setInmueble({ direccion: '', valorMercado: 0 });
            setDocumentos({ escritura: null, libertad_gravamen: null, avaluo: null, fotografia: null });
            setTipoPersona('');
            setAddress('');
            setRfcWarning('');
        } catch (error) {
            setIsLoading(false);
            setUploadProgress(0);
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    }, [isFormValid, cliente, tipoPersona, isNewClient, inmueble, documentos]);

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
                } as unknown as ICliente;
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

    const handleSelectInmueble = useCallback((value: string) => handleSelect(value, 'inmueble'), [handleSelect]);

    const handleCloseModal = useCallback(() => setOpenModal(false), []);

    return (
        <div className="cliente-form">
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-lg">
                        <div className="loader-spinner mb-4" style={{ width: 48, height: 48, border: '6px solid #e5e7eb', borderTop: '6px solid #dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <div className="text-lg font-semibold">Subiendo archivos... {uploadProgress}%</div>
                    </div>
                </div>
            )}
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
                            onBlur={handleRFCBlur}
                            maxLength={tipoPersona === 'fisica' ? 13 : 12}
                            className="text-center input-primary-rfc"
                        />
                        {rfcWarning && <p className="text-red-500 font-bold mt-2">{rfcWarning}</p>}
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
                        {/* Componente de Cliente */}
                        <ClienteFormComponent 
                            isNewClient={!!isNewClient}
                            tipoPersona={tipoPersona}
                            cliente={cliente}
                            handleClienteChange={handleClienteChange}
                            handleTipoPersonaChange={handleTipoPersonaChange}
                            handleRFCBlur={handleRFCBlur}
                            rfcWarning={rfcWarning}
                        />

                        {/* Componente de Inmueble */}
                        <InmuebleForm
                            inmueble={inmueble}
                            address={address}
                            handleAddressChange={handleAddressChange}
                            handleSelectInmueble={handleSelectInmueble}
                            valorMercadoFormatted={valorMercadoFormatted}
                            handleValorMercadoChange={handleValorMercadoChange}
                            handleValorMercadoBlur={handleValorMercadoBlur}
                            handleValorMercadoFocus={handleValorMercadoFocus}
                            handleInmuebleFotoDrop={handleInmuebleFotoDrop}
                            handleInmuebleFotoRemove={handleInmuebleFotoRemove}
                        />

                        {/* Componente de Documentos */}
                        <DocumentosForm
                            documentos={documentos}
                            handleDocumentoEscrituraDrop={handleDocumentoEscrituraDrop}
                            handleDocumentoEscrituraRemove={handleDocumentoEscrituraRemove}
                            handleDocumentoLibertadDrop={handleDocumentoLibertadDrop}
                            handleDocumentoLibertadRemove={handleDocumentoLibertadRemove}
                            handleDocumentoAvaluoDrop={handleDocumentoAvaluoDrop}
                            handleDocumentoAvaluoRemove={handleDocumentoAvaluoRemove}
                            handleDocumentoFotografiaDrop={handleDocumentoFotografiaDrop}
                            handleDocumentoFotografiaRemove={handleDocumentoFotografiaRemove}
                        />

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

export default ClienteForm;