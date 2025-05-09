import React, { useEffect, useState } from 'react';

// Clave de API para Google Maps (esta debe ser reemplazada con tu clave real)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

// Componente para cargar la API de Google Maps
const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si el script ya está cargado
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Función para cargar el script de Google Maps
    const loadGoogleMapsScript = () => {
      // Verificar si ya existe un script para evitar duplicados
      if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
        // El script ya está en el documento, esperamos a que termine de cargar
        const checkIfLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkIfLoaded);
            setIsLoaded(true);
          }
        }, 100);
        return;
      }

      // Crear el script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      // Manejar errores y eventos de carga
      script.onerror = () => {
        console.error('Error al cargar la API de Google Maps');
        setIsError(true);
      };
      
      script.onload = () => {
        console.log('API de Google Maps cargada correctamente');
        setIsLoaded(true);
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    // Limpieza (aunque normalmente no eliminamos scripts de Google Maps)
    return () => {
      // No eliminamos el script para evitar problemas con otros componentes
    };
  }, []);

  if (isError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error al cargar la API de Google Maps. La funcionalidad de autocompletado de direcciones no estará disponible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando Google Maps...</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default GoogleMapsLoader;