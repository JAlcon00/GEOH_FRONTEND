import React, { memo } from 'react';
import { IInmueble } from '../../../types/inmueble.types';
import PlacesAutocomplete from 'react-places-autocomplete';
import { FaSearch } from 'react-icons/fa';
import Dropzone from 'react-dropzone';
import GoogleMapsLoader from '../../common/GoogleMapsLoader';

interface InmuebleProps {
  inmueble: IInmueble;
  address: string;
  handleAddressChange: (value: string) => void;
  handleSelectInmueble: (value: string) => void;
  valorMercadoFormatted: string;
  handleValorMercadoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleValorMercadoBlur: () => void;
  handleValorMercadoFocus: () => void;
  handleInmuebleFotoDrop: (acceptedFiles: File[]) => void;
  handleInmuebleFotoRemove: () => void;
}

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
      <GoogleMapsLoader>
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
      </GoogleMapsLoader>
    </div>
  );
});

const InmuebleForm: React.FC<InmuebleProps> = ({
  inmueble,
  address,
  handleAddressChange,
  handleSelectInmueble,
  valorMercadoFormatted,
  handleValorMercadoChange,
  handleValorMercadoBlur,
  handleValorMercadoFocus,
  handleInmuebleFotoDrop,
  handleInmuebleFotoRemove
}) => {
  // Función auxiliar para convertir tipos Accept
  const convertAcceptTypesToObject = (acceptTypesString: string) => {
    if (acceptTypesString === 'image/*') {
      return {
        'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      };
    }

    const extensions = acceptTypesString.split(',');
    const result: Record<string, string[]> = {};

    extensions.forEach(ext => {
      const cleanExt = ext.trim();
      if (cleanExt.startsWith('.')) {
        result[`application/${cleanExt.substring(1)}`] = [cleanExt];
      } else {
        result[cleanExt] = [];
      }
    });

    return result;
  };

  return (
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
                  <p className="text-gray-700">Archivo seleccionado: {inmueble.foto instanceof File ? inmueble.foto.name : 'Imagen existente'}</p>
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
  );
};

MemoizedAddressInput.displayName = 'MemoizedAddressInput';

export default InmuebleForm;