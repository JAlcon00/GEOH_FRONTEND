import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import useGoogleMaps from '../hook/useGoogleMaps';
import { FaFileAlt, FaSearch, FaMapMarkerAlt, FaHome, FaMoneyBillWave, FaMapMarkedAlt, FaUser, FaCheckCircle, FaMapPin } from 'react-icons/fa';
import { buscarInmuebles } from '../services/search.service';
import { getInmueblesByCliente, getInmuebleById } from '../services/inmueble.service';
import { getClienteByRFC, getClienteById } from '../services/cliente.service';
import { geocodeAddress } from '../services/geocode.service';
import InmuebleByCliente from '../components/inmueble/inmuebleByCliente';
import DocumentoManager from '../components/documento/documentoManager';

interface Inmueble {
  id: number;
  direccion: string;
  lat?: number;
  lon?: number;
  precio?: string;
  image?: string;
  nombre?: string;
  rfc?: string;
  ubicacionGeografica?: {
    lat: number;
    lon: number;
  };
  clienteId?: number;
  valorMercado?: string;
  // Campos adicionales para la información del cliente
  nombreCliente?: string;
  domicilioCliente?: string;
  foto?: string;
  estatus?: string;
}

const containerStyle = {
  width: '100%',
  height: '500px',
  margin: '0 auto',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.5s ease-in-out', // Añadir transición para animación
};

const center = { lat: 21.1445, lng: -101.6867 };

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Home: React.FC = () => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedProperty, setSelectedProperty] = useState<Inmueble | null>(null);
  const [markers, setMarkers] = useState<Inmueble[]>([]);
  const [nearbyMarkers, setNearbyMarkers] = useState<Inmueble[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'nombre' | 'direccion' | 'rfc'>('direccion');
  const [resultProperties, setResultProperties] = useState<Inmueble[]>([]);
  const [showResults, setShowResults] = useState(false); // Estado para controlar la visibilidad de resultados
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [selectedInmuebleId, setSelectedInmuebleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Efecto para manejar la visibilidad de resultados basado en resultProperties
  useEffect(() => {
    // Si hay resultados, mostrar el panel lateral después de un pequeño retraso para la animación
    if (resultProperties.length > 0) {
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [resultProperties]);

  // Efecto para cargar detalles completos del inmueble cuando se selecciona un inmueble
  useEffect(() => {
    if (selectedProperty && selectedProperty.id) {
      const fetchFullInmuebleDetails = async () => {
        try {
          const fullDetails = await getInmuebleById(selectedProperty.id);
          setSelectedProperty(prev => ({
            ...prev,
            ...fullDetails
          }));
        } catch (error) {
          console.error('Error obteniendo detalles completos del inmueble:', error);
        }
      };
      
      fetchFullInmuebleDetails();
    }
  }, [selectedProperty?.id]);

  if (loadError) return <div>Error al cargar Google Maps</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  // Manejo del input de búsqueda: se consulta a buscarInmuebles (tu base de datos)
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      // Para todos los casos se consulta la base de datos
      if (searchType === 'direccion') {
        const params = { direccion: value };
        const results = await buscarInmuebles(params);
        setSuggestions(results);
      } else if (searchType === 'rfc') {
        const trimmedValue = value.trim();
        if (trimmedValue.length >= 3) {
          const params = { rfc: trimmedValue };
          const results = await buscarInmuebles(params);
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } else if (searchType === 'nombre') {
        if (value.replace(/\s/g, '').length >= 3) {
          // Uso apropiado del parámetro nombre sin necesidad de aserción de tipo
          const results = await buscarInmuebles({ nombre: value });
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (item: any) => {
    const termino = item[searchType] || '';
    setSearchTerm(termino);
    setSuggestions([]);
    handleSearch(termino);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Función mejorada para validar coordenadas
  const isValidCoordinate = (coord: any): boolean => {
    // Primero verificamos si las coordenadas existen en ubicacionGeografica
    if (coord?.ubicacionGeografica?.lat && coord?.ubicacionGeografica?.lon) {
      const lat = Number(coord.ubicacionGeografica.lat);
      const lon = Number(coord.ubicacionGeografica.lon);
      return !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon);
    }
    
    // Luego verificamos si las coordenadas están directamente en el objeto
    if (coord?.lat && coord?.lon) {
      const lat = Number(coord.lat);
      const lon = Number(coord.lon);
      return !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon);
    }
    
    return false;
  };

  // Función auxiliar para obtener coordenadas seguras
  const getSafeCoordinates = (inmueble: Inmueble): { lat: number, lng: number } => {
    try {
      // Primero intenta con ubicacionGeografica
      if (inmueble?.ubicacionGeografica?.lat && inmueble?.ubicacionGeografica?.lon) {
        const lat = Number(inmueble.ubicacionGeografica.lat);
        const lon = Number(inmueble.ubicacionGeografica.lon);
        if (!isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
          return { lat, lng: lon };
        }
      }
      
      // Luego intenta con lat/lon directos
      if (inmueble?.lat && inmueble?.lon) {
        const lat = Number(inmueble.lat);
        const lon = Number(inmueble.lon);
        if (!isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
          return { lat, lng: lon };
        }
      }
      
      // Si no hay coordenadas válidas, retorna el centro predeterminado
      return center;
    } catch (error) {
      console.error('Error al obtener coordenadas seguras:', error);
      return center; // Retorna el centro predeterminado si hay un error
    }
  };

  // Función para cargar información del cliente para un inmueble
  const loadPropertyWithClientInfo = async (inmueble: Inmueble): Promise<Inmueble> => {
    try {
      if (inmueble.clienteId) {
        const cliente = await getClienteById(inmueble.clienteId);
        if (cliente) {
          // Determinar el nombre del cliente según su tipo (física o moral)
          let nombreCliente = '';
          if (cliente.tipoPersona === 'fisica') {
            nombreCliente = `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''}`;
          } else {
            nombreCliente = cliente.razonSocial || '';
          }
          
          // Obtener el domicilio del cliente
          let domicilioCliente = '';
          if (cliente.direccion) {
            domicilioCliente = cliente.direccion;
          } else if (cliente.calle) {
            // Construir domicilio a partir de componentes individuales
            domicilioCliente = `${cliente.calle || ''} ${cliente.numeroExterior || ''}, ${cliente.colonia || ''}, ${cliente.municipio || ''}, ${cliente.estado || ''}`;
          }
          
          return { ...inmueble, nombreCliente, domicilioCliente };
        }
      }
      return inmueble;
    } catch (error) {
      console.error('Error al cargar información del cliente:', error);
      return inmueble;
    }
  };

  // Función principal de búsqueda
  const handleSearch = async (inputValue?: string) => {
    const term = inputValue || searchTerm;
    if (!term) return;
    
    setLoading(true);
    try {
      // Limpiar resultados previos para iniciar la animación
      setResultProperties([]);
      setShowResults(false);
      
      let inmuebles: Inmueble[] = [];
      if (searchType === 'direccion') {
        // Obtiene el inmueble cuya dirección coincide EXACTAMENTE
        inmuebles = await buscarInmuebles({ direccion: term });
        inmuebles = inmuebles.filter(inmueble =>
          inmueble.direccion.trim().toLowerCase() === term.trim().toLowerCase()
        );
        // Si se obtienen más de uno, toma sólo el primero (GETBYID)
        if (inmuebles.length > 1) {
          inmuebles = [inmuebles[0]];
        }
      } else if (searchType === 'nombre' || searchType === 'rfc') {
        const params = { [searchType]: term };
        inmuebles = await buscarInmuebles(params);
        if (inmuebles.length === 0 && searchType === 'rfc') {
          try {
            const cliente = await getClienteByRFC(term);
            if (cliente && cliente.id) {
              inmuebles = await getInmueblesByCliente(cliente.id);
            }
          } catch (error) {
            console.warn('No se encontró cliente por RFC:', error);
          }
        }
      }
      
      if (inmuebles.length > 0) {
        // Cargar información de cliente para todos los inmuebles
        const inmueblesConCliente = await Promise.all(
          inmuebles.map(async inmueble => {
            // Carga la información completa del inmueble y luego la del cliente
            try {
              // Para búsqueda por dirección, cargar detalles completos y el cliente
              if (searchType === 'direccion' && inmuebles.length === 1) {
                const fullDetails = await getInmuebleById(inmueble.id);
                inmueble = { ...inmueble, ...fullDetails };
              }
              
              // Cargar información del cliente para el inmueble
              if (inmueble.clienteId) {
                return await loadPropertyWithClientInfo(inmueble);
              }
            } catch (error) {
              console.error('Error al cargar detalles adicionales:', error);
            }
            return inmueble;
          })
        );
        
        setResultProperties(inmueblesConCliente);
        
        const primerInmueble = inmueblesConCliente[0];
        if (isValidCoordinate(primerInmueble)) {
          // Obtener coordenadas de forma segura
          const safeCoords = getSafeCoordinates(primerInmueble);
          setMapCenter(safeCoords);
          
          const markersValidos = inmueblesConCliente
            .filter(isValidCoordinate)
            .map(inmueble => {
              // Asegúrate de que lat y lon sean números válidos
              const lat = Number(inmueble.lat || inmueble.ubicacionGeografica?.lat || 0);
              const lon = Number(inmueble.lon || inmueble.ubicacionGeografica?.lon || 0);
              
              if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
                console.warn(`Coordenadas inválidas para el inmueble ${inmueble.id}:`, { lat, lon });
                return null; // Saltamos este marcador
              }
              
              return {
                ...inmueble,
                lat,
                lon
              };
            })
            .filter(Boolean) as Inmueble[]; // Filtrar elementos null
          
          setMarkers(markersValidos);
        } else {
          const geocoded = await geocodeAddress(primerInmueble.direccion);
          if (geocoded) {
            setMapCenter({ lat: geocoded.lat, lng: geocoded.lon });
            const markersGeocodificados = await Promise.all(
              inmuebles.map(async (inmueble) => {
                if (!isValidCoordinate(inmueble)) {
                  const coords = await geocodeAddress(inmueble.direccion);
                  return coords
                    ? { ...inmueble, lat: coords.lat, lon: coords.lon, direccion: coords.formattedAddress || inmueble.direccion }
                    : inmueble;
                }
                return inmueble;
              })
            );
            setMarkers(markersGeocodificados.filter(isValidCoordinate));
          } else {
            alert('No se pudo obtener la ubicación del inmueble');
            setMarkers([]);
          }
        }
      } else {
        alert('No se encontraron resultados');
        setMarkers([]);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      alert('Ocurrió un error al buscar. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de documentos
  const handleVerExpediente = (inmuebleId: number) => {
    setSelectedInmuebleId(inmuebleId);
    setShowDocumentoModal(true);
  };

  // Función para centrar el mapa en un inmueble específico
  const handleVerEnMapa = async (inmueble: Inmueble) => {
    try {
      // Si tiene coordenadas válidas, usarlas directamente
      if (isValidCoordinate(inmueble)) {
        const safeCoords = getSafeCoordinates(inmueble);
        console.log('Coordenadas válidas:', safeCoords); // Para depurar
        setMapCenter(safeCoords);
        setSelectedProperty(inmueble);
      } 
      // Si no tiene coordenadas, intentar geocodificar la dirección
      else if (inmueble.direccion) {
        setLoading(true);
        try {
          const geocoded = await geocodeAddress(inmueble.direccion);
          
          if (geocoded && !isNaN(geocoded.lat) && !isNaN(geocoded.lon)) {
            console.log('Coordenadas geocodificadas:', geocoded); // Para depurar
            
            // Actualizar el inmueble con las nuevas coordenadas
            const inmuebleActualizado = {
              ...inmueble,
              lat: geocoded.lat,
              lon: geocoded.lon,
              // Si hay una dirección formateada, actualizarla también
              direccion: geocoded.formattedAddress || inmueble.direccion
            };
            
            // Actualizar estado para el mapa
            setMapCenter({ lat: geocoded.lat, lng: geocoded.lon });
            setSelectedProperty(inmuebleActualizado);
            
            // Actualizar el marcador en el mapa
            setMarkers(prevMarkers => {
              // Buscar si el marcador ya existe
              const markerExists = prevMarkers.some(m => m.id === inmueble.id);
              
              if (markerExists) {
                // Reemplazar el marcador existente
                return prevMarkers.map(m => m.id === inmueble.id ? inmuebleActualizado : m);
              } else {
                // Agregar nuevo marcador
                return [...prevMarkers, inmuebleActualizado];
              }
            });
            
            // Si el inmueble está en resultProperties, actualizarlo allí también
            setResultProperties(prevProps => {
              return prevProps.map(p => p.id === inmueble.id ? inmuebleActualizado : p);
            });
          } else {
            console.warn('Geocodificación no produjo coordenadas válidas:', geocoded);
            alert('No se pudo geocodificar la dirección del inmueble. Verifique que sea una dirección válida.');
          }
        } catch (geocodeError) {
          console.error('Error al geocodificar:', geocodeError);
          alert('Error al geocodificar la dirección del inmueble.');
        }
        setLoading(false);
      } else {
        alert('El inmueble no tiene dirección o coordenadas para mostrarlo en el mapa.');
      }
      
      // Mover la vista del usuario al mapa (scroll suave)
      const mapElement = document.getElementById('map-container');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Error al mostrar inmueble en el mapa:', error);
      setLoading(false);
      alert('Ocurrió un error al intentar mostrar el inmueble en el mapa.');
    }
  };

  const handleMarkerClick = (marker: Inmueble) => {
    setSelectedProperty(marker);
    const radius = 1000; // Radio en metros
    const nearby = markers.filter(m =>
      m.id !== marker.id &&
      haversineDistance(Number(m.lat), Number(m.lon), Number(marker.lat), Number(marker.lon)) < radius
    );
    setNearbyMarkers(nearby);
  };

  // Función para generar un fallback de imagen si la original no carga
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
  };

  // Función para determinar el color del estatus basado en su valor
  const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'text-gray-500'; // Por defecto si no hay estatus
    
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'text-gray-500';
      case 'rechazado':
        return 'text-red-600';
      case 'aceptado':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Área de búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={`Buscar por ${searchType}...`}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 text-sm"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-lg rounded w-full z-50">
              {suggestions.map((sug, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-100 hover:font-semibold cursor-pointer transition duration-150 ease-in-out"
                  onClick={() => handleSuggestionSelect(sug)}
                >
                  {sug[searchType] || 'Sugerencia'}
                </div>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={() => handleSearch()} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition focus:outline-none flex items-center gap-1"
        >
          <FaSearch className="text-white" />
          Buscar
        </button>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'nombre' | 'direccion' | 'rfc')}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 text-sm"
        >
          <option value="direccion">Dirección</option>
          <option value="nombre">Nombre</option>
          <option value="rfc">RFC</option>
        </select>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-lg animate-pulse">
            <p className="text-lg font-semibold">Buscando inmuebles...</p>
          </div>
        </div>
      )}

      {/* Contenedor principal con transición */}
      {searchType === 'direccion' && resultProperties.length > 0 ? (
        /* Layout con card lateral para búsqueda por dirección */
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Mapa a la izquierda */}
          <div 
            id="map-container"
            className="w-full lg:w-2/3 transition-all duration-500 ease-in-out"
          >
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter.lat && !isNaN(mapCenter.lat) ? mapCenter : center} // Verificación adicional
              zoom={15}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
              }}
            >
              {markers
                .filter(marker => 
                  !isNaN(Number(marker.lat)) && 
                  !isNaN(Number(marker.lon)) &&
                  isFinite(Number(marker.lat)) && 
                  isFinite(Number(marker.lon))
                )
                .map((marker, index) => (
                  <Marker
                    key={index}
                    position={{ 
                      lat: Number(marker.lat), 
                      lng: Number(marker.lon) 
                    }}
                    onClick={() => handleMarkerClick(marker)}
                    animation={google.maps.Animation.DROP}
                    label={{
                      text: `${marker.nombreCliente ? marker.nombreCliente + ': ' : ''}$${Number(marker.valorMercado).toLocaleString()}`,
                      color: 'black',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                    icon={
                      selectedProperty && marker.id === selectedProperty.id
                        ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                        : nearbyMarkers.some(n => n.id === marker.id)
                        ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                        : undefined
                    }
                  />
                ))
              }
            </GoogleMap>
          </div>

          {/* Card a la derecha, con animación de aparición */}
          <div className="w-full lg:w-1/3 transition-all duration-500 ease-in-out animate-fadeIn">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full">
              {/* Cabecera con imagen */}
              <div className="relative">
                <img 
                  src={resultProperties[0].image || resultProperties[0].foto || "https://via.placeholder.com/800x400?text=Sin+Imagen"} 
                  alt={`Inmueble en ${resultProperties[0].direccion}`}
                  className="w-full h-48 object-cover object-center"
                  onError={handleImageError}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h3 className="text-white text-lg font-bold">Inmueble #{resultProperties[0].id}</h3>
                </div>
                {/* Badge de estatus en la esquina superior derecha */}
                {resultProperties[0].estatus && (
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(resultProperties[0].estatus)} bg-white bg-opacity-80`}>
                    <FaCheckCircle className="inline mr-1" />
                    {resultProperties[0].estatus}
                  </div>
                )}
              </div>
              
              {/* Contenido */}
              <div className="p-6">
                {/* Nombre del cliente */}
                {resultProperties[0].nombreCliente && (
                  <div className="mb-4 flex items-start gap-2">
                    <FaUser className="mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Cliente</h4>
                      <p className="text-gray-600">{resultProperties[0].nombreCliente}</p>
                    </div>
                  </div>
                )}

                {/* Domicilio del cliente */}
                {resultProperties[0].domicilioCliente && (
                  <div className="mb-4 flex items-start gap-2">
                    <FaMapPin className="mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Domicilio del cliente</h4>
                      <p className="text-gray-600">{resultProperties[0].domicilioCliente}</p>
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-start gap-2">
                  <FaHome className="mt-1 text-gray-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Dirección del inmueble</h4>
                    <p className="text-gray-600">{resultProperties[0].direccion}</p>
                  </div>
                </div>
                
                <div className="mb-4 flex items-start gap-2">
                  <FaMoneyBillWave className="mt-1 text-gray-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Valor de Mercado</h4>
                    <p className="text-gray-600 text-xl">${Number(resultProperties[0].valorMercado).toLocaleString()}</p>
                  </div>
                </div>

                {resultProperties[0].clienteId && (
                  <div className="mb-4 flex items-start gap-2">
                    <FaMapMarkedAlt className="mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Cliente ID</h4>
                      <p className="text-gray-600">#{resultProperties[0].clienteId}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleVerExpediente(resultProperties[0].id)}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
                  >
                    <FaFileAlt /> Ver Expediente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Layout original para búsqueda por nombre/RFC o cuando no hay resultados */
        <div className="flex flex-col gap-4">
          {/* Mapa - Se ajusta automáticamente según hay resultados */}
          <div 
            id="map-container"
            className="w-full transition-all duration-500 ease-in-out"
          >
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter.lat && !isNaN(mapCenter.lat) ? mapCenter : center} // Verificación adicional
              zoom={15}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
              }}
            >
              {markers
                .filter(marker => 
                  !isNaN(Number(marker.lat)) && 
                  !isNaN(Number(marker.lon)) &&
                  isFinite(Number(marker.lat)) && 
                  isFinite(Number(marker.lon))
                )
                .map((marker, index) => (
                  <Marker
                    key={index}
                    position={{ 
                      lat: Number(marker.lat), 
                      lng: Number(marker.lon) 
                    }}
                    onClick={() => handleMarkerClick(marker)}
                    animation={google.maps.Animation.DROP}
                    label={{
  text: `${marker.nombreCliente ? marker.nombreCliente + ': ' : ''}$${Number(marker.valorMercado).toLocaleString()}`,
  color: '#FF4500', // Color personalizado
  fontSize: '14px', // Tamaño más pequeño
  fontWeight: 'bold',
  className: 'marker-label', // Añadir una clase CSS personalizada
}}
                    icon={{
                        url: marker.estatus === 'aceptado' 
                          ? '/imagenes/marcador-verde.png'
                          : marker.estatus === 'rechazado'
                          ? '/imagenes/marcador-rojo.png'
                          : '/imagenes/marcador-default.png',
                        scaledSize: new window.google.maps.Size(40, 40), // Tamaño personalizado
                        origin: new window.google.maps.Point(0, 0),
                        anchor: new window.google.maps.Point(20, 40), // Ajusta el punto de anclaje
                      }}
                  />
                ))
              }
            </GoogleMap>
          </div>

          {/* Resultados para búsqueda por nombre/RFC */}
          {resultProperties.length > 0 && searchType !== 'direccion' && (
            <div className="w-full mt-4 animate-fadeIn">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Propiedades del cliente ({resultProperties.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {resultProperties.map(inmueble => (
                    <div key={inmueble.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Imagen del inmueble */}
                      <div className="relative h-40">
                        <img 
                          src={inmueble.image || inmueble.foto || "https://via.placeholder.com/400x200?text=Sin+Imagen"} 
                          alt={`Inmueble en ${inmueble.direccion}`}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-bold">
                          #{inmueble.id}
                        </div>
                        {/* Badge de estatus */}
                        {inmueble.estatus && (
                          <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(inmueble.estatus)} bg-white bg-opacity-90`}>
                            {inmueble.estatus}
                          </div>
                        )}
                      </div>
                      
                      {/* Datos del inmueble */}
                      <div className="p-4">
                        {/* Nombre del cliente */}
                        {inmueble.nombreCliente && (
                          <div className="flex items-center gap-1 mb-2">
                            <FaUser className="text-gray-500" size={12} />
                            <p className="text-sm text-gray-600 font-medium">
                              {inmueble.nombreCliente}
                            </p>
                          </div>
                        )}
                        
                        {/* Domicilio del cliente */}
                        {inmueble.domicilioCliente && (
                          <div className="flex items-center gap-1 mb-2">
                            <FaMapPin className="text-gray-500" size={12} />
                            <p className="text-xs text-gray-500 line-clamp-1" title={inmueble.domicilioCliente}>
                              {inmueble.domicilioCliente}
                            </p>
                          </div>
                        )}
                        
                        <h4 className="font-semibold text-gray-700 text-lg mb-2 line-clamp-1" title={inmueble.direccion}>
                          {inmueble.direccion}
                        </h4>
                        
                        <p className="text-gray-700 mb-3 font-semibold">
                          ${Number(inmueble.valorMercado).toLocaleString()}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <button
                            onClick={() => handleVerEnMapa(inmueble)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <FaMapMarkerAlt /> Mapa
                          </button>
                          <button
                            onClick={() => handleVerExpediente(inmueble.id)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <FaFileAlt /> Expediente
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para ver documentos */}
      {showDocumentoModal && selectedInmuebleId && (
        <DocumentoManager
          inmuebleId={selectedInmuebleId}
          onClose={() => setShowDocumentoModal(false)}
        />
      )}
    </div>
  );
};

export default Home;
