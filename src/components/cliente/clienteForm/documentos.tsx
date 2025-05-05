import React, { memo, useCallback } from 'react';
import { TipoDocumento } from '../../../types/documento.types';
import Dropzone, { Accept } from 'react-dropzone';

interface DocumentosProps {
    documentos: Record<TipoDocumento, File | null>;
    handleDocumentoEscrituraDrop: (file: File) => void;
    handleDocumentoEscrituraRemove: () => void;
    handleDocumentoLibertadDrop: (file: File) => void;
    handleDocumentoLibertadRemove: () => void;
    handleDocumentoAvaluoDrop: (file: File) => void;
    handleDocumentoAvaluoRemove: () => void;
    handleDocumentoFotografiaDrop: (file: File) => void;
    handleDocumentoFotografiaRemove: () => void;
}

// Interfaz para las props del componente dropzone
interface DocumentoDropzoneProps {
    label: string;
    documento: File | null;
    onDrop: (file: File) => void;
    onRemove: () => void;
    acceptTypes: string;
}

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

const DocumentosForm: React.FC<DocumentosProps> = ({
    documentos,
    handleDocumentoEscrituraDrop,
    handleDocumentoEscrituraRemove,
    handleDocumentoLibertadDrop,
    handleDocumentoLibertadRemove,
    handleDocumentoAvaluoDrop,
    handleDocumentoAvaluoRemove,
    handleDocumentoFotografiaDrop,
    handleDocumentoFotografiaRemove,
}) => {
    return (
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
    );
};

// Añadir displayName para herramientas de desarrollo
MemoizedDocumentoDropzone.displayName = 'MemoizedDocumentoDropzone';

export default DocumentosForm;