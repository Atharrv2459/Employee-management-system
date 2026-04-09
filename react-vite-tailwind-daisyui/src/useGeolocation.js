import { useState, useCallback } from "react";

/**
 * Custom hook for capturing GPS location
 */
export function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return Promise.reject("Geolocation not supported");
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp,
          };
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (err) => {
          let errorMessage;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An unknown error occurred while getting location.";
          }
          setError(errorMessage);
          setLoading(false);
          reject(errorMessage);
        },
        defaultOptions
      );
    });
  }, []);

  const isSupported = !!navigator.geolocation;

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    error,
    loading,
    getLocation,
    clearLocation,
    isSupported,
  };
}

export default useGeolocation;
