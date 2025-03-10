import React from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

type UVMapProps = {
  mapboxToken: string;
  viewState: any;
  setViewState: (viewState: any) => void;
  selectedPlace: any;
  heatmapData: any;
  handleMapClick: (event: any) => void;
  mapRef: React.RefObject<any>;
};

const UVMap = ({
  mapboxToken,
  viewState,
  setViewState,
  selectedPlace,
  heatmapData,
  handleMapClick,
  mapRef,
}: UVMapProps) => {
  // Heatmap layer style
  const heatmapLayer = {
    id: "uv-heat",
    type: "heatmap",
    paint: {
      "heatmap-weight": ["get", "uv"],
      "heatmap-intensity": 0.8,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0, 0, 255, 0)",
        0.1,
        "royalblue",
        0.3,
        "cyan",
        0.5,
        "lime",
        0.7,
        "yellow",
        0.9,
        "orange",
        1,
        "red",
      ],
      "heatmap-radius": 30,
      "heatmap-opacity": 0.8,
    },
  };

  return (
    <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg border border-slate-200 h-full min-h-[600px] bg-[#e5e7eb]">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={handleMapClick}
        attributionControl={false}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
      >
        {/* UV Heatmap Layer */}
        {heatmapData.features.length > 0 && (
          <Source type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* Marker for selected location */}
        {selectedPlace && (
          <Marker
            longitude={selectedPlace.lng}
            latitude={selectedPlace.lat}
            anchor="bottom"
          >
            <div className="text-red-600">
              <MapPin className="h-8 w-8" />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

export default UVMap;