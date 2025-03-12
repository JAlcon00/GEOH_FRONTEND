import { buscarInmuebles } from './search.service';

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

export const geocodeAddress = async (address: string) => {
  try {
    const url = buildGoogleMapsURL('geocode/json', { 
      address, // Removido encodeURIComponent
      region: 'mx', // Priorizar resultados en México
      components: 'country:MX' // Restringir búsqueda a México
    });
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const location = data.results[0].geometry.location;
      console.log('Coordenadas obtenidas para la dirección:', location);
      return {
        lat: location.lat,
        lon: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    }
    
    console.warn('No se pudieron obtener coordenadas para la dirección:', address);
    return null;
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