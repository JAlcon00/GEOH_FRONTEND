import React, { useEffect, useState } from 'react';
import { IInmueble } from '../../types/inmueble.types';
import { getInmuebleById, updateInmueble } from '../../services/inmueble.service';
import PlacesAutocomplete from 'react-places-autocomplete';
import { FaSearch, FaTimes } from 'react-icons/fa';
import GoogleMapsLoader from '../common/GoogleMapsLoader';

interface EditarInmuebleProps {
  inmuebleId: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Interfaz extendida para manejar la foto como string localmente
interface InmuebleExtendido {
  id?: number;
  direccion: string;
  valorMercado: number;
  foto?: string | null;
  clienteId?: number;
  estatus?: string;
}

const EditarInmueble: React.FC<EditarInmuebleProps> = ({ inmuebleId, onClose, onSuccess }) => {
  const [inmueble, setInmueble] = useState<InmuebleExtendido>({
    direccion: '',
    valorMercado: 0,
    foto: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [valorMercadoFormatted, setValorMercadoFormatted] = useState<string>('');

  // Cargar datos del inmueble
  useEffect(() => {
    const fetchInmueble = async () => {
      try {
        setLoading(true);
        const inmuebleData = await getInmuebleById(inmuebleId);
        setInmueble(inmuebleData);
        setAddress(inmuebleData.direccion || '');
        
        // Formatear el valor de mercado para mostrar en el input
        if (inmuebleData.valorMercado) {
          const formatter = new Intl.NumberFormat('es-MX', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          setValorMercadoFormatted(formatter.format(inmuebleData.valorMercado));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar el inmueble:', err);
        setError('Error al cargar los datos del inmueble.');
        setLoading(false);
      }
    };

    if (inmuebleId) {
      fetchInmueble();
    }
  }, [inmuebleId]);

  // Manejar cambios en dirección
  const handleAddressChange = (value: string) => {
    setAddress(value);
  };

  // Seleccionar dirección del autocompletado
  const handleSelectInmueble = (value: string) => {
    setAddress(value);
    setInmueble({ ...inmueble, direccion: value });
  };

  // Manejar cambios en el valor de mercado
  const handleValorMercadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir solo números y un punto decimal
    const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
    setValorMercadoFormatted(value);
    
    // Actualizar el valor numérico en el inmueble
    const numericValue = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      setInmueble({ ...inmueble, valorMercado: numericValue });
    }
  };

  // Formatear valor al perder el foco
  const handleValorMercadoBlur = () => {
    if (valorMercadoFormatted === '') return;
    
    const value = parseFloat(valorMercadoFormatted.replace(/,/g, ''));
    if (!isNaN(value)) {
      const formatter = new Intl.NumberFormat('es-MX', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setValorMercadoFormatted(formatter.format(value));
      setInmueble({ ...inmueble, valorMercado: value });
    }
  };

  // Eliminar formato al enfocar el campo
  const handleValorMercadoFocus = () => {
    setValorMercadoFormatted(valorMercadoFormatted.replace(/,/g, ''));
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inmueble.direccion) {
      setError('La dirección es obligatoria.');
      return;
    }
    
    if (!inmueble.valorMercado || inmueble.valorMercado <= 0) {
      setError('El valor de mercado debe ser mayor que cero.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Preparar los datos para enviar al servidor - solo dirección y valor de mercado
      const dataToSend: Partial<IInmueble> = {
        direccion: inmueble.direccion,
        valorMercado: inmueble.valorMercado,
      };
      
      // Enviar actualización al servidor sin incluir la foto
      await updateInmueble(inmuebleId, dataToSend as IInmueble);
      
      setSubmitting(false);
      onSuccess(); // Notificar éxito
      onClose(); // Cerrar el modal
    } catch (err) {
      console.error('Error al actualizar el inmueble:', err);
      setError('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Editar Inmueble</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <div className='relative'>
                  <GoogleMapsLoader>
                    <PlacesAutocomplete
                      value={address}
                      onChange={handleAddressChange}
                      onSelect={handleSelectInmueble}
                    >
                      {({ getInputProps, suggestions, getSuggestionItemProps }) => (
                        <div className="autocomplete-root">
                          <input
                            {...getInputProps({
                              placeholder: 'Busca dirección...',
                              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500',
                            })}
                          />
                          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                          <div className="autocomplete-dropdown absolute z-10 w-full bg-white shadow-lg rounded-md mt-1">
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
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Mercado</label>
                <input
                  type="text"
                  placeholder="Valor de Mercado"
                  value={valorMercadoFormatted}
                  onChange={handleValorMercadoChange}
                  onBlur={handleValorMercadoBlur}
                  onFocus={handleValorMercadoFocus}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Mostramos la foto actual pero sin permitir modificarla */}
              {inmueble.foto && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fotografía del Inmueble</label>
                  <div className="p-4 border border-gray-300 rounded-md text-center">
                    <p className="text-gray-700 mb-2">Imagen actual (no se puede modificar)</p>
                    <img 
                      src={typeof inmueble.foto === 'string' ? inmueble.foto : ''}
                      alt="Imagen actual del inmueble"
                      className="mt-2 mx-auto h-32 object-cover rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Guardando...
                  </span>
                ) : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditarInmueble;