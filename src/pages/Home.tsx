import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import useGoogleMaps from '../hook/useGoogleMaps';
import { FaFileAlt, FaSearch } from 'react-icons/fa';
import { buscarInmuebles } from '../services/search.service';
import { getInmueblesByCliente } from '../services/inmueble.service';
import { getClienteByRFC } from '../services/cliente.service';
import { geocodeAddress } from '../services/geocode.service';
import InmuebleByCliente from '../components/inmueble/inmuebleByCliente';

// Interfaz para definir el objeto Inmueble
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
}

// Estilos del contenedor del mapa
const containerStyle = {
    width: '100%', // En móviles ocupa el 100%
    height: '500px',
    margin: '0 auto',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const center = { lat: 21.1445, lng: -101.6867 };

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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

    if (loadError) return <div>Error al cargar Google Maps</div>;
    if (!isLoaded) return <div>Cargando mapa...</div>;

    // Manejo del input de búsqueda
    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; // Se permite espacios
        setSearchTerm(value);

        // Validación para el campo RFC; para los demás se cuenta la cantidad de caracteres sin espacios
        if (searchType === 'rfc') {
            const trimmedValue = value.trim();
            if (trimmedValue.length >= 3) {
                try {
                    const params = { [searchType]: trimmedValue };
                    const results = await buscarInmuebles(params);
                    setSuggestions(results);
                } catch (error) {
                    console.error('Error obteniendo sugerencias:', error);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        } else {
            if (value.replace(/\s/g, '').length >= 3) {
                try {
                    const params = { [searchType]: value };
                    const results = await buscarInmuebles(params);
                    setSuggestions(results);
                } catch (error) {
                    console.error('Error obteniendo sugerencias:', error);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
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

    // Función para validar coordenadas
    const isValidCoordinate = (coord: any): boolean => {
        if (coord?.ubicacionGeografica?.lat && coord?.ubicacionGeografica?.lon) {
            return !isNaN(Number(coord.ubicacionGeografica.lat)) && !isNaN(Number(coord.ubicacionGeografica.lon));
        }
        return !isNaN(Number(coord?.lat)) && !isNaN(Number(coord?.lon));
    };

    // Función principal de búsqueda
    const handleSearch = async (inputValue?: string) => {
        const term = inputValue ? inputValue : searchTerm;
        if (!term) return;

        try {
            let inmuebles: Inmueble[] = [];
            const isNumeric = /^[0-9]+$/.test(term);

            if (isNumeric && searchType === 'nombre') {
                inmuebles = await getInmueblesByCliente(Number(term));
            } else {
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
                const primerInmueble = inmuebles[0];
                if (isValidCoordinate(primerInmueble)) {
                    const coords = primerInmueble.ubicacionGeografica || primerInmueble;
                    setMapCenter({ lat: Number(coords.lat), lng: Number(coords.lon) });
                    const markersValidos = inmuebles
                        .filter(isValidCoordinate)
                        .map((inmueble) => ({ ...inmueble, lat: Number(inmueble.lat), lon: Number(inmueble.lon) }));
                    setMarkers(markersValidos);
                } else {
                    try {
                        const geocoded = await geocodeAddress(primerInmueble.direccion);
                        if (geocoded) {
                            setMapCenter({ lat: geocoded.lat, lng: geocoded.lon });
                            const markersGeocodificados = await Promise.all(
                                inmuebles.map(async (inmueble) => {
                                    if (!isValidCoordinate(inmueble)) {
                                        const coords = await geocodeAddress(inmueble.direccion);
                                        return coords ? { ...inmueble, lat: coords.lat, lon: coords.lon, direccion: coords.formattedAddress || inmueble.direccion } : inmueble;
                                    }
                                    return inmueble;
                                })
                            );
                            setMarkers(markersGeocodificados.filter(m => isValidCoordinate(m)));
                            setSelectedProperty(primerInmueble);
                        } else {
                            alert('No se pudo obtener la ubicación del inmueble');
                        }
                    } catch (error) {
                        console.error('Error al geocodificar:', error);
                        alert('Error al obtener las coordenadas de la dirección');
                    }
                }
            } else {
                alert('No se encontraron resultados');
                setMarkers([]);
            }
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            alert('Ocurrió un error al buscar. Intente de nuevo.');
        }
    };

    const handleVerExpediente = () => {
        alert('Mostrando expediente del inmueble');
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

    return (
        <div className="container mx-auto p-4">
            {/* Barra de Búsqueda con Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                {/* Contenedor que agrupa el input y el dropdown */}
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

                {/* Resto de elementos, como el botón y el select */}
                <button
                    onClick={() => handleSearch()}
                    className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none"
                >
                    <FaSearch className="w-5 h-5 text-gray-600" />
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


            {/* Área principal: mapa y tarjeta de inmueble */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Contenedor del mapa: ocupa el 100% en móvil y 66% en pantallas grandes */}
                <div className={selectedProperty ? "w-full lg:w-2/3" : "w-full"}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        onLoad={() => console.log('Mapa cargado')}
                        center={mapCenter}
                        zoom={15}
                        options={{
                            zoomControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: false,
                            clickableIcons: false,
                            
                            
                          }}
                    >
                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                position={{ lat: Number(marker.lat), lng: Number(marker.lon) }}
                                onClick={() => handleMarkerClick(marker)}
                                label={{
                                    text: marker.nombre ? `$${marker.nombre}` : '',
                                    color: 'black',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                                icon={
                                    selectedProperty && marker.id === selectedProperty.id
                                        ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                                        : nearbyMarkers.some(n => n.id === marker.id)
                                            ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                                            : undefined
                                }
                            />
                        ))}
                    </GoogleMap>
                </div>

                {/* Tarjeta del inmueble: se muestra sólo si hay una propiedad seleccionada */}
                {selectedProperty && (
                    <div className="w-full lg:w-1/3">
                        {searchType === 'direccion' && selectedProperty?.clienteId ? (
                            <InmuebleByCliente clienteId={selectedProperty.clienteId} />
                        ) : (
                            <div className="mt-4 p-4 bg-white shadow rounded-lg">
                                {selectedProperty.image && (
                                    <img
                                        src={selectedProperty.image}
                                        alt="Imagen del inmueble"
                                        className="w-full h-40 object-cover rounded-lg mb-4"
                                    />
                                )}
                                <div className="mb-2">
                                    <p className="font-bold">Dirección:</p>
                                    <p>{selectedProperty.direccion}</p>
                                </div>
                                {selectedProperty.precio && (
                                    <div className="mb-2">
                                        <p className="font-bold">Precio:</p>
                                        <p>{selectedProperty.precio}</p>
                                    </div>
                                )}
                                <button
                                    onClick={handleVerExpediente}
                                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
                                >
                                    <FaFileAlt />
                                    Revisar Expediente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
