import { buscarInmuebles } from './search.service';
import axios from 'axios';

export interface GeocodingResult {
  lat: number;
  lon: number;
  formattedAddress?: string;
}

const buildGoogleMapsURL = (endpoint: string, params: Record<string, string>) => {
  const base = 'https://maps.googleapis.com/maps/api';
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const queryString = new URLSearchParams({ key, ...params }).toString();
  return `${base}/${endpoint}?${queryString}`;
};

const loadGoogleMaps = (callback: () => void) => {
  const existingScript = document.getElementById('googleMaps');

  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.id = 'googleMaps';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (callback) callback();
    };
  } else if (callback) {
    callback();
  }
};

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    if (!address || address.trim() === '') {
      console.warn('Se intentó geocodificar una dirección vacía');
      return null;
    }

    // Usar API de geocodificación de Google
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      
      // Validar que las coordenadas sean números válidos
      const lat = Number(location.lat);
      const lon = Number(location.lng);
      
      if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
        console.error('Geocodificación devolvió coordenadas inválidas:', location);
        return null;
      }
      
      return {
        lat,
        lon,
        formattedAddress
      };
    } else {
      console.warn('No se encontraron resultados para la dirección:', address, response.data.status);
      return null;
    }
  } catch (error) {
    console.error('Error al geocodificar la dirección:', error);
    return null;
  }
};

export const getAutocompletePredictions = async (input: string) => {
  const url = buildGoogleMapsURL('place/autocomplete/json', {
    input: encodeURIComponent(input),
    types: 'geocode'
  });
  const response = await fetch(url);
  const data = await response.json();
  return data.predictions || [];
};

export { loadGoogleMaps };