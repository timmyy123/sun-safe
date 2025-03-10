import { useState, useEffect } from "react";
import axios from "axios";

type Location = {
  lat: number;
  lng: number;
  name: string;
};

type FallbackLocation = {
  latitude: number;
  longitude: number;
  name: string;
};

export const useGeolocation = (
  mapboxToken: string,
  fallbackLocation: FallbackLocation
) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // Reverse geocode coordinates to get place name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: mapboxToken,
            types: "place",
          },
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].place_name;
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };

  // Set fallback location
  const useDefaultLocation = () => {
    setLocation({
      lat: fallbackLocation.latitude,
      lng: fallbackLocation.longitude,
      name: fallbackLocation.name,
    });
  };

  // Attempt to get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);

      // Set a timeout to handle slow geolocation responses
      const timeoutId = setTimeout(() => {
        setIsLocating(false);
        // Fall back to default location if geolocation takes too long
        if (!location) {
          useDefaultLocation();
        }
      }, 5000); // 5 second timeout

      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          clearTimeout(timeoutId);
          setIsLocating(false);

          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Reverse geocode to get place name
          reverseGeocode(userLat, userLng)
            .then((placeName) => {
              const userPlace = {
                lat: userLat,
                lng: userLng,
                name:
                  placeName ||
                  `Your Location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
              };
              setLocation(userPlace);
            })
            .catch((error) => {
              console.error("Error getting place name:", error);
              // Still set the location even if reverse geocoding fails
              const userPlace = {
                lat: userLat,
                lng: userLng,
                name: `Your Location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
              };
              setLocation(userPlace);
            });
        },
        // Error callback
        (error) => {
          clearTimeout(timeoutId);
          setIsLocating(false);
          console.warn(`Geolocation error: ${error.message}`);
          useDefaultLocation();
        },
        // Options
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      // Geolocation not supported
      setIsLocating(false);
      useDefaultLocation();
    }
  }, []);

  return { location, isLocating };
};