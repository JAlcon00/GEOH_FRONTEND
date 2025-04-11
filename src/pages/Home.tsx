import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import useGoogleMaps from '..//hook/useGoogleMaps';
import { FaFileAlt, FaSearch } from 'react-icons/fa';
import { buscarInmuebles } from '../services/search.service';
import { getInmueblesByCliente } from '../services/inmueble.service';
import { getClienteByRFC } from '../services/cliente.service';
import { geocodeAddress } from '../services/geocode.service';
import InmuebleByCliente from '../components/inmueble/inmuebleByCliente'; // Importa el componente

// Agregar esta interfaz al inicio del archivo, después de las importaciones
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

const containerStyle = {
    width: '80%',
    height: '500px',
    margin: '0 auto',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',

};

const center = { lat: 21.1445, lng: -101.6867 };

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radio de la Tierra en metros
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

    if (loadError) return <div>Error al cargar Google Maps</div>;
    if (!isLoaded) return <div>Cargando mapa...</div>;

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;  // Removemos el trim() para permitir espacios
        setSearchTerm(value);

        // Solo aplicamos trim() para la validación de longitud y RFC
        if (searchType === 'rfc') {
            const trimmedValue = value.trim();
            if (trimmedValue.length >= 3) {
                try {
                    const params = { [searchType]: trimmedValue };
                    console.log('Parámetros enviados a buscarInmuebles:', params);
                    const results = await buscarInmuebles(params);
                    console.log('Respuesta obtenida:', results);
                    setSuggestions(results);
                } catch (error) {
                    console.error('Error obteniendo sugerencias:', error);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        } else {
            // Para nombre y dirección permitimos espacios y buscamos después de 3 caracteres sin contar espacios
            if (value.replace(/\s/g, '').length >= 3) {
                try {
                    const params = { [searchType]: value };
                    console.log('Parámetros enviados a buscarInmuebles:', params);
                    const results = await buscarInmuebles(params);
                    console.log('Respuesta obtenida:', results);
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

    const isValidCoordinate = (coord: any): boolean => {
        if (coord?.ubicacionGeografica?.lat && coord?.ubicacionGeografica?.lon) {
            return !isNaN(Number(coord.ubicacionGeografica.lat)) &&
                !isNaN(Number(coord.ubicacionGeografica.lon));
        }
        return !isNaN(Number(coord?.lat)) && !isNaN(Number(coord?.lon));
    };

    const handleSearch = async (inputValue?: string) => {
        const term = inputValue ? inputValue : searchTerm;
        if (!term) return;

        try {
            let inmuebles = [];
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

                // Primero intentamos con las coordenadas existentes
                if (isValidCoordinate(primerInmueble)) {
                    const coords = primerInmueble.ubicacionGeografica || primerInmueble;
                    setMapCenter({
                        lat: Number(coords.lat),
                        lng: Number(coords.lon)
                    });

                    const markersValidos = inmuebles
                        .filter(isValidCoordinate)
                        .map((inmueble: Inmueble) => ({
                            ...inmueble,
                            lat: Number(inmueble.lat),
                            lon: Number(inmueble.lon)
                        }));
                    setMarkers(markersValidos);
                } else {
                    // Si no hay coordenadas válidas, intentamos geocodificar
                    try {
                        console.log('Geocodificando dirección:', primerInmueble.direccion);
                        const geocoded = await geocodeAddress(primerInmueble.direccion);

                        if (geocoded) {
                            // Actualizamos el centro del mapa con las coordenadas geocodificadas
                            setMapCenter({
                                lat: geocoded.lat,
                                lng: geocoded.lon
                            });

                            // Actualizamos los marcadores con las nuevas coordenadas
                            const markersGeocodificados = await Promise.all(
                                inmuebles.map(async (inmueble: Inmueble) => {
                                    if (!isValidCoordinate(inmueble)) {
                                        const coords = await geocodeAddress(inmueble.direccion);
                                        return coords ? {
                                            ...inmueble,
                                            lat: coords.lat,
                                            lon: coords.lon,
                                            direccion: coords.formattedAddress || inmueble.direccion
                                        } : inmueble;
                                    }
                                    return inmueble;
                                })
                            );

                            setMarkers(markersGeocodificados.filter(m => isValidCoordinate(m)));
                            setSelectedProperty(primerInmueble);
                        } else {
                            console.error('No se pudo geocodificar la dirección:', primerInmueble.direccion);
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
        // Aquí puedes reemplazar con la lógica para mostrar un modal o redirigir a otra vista
        alert('Mostrando expediente del inmueble');
    };

    // Nueva función para manejar el clic en un marcador:
    const handleMarkerClick = (marker: Inmueble) => {
        setSelectedProperty(marker);
        const radius = 1000; // radio en metros
        // Filtramos los marcadores que se encuentren en un radio menor a 1000 m del seleccionado
        const nearby = markers.filter(m =>
            m.id !== marker.id &&
            haversineDistance(
                Number(m.lat),
                Number(m.lon),
                Number(marker.lat),
                Number(marker.lon)
            ) < radius
        );
        setNearbyMarkers(nearby);
    };

    return (
        <div className="container mx-auto p-4">
            {/* Barra de Búsqueda con Selector */}
            <div className="flex justify-center mb-4 items-center gap-2 relative">

                <input
                    type="text"
                    placeholder={`Buscar por ${searchType}...`}
                    className="w-80 px-4 py-2 border-none rounded-lg focus:ring-1 focus:ring-red-500 text-sm"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={() => handleSearch()}
                    className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none"
                >
                    <FaSearch className="w-5 h-5 text-gray-600" />
                </button>
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'nombre' | 'direccion' | 'rfc')}
                    className="px-4 py-2 border-none rounded-lg focus:ring-1 focus:ring-red-500 text-sm"
                >
                    <option value="direccion">Dirección</option>
                    <option value="nombre">Nombre</option>

                    <option value="rfc">RFC</option>
                </select>
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 shadow-lg rounded w-80 z-50">
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

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Mapa: ocupa el 100% en móvil y 66% en pantallas grandes */}
                <div className={selectedProperty ? "w-full lg:w-2/3" : "w-full"}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCenter}
                        zoom={15}
                    >
                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                position={{
                                    lat: Number(marker.lat),
                                    lng: Number(marker.lon)
                                }}
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

                {/* Card de Propiedad: se muestra solo si se seleccionó un inmueble */}
                {selectedProperty && (
                    <div className="w-full lg:w-1/3">
                        {searchType === 'direccion' && selectedProperty?.clienteId ? (
                            <InmuebleByCliente clienteId={selectedProperty.clienteId} />
                        ) : (
                            <div className="mt-4 p-4 bg-white shadow rounded-lg">
                                <img
                                    src={selectedProperty.image}
                                    alt="Imagen del inmueble"
                                    className="w-full h-40 object-cover rounded-lg mb-4"
                                />
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