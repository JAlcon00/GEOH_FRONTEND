import { useLoadScript } from '@react-google-maps/api';
import { useMemo } from 'react';

const useGoogleMaps = () => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const libraries = useMemo<("places")[]>(() => ['places'], []);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey,
        libraries,
    });

    return { isLoaded, loadError };
};

export default useGoogleMaps;