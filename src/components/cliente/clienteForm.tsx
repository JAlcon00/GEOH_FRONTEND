import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@material-ui/core';
import { FaSearch } from 'react-icons/fa';
import { IoIosMail } from "react-icons/io";
import { IPersonaFisica, IPersonaMoral, ICliente, IClienteConTipo } from '../../types/cliente.types';
import PlacesAutocomplete, { geocodeByAddress } from 'react-places-autocomplete';
import { loadGoogleMaps } from '../../services/geocode.service';
import { IInmueble } from '../../types/inmueble.types';
import { TipoDocumento } from '../../types/documento.types';
import { getClienteByRFC, createCliente } from '../../services/cliente.service';
import DocumentoService from '../../services/documento.service'; // Importa DocumentoService
import { createInmueble } from '../../services/inmueble.service';
import { useLayout } from '../../contexts/LayoutContext';
import './clienteForm.css';


import Dropzone from 'react-dropzone';


const ClienteForm: React.FC = () => {

    const { collapsed } = useLayout();
    const [showModal, setShowModal] = useState<boolean>(true);
    const [isNewClient, setIsNewClient] = useState<boolean | null>(null);
    const [rfc, setRFC] = useState<string>('');
    const [cliente, setCliente] = useState<ICliente | null>(null);
    const [inmueble, setInmueble] = useState<IInmueble>({
        direccion: '',
        valorMercado: 0
    });

    const [isEditingValorMercado, setIsEditingValorMercado] = useState(false);
    const [valorMercadoInput, setValorMercadoInput] = useState<string>(inmueble.valorMercado.toString());




    const handleValorMercadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        setValorMercadoInput(rawValue);
    };

    const handleValorMercadoBlur = () => {
        const numericValue = parseFloat(valorMercadoInput);
        if (!isNaN(numericValue)) {
            setInmueble({ ...inmueble, valorMercado: numericValue });
        }
        setIsEditingValorMercado(false);
    };

    const handleValorMercadoFocus = () => {
        setIsEditingValorMercado(true);
    };

    const [documentos, setDocumentos] = useState<Record<TipoDocumento, File | null>>({
        escritura: null,
        libertad_gravamen: null,
        avaluo: null,
        fotografia: null
    });
    const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | ''>('');
    const [openModal, setOpenModal] = useState(false);

    const [address, setAddress] = useState<string>('');



    useEffect(() => {
        loadGoogleMaps(() => {
            console.log('Google Maps API loaded');
        });
    }, []);

    // Modifica handleSelect para aceptar un diferenciador: 'cliente' o 'inmueble'
    const handleSelect = async (value: string, field: 'cliente' | 'inmueble') => {
        // Se puede usar geocodeByAddress si se requiere validación o información adicional
        await geocodeByAddress(value);
        if (field === 'cliente') {
            // Actualiza el domicilio del cliente
            setCliente(cliente ? { ...cliente, domicilio: value } : null);
        } else {
            // Actualiza la dirección del inmueble
            setAddress(value);
            setInmueble({ ...inmueble, direccion: value });
        }
    };

    const handleRFCSubmit = async () => {
        try {
            console.log('Buscando cliente con RFC:', rfc);
            const cliente = await getClienteByRFC(rfc);
            setCliente(cliente);
            console.log(`Se encontró el RFC correspondiente: ${rfc}`);
            setIsNewClient(null); // Cierra ambos formularios
        } catch (error) {
            console.error('Cliente no encontrado', error);
            alert('Cliente no encontrado. Por favor, verifique el RFC ingresado.');
        }
    };


    const handleFormSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!cliente) {
            alert('Por favor, complete los datos del cliente.');
            return;
        }

        if (!tipoPersona) {
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
                const clienteConTipo: IClienteConTipo = { ...(cliente as unknown as ICliente), tipoPersona };
                const newCliente = await createCliente(clienteConTipo);
                clienteId = newCliente.id;
            }

            const formData = new FormData();
            formData.append('direccion', inmueble.direccion);
            formData.append('valorMercado', inmueble.valorMercado.toString());
            console.log('Cliente ID:', clienteId);
            formData.append('clienteId', clienteId!.toString());
            if (inmueble.foto) {
                formData.append('file', inmueble.foto);
            }

            console.log('Datos del inmueble:', formData);

            const newInmueble = await createInmueble(formData);

            // Subir documentos
            const documentosPromises = Object.entries(documentos)
                .filter(([_, file]) => file !== null)
                .map(([tipo, file]) => {
                    const documentoFormData = new FormData();
                    console.log('Inmueble ID:', newInmueble.id);
                    documentoFormData.append('inmuebleId', newInmueble.id.toString());
                    documentoFormData.append('tipoDocumento', tipo);
                    documentoFormData.append('file', file as File);

                    console.log('Datos del documento:', Object.fromEntries(documentoFormData.entries()));
                    return DocumentoService.subirMultiplesDocumentos([file as File], newInmueble.id, tipo);
                });

            await Promise.all(documentosPromises);
            alert('Datos guardados exitosamente');

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
    };



    return (

        <div className="cliente-form">
            {isNewClient === null && !cliente && (
                <div className="text-center">
                    <p className="text-lg font-semibold">¿Es un cliente nuevo?</p>
                    <div className="flex justify-center mt-4 gap-4">
                        <button
                            className="btn-primary bg-green-500 hover:bg-green-700"
                            onClick={() => setIsNewClient(true)}
                        >
                            Sí
                        </button>
                        <button
                            className="btn-primary bg-red-500 hover:bg-red-700"
                            onClick={() => setIsNewClient(false)}
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
                            onChange={(e) => setRFC(e.target.value)}
                            className="text-center input-primary-rfc"
                        />
                        <div className="cliente-form__navigation col-span-1 md:col-span-2">
                            <button type="button" className="m-4 mb-4 btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105" onClick={() => setIsNewClient(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                                </svg>
                            </button>
                            <button className="m-6 btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105" onClick={handleRFCSubmit}>
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
                    <form className="cliente-form__grid"
                        onSubmit={handleFormSubmit}>
                        {isNewClient && (
                            <div className="cliente-form__columna col-span-1">
                                <h3 className="text-xl font-semibold mb-4">Datos del Cliente</h3>
                                <select
                                    value={tipoPersona}
                                    onChange={(e) => setTipoPersona(e.target.value as 'fisica' | 'moral')}
                                    className='mb-4 input-primary'
                                >
                                    <option value="">Seleccione el tipo de persona</option>
                                    <option value="fisica">
                                        Persona Física
                                    </option>
                                    <option value="moral">
                                        Persona Moral
                                    </option>
                                </select>

                                {tipoPersona === 'fisica' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Nombre"
                                            value={(cliente as IPersonaFisica)?.nombre || ''}
                                            onChange={(e) => setCliente({ ...(cliente as unknown as IPersonaFisica), nombre: e.target.value })}
                                            className="input-primary col-span-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Apellido Paterno"
                                            value={(cliente as IPersonaFisica)?.apellidoPaterno || ''}
                                            onChange={(e) => setCliente({ ...(cliente as unknown as IPersonaFisica), apellidoPaterno: e.target.value })}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Apellido Materno"
                                            value={(cliente as IPersonaFisica)?.apellidoMaterno || ''}
                                            onChange={(e) => setCliente({ ...(cliente as unknown as IPersonaFisica), apellidoMaterno: e.target.value })}
                                            className="input-primary col-span-1"
                                        />

                                        <input
                                            type="date"
                                            placeholder="Fecha de Nacimiento"
                                            value={(cliente as IPersonaFisica)?.fechaNacimiento
                                                ? new Date((cliente as IPersonaFisica).fechaNacimiento).toISOString().split('T')[0]
                                                : ''
                                            }
                                            onChange={(e) => {
                                                const dateValue = e.target.value;
                                                if (dateValue) {
                                                    setCliente({
                                                        ...(cliente as unknown as IPersonaFisica),
                                                        fechaNacimiento: new Date(dateValue), // Solo asigna si hay un valor
                                                    });
                                                }
                                            }}
                                            className="input-primary col-span-1"
                                        />


                                        <input
                                            type="text"
                                            placeholder="RFC"
                                            value={cliente?.rfc || ''}
                                            onChange={(e) => {
                                                // Convertimos el valor a mayúsculas para evitar problemas de minúsculas
                                                const valorRFC = e.target.value.toUpperCase();
                                                setCliente(cliente ? { ...cliente, rfc: valorRFC } : null);
                                            }}
                                            // Máximo 13 caracteres (persona física) 
                                            // o 12 (persona moral). Si quieres abarcar ambos,
                                            // puedes dejar 13.
                                            maxLength={13}
                                            // Esta expresión regular valida tanto RFC de
                                            // personas morales (3 letras) como físicas (4 letras),
                                            // luego 6 dígitos para la fecha y 3 alfanuméricos al final.
                                            pattern="^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$"
                                            title="Ingresa un RFC válido (3 o 4 letras, 6 dígitos de fecha y 3 caracteres alfanuméricos)."
                                            className="input-primary col-span-1"
                                        />

                                        <div className='input-primary col-span-2 relative'>
                                            <input
                                                type="email"
                                                placeholder="Correo"
                                                value={cliente?.correo || ''}
                                                onChange={(e) => setCliente(cliente ? { ...cliente, correo: e.target.value } : null)}
                                                className="className: 'col-span-2 pr-10"
                                                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                                                title="Por favor, ingrese un correo electrónico válido."
                                            />
                                            <IoIosMail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />

                                        </div>


                                        <input
                                            type="text"
                                            placeholder="Teléfono"
                                            value={cliente?.telefono || ''}
                                            onChange={(e) => {
                                                const phoneValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                setCliente({ ...(cliente as ICliente), telefono: phoneValue });
                                            }}
                                            className="input-primary col-span-1"
                                            pattern="[0-9]{10}"
                                            title="Por favor, ingrese un número de teléfono válido de 10 dígitos."
                                        />





                                        <div className='input-primary col-span-2 relative'>
                                            <PlacesAutocomplete
                                                value={cliente?.domicilio || ''}
                                                onChange={(value: string) => setCliente(cliente ? { ...cliente, domicilio: value } : null)}
                                                onSelect={(value: string) => handleSelect(value, 'cliente')}
                                            >
                                                {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                                                    <div className="autocomplete-root">
                                                        <input
                                                            {...getInputProps({
                                                                placeholder: 'Domicilio',
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
                                        <input
                                            type="text"
                                            placeholder="Ciudad"
                                            value={cliente?.ciudad || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, ciudad: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Estado"
                                            value={cliente?.estado || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, estado: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="País"
                                            value={cliente?.pais || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, pais: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                    </div>
                                )}

                                {tipoPersona === 'moral' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Razón Social"
                                            value={(cliente as IPersonaMoral)?.razonSocial || ''}
                                            onChange={(e) => setCliente({ ...(cliente as unknown as IPersonaMoral), razonSocial: e.target.value })}
                                            className="input-primary col-span-1"

                                        />
                                        <input
                                            type="text"
                                            placeholder="Representante Legal"
                                            value={(cliente as IPersonaMoral)?.representanteLegal || ''}
                                            onChange={(e) => setCliente({ ...(cliente as unknown as IPersonaMoral), representanteLegal: e.target.value })}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="date"
                                            placeholder="Fecha de Constitución"
                                            value={(cliente as IPersonaMoral)?.fechaConstitucion
                                                ? new Date((cliente as IPersonaMoral).fechaConstitucion).toISOString().split('T')[0]
                                                : ''
                                            }
                                            onChange={(e) => {
                                                const dateValue = e.target.value;
                                                if (dateValue) {
                                                    setCliente({
                                                        ...(cliente as unknown as IPersonaMoral),
                                                        fechaConstitucion: new Date(dateValue), // Solo asignamos si hay valor
                                                    });
                                                }
                                            }}
                                            className="input-primary col-span-1"
                                        />

                                        <input
                                            type="text"
                                            placeholder="RFC"
                                            value={cliente?.rfc || ''}
                                            onChange={(e) => {
                                                // Convertimos el valor a mayúsculas para evitar problemas de minúsculas
                                                const valorRFC = e.target.value.toUpperCase();
                                                setCliente(cliente ? { ...cliente, rfc: valorRFC } : null);
                                            }}
                                            // Máximo 13 caracteres (persona física) 
                                            // o 12 (persona moral). Si quieres abarcar ambos,
                                            // puedes dejar 13.
                                            maxLength={12}
                                            // Esta expresión regular valida tanto RFC de
                                            // personas morales (3 letras) como físicas (4 letras),
                                            // luego 6 dígitos para la fecha y 3 alfanuméricos al final.
                                            pattern="^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$"
                                            title="Ingresa un RFC válido (3 o 4 letras, 6 dígitos de fecha y 3 caracteres alfanuméricos)."
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Correo"
                                            value={cliente?.correo || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, correo: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                            pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                                            title="Por favor, ingrese un correo electrónico válido."
                                        />
                                        <input
                                            type="text"
                                            placeholder="Teléfono"
                                            value={cliente?.telefono || ''}
                                            onChange={(e) => {
                                                const phoneValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                setCliente({ ...(cliente as ICliente), telefono: phoneValue });
                                            }}
                                            className="input-primary col-span-1"
                                            pattern="[0-9]{10}"
                                            title="Por favor, ingrese un número de teléfono válido de 10 dígitos."
                                        />


                                        <div className='input-primary col-span-2 relative'>
                                            <PlacesAutocomplete
                                                value={cliente?.domicilio || ''}
                                                onChange={(value: string) => setCliente(cliente ? { ...cliente, domicilio: value } : null)}
                                                onSelect={(value: string) => handleSelect(value, 'cliente')}
                                            >
                                                {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                                                    <div className="autocomplete-root">
                                                        <input
                                                            {...getInputProps({
                                                                placeholder: 'Domicilio',
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


                                        <input
                                            type="text"
                                            placeholder="Ciudad"
                                            value={cliente?.ciudad || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, ciudad: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Estado"
                                            value={cliente?.estado || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, estado: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="País"
                                            value={cliente?.pais || ''}
                                            onChange={(e) => setCliente(cliente ? { ...cliente, pais: e.target.value } : null)}
                                            className="input-primary col-span-1"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="cliente-form__columna col-span-1 ">
                            <h3 className="text-xl font-semibold mb-4">Datos del Inmueble</h3>
                            <div className="cliente-form__section gap-4">
                                <div className='input-primary col-span-2 relative mb-8'>
                                    <PlacesAutocomplete value={address} onChange={setAddress} onSelect={(value: string) => handleSelect(value, 'inmueble')}>
                                        {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                                            <div className="autocomplete-root">
                                                <input
                                                    {...getInputProps({
                                                        placeholder: 'Busca dirección...',
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


                                <input
                                    type="text"
                                    placeholder="Valor de Mercado"
                                    value={isEditingValorMercado ? valorMercadoInput : inmueble.valorMercado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                    onChange={handleValorMercadoChange}
                                    onBlur={handleValorMercadoBlur}
                                    onFocus={handleValorMercadoFocus}
                                    className="input-primary"
                                />
                            </div>

                            <div className="cliente-form__section col-span-1 md:col-span-2">
                                <h4 className="text-s font-semibold mt-4 mb-4">Fotografía del Inmueble</h4>
                                <Dropzone onDrop={(acceptedFiles) => setInmueble({ ...inmueble, foto: acceptedFiles[0] })}>
                                    {({ getRootProps, getInputProps }) => (
                                        <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                            <input {...getInputProps()} accept="image/*" />
                                            {inmueble.foto ? (
                                                <>
                                                    <p className="text-gray-700">Archivo seleccionado: {inmueble.foto.name}</p>
                                                    <button
                                                        type="button"
                                                        className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                        onClick={() => setInmueble({ ...inmueble, foto: null })}>
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
                                <div className="documento-input col-span-1">
                                    <label>Escritura</label>
                                    <Dropzone onDrop={(acceptedFiles) => setDocumentos(prev => ({ ...prev, escritura: acceptedFiles[0] }))}>
                                        {({ getRootProps, getInputProps }) => (
                                            <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                                <input {...getInputProps()} accept=".pdf,.doc,.docx" />
                                                {documentos.escritura ? (
                                                    <>
                                                        <p className="text-gray-700">Archivo seleccionado: {documentos.escritura.name}</p>
                                                        <button
                                                            type="button"
                                                            className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                            onClick={() => setDocumentos(prev => ({ ...prev, escritura: null }))}>
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

                                <div className="documento-input col-span-1">
                                    <label>Libertad de Gravamen</label>
                                    <Dropzone onDrop={(acceptedFiles) => setDocumentos(prev => ({ ...prev, libertad_gravamen: acceptedFiles[0] }))}>
                                        {({ getRootProps, getInputProps }) => (
                                            <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                                <input {...getInputProps()} accept=".pdf,.doc,.docx" />
                                                {documentos.libertad_gravamen ? (
                                                    <>
                                                        <p className="text-gray-700">Archivo seleccionado: {documentos.libertad_gravamen.name}</p>
                                                        <button
                                                            type="button"
                                                            className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                            onClick={() => setDocumentos(prev => ({ ...prev, libertad_gravamen: null }))}>
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

                                <div className="documento-input col-span-1">
                                    <label>Avalúo</label>
                                    <Dropzone onDrop={(acceptedFiles) => setDocumentos(prev => ({ ...prev, avaluo: acceptedFiles[0] }))}>
                                        {({ getRootProps, getInputProps }) => (
                                            <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                                <input {...getInputProps()} accept=".pdf,.doc,.docx" />
                                                {documentos.avaluo ? (
                                                    <>
                                                        <p className="text-gray-700">Archivo seleccionado: {documentos.avaluo.name}</p>
                                                        <button
                                                            type="button"
                                                            className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                            onClick={() => setDocumentos(prev => ({ ...prev, avaluo: null }))}>
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

                                <div className="documento-input col-span-1">
                                    <label>Fotografía</label>
                                    <Dropzone onDrop={(acceptedFiles) => setDocumentos(prev => ({ ...prev, fotografia: acceptedFiles[0] }))}>
                                        {({ getRootProps, getInputProps }) => (
                                            <div {...getRootProps()} className="dropzone p-4 border-dashed border-2 border-gray-300 rounded-md text-center cursor-pointer">
                                                <input {...getInputProps()} accept="image/*" />
                                                {documentos.fotografia ? (
                                                    <>
                                                        <p className="text-gray-700">Archivo seleccionado: {documentos.fotografia.name}</p>
                                                        <button
                                                            type="button"
                                                            className="btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 mt-2"
                                                            onClick={() => setDocumentos(prev => ({ ...prev, fotografia: null }))}>
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
                        </div>

                        <div className="flex justify-center col-span-3 mt-4 gap-4">
                            <button type="button" className="m-4 mb-4 btn-primary bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setIsNewClient(null);
                                    setRFC('');
                                    setCliente(null);

                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                                </svg>
                            </button>
                            <button type="submit" className="m-4 mb-4 btn-primary bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>

                            </button>

                        </div>


                    </form>

                </div>

            )}


            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <div className="modal-content"
                >
                    <h2>Datos guardados exitosamente</h2>
                    <Button style={{ float: 'right' }} onClick={() => setOpenModal(false)}>Cerrar</Button>
                </div>
            </Modal>


        </div>
    );
};

export default ClienteForm;