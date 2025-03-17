"use client";

import React, { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Components
import UVMap from "@/components/uv-map/UVMap";
import SearchLocation from "@/components/uv-map/SearchLocation";
import UVDataCard from "@/components/uv-map/UVDataCard";

// Hooks
import { useUVData } from "@/hooks/useUVData";
import { useGeolocation } from "@/hooks/useGeolocation";

// Environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Main UV Map component
function UVMapContent() {
  // Melbourne as fallback location
  const MELBOURNE = {
    longitude: 144.9631,
    latitude: -37.8136,
    name: "Melbourne, Victoria, Australia",
  };

  const mapRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [viewState, setViewState] = useState({
    longitude: MELBOURNE.longitude,
    latitude: MELBOURNE.latitude,
    zoom: 10,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [heatmapData, setHeatmapData] = useState({
    type: "FeatureCollection",
    features: [],
  });

  // Get user location
  const { location, isLocating } = useGeolocation(MAPBOX_TOKEN, MELBOURNE);

  // Update location from geolocation
  useEffect(() => {
    if (location) {
      // Set selected place with the user location
      setSelectedPlace(location);
      
      // Update the viewstate to center on the user's location
      setViewState({
        longitude: location.lng,
        latitude: location.lat,
        zoom: 10,
      });
      
      // Add the user's location to the heatmap
      // addToHeatmap(location.lat, location.lng);
    }
  }, [location]);

  // Query for UV data when location is selected
  const { data: uvData, isLoading: isLoadingUV, error: uvError } = useUVData(selectedPlace);

  // Add a point to the heatmap
  // const addToHeatmap = (lat, lng, uvValue = 5) => {
  //   const newFeature = {
  //     type: "Feature",
  //     properties: {
  //       uv: uvValue,
  //     },
  //     geometry: {
  //       type: "Point",
  //       coordinates: [lng, lat],
  //     },
  //   };

  //   setHeatmapData((prev) => ({
  //     ...prev,
  //     features: [...prev.features, newFeature],
  //   }));
  // };

  // Update heatmap when UV data is received
  useEffect(() => {
    if (uvData && selectedPlace) {
      // Update the last added point with actual UV data
      setHeatmapData((prev) => {
        const features = [...prev.features];
        if (features.length > 0) {
          const lastIndex = features.length - 1;
          features[lastIndex].properties.uv = uvData.result.uv;
        }
        return { ...prev, features };
      });
    }
  }, [uvData, selectedPlace]);

  // Handle map click to select a location
  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;

    setSelectedPlace({
      lng,
      lat,
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });

    // addToHeatmap(lat, lng);
  };

  // Handle geocoding search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchError("Please enter a location to search");
      return;
    }

    setSearchError("");

    try {
      // Using Mapbox Geocoding API
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1,
          },
        }
      );

      const results = response.data.features;

      if (results && results.length > 0) {
        const result = results[0];
        const [lng, lat] = result.center;

        // Update selected place
        setSelectedPlace({
          lng,
          lat,
          name: result.place_name,
        });

        // Update map view
        setViewState({
          longitude: lng,
          latitude: lat,
          zoom: 10,
        });

        // Add to heatmap
        // addToHeatmap(lat, lng);
      } else {
        setSearchError("No results found");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Error searching. Please try again.");
    }
  };

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4 text-yellow-300/80">UV Index Map</h1>

      {isLocating && (
        <div className="flex items-center gap-2 text-blue-600 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Finding your location...</span>
        </div>
      )}

      <p className="text-lg mb-6 text-sky-700 font-light">
        Check real-time UV index levels and forecasts for any location. Search
        for a place or click directly on the map.
      </p>

      {/* Search box */}
      <SearchLocation 
        handleSearch={handleSearch} 
        searchError={searchError}
      />

      {/* Map and data display in a grid with equal heights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Map component */}
        <UVMap
          mapboxToken={MAPBOX_TOKEN}
          viewState={viewState}
          setViewState={setViewState}
          selectedPlace={selectedPlace}
          heatmapData={heatmapData}
          handleMapClick={handleMapClick}
          mapRef={mapRef}
        />

        {/* UV data card */}
        <div className="h-full"> {/* Keep h-full here */}
          <UVDataCard
            selectedPlace={selectedPlace}
            uvData={uvData}
            isLoadingUV={isLoadingUV}
            uvError={uvError}
          />
        </div>
      </div>
    </main>
  );
}

// Wrap with QueryClientProvider
export default function UVMapPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UVMapContent />
    </QueryClientProvider>
  );
}