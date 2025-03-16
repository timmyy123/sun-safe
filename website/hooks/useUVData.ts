import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const OPENUV_API_KEY = process.env.NEXT_PUBLIC_OPENUV_API_KEY || "";

// Get UV risk level text
export const getUVRiskLevel = (uvIndex: number) => {
  if (uvIndex < 3) return { level: "Low", color: "green" };
  if (uvIndex < 6) return { level: "Moderate", color: "yellow" };
  if (uvIndex < 8) return { level: "High", color: "orange" };
  if (uvIndex < 11) return { level: "Very High", color: "red" };
  return { level: "Extreme", color: "purple" };
};

// Format safe exposure time
export const formatSafeExposureTime = (minutes?: number) => {
  if (!minutes) return "Unknown";
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes} min`;
};

// API function to fetch UV data
const fetchUVData = async (lat: number, lng: number) => {
  try {
    const response = await axios.get("https://api.openuv.io/api/v1/uv", {
      params: { lat, lng },
      headers: { "x-access-token": OPENUV_API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching UV data:", error);
    throw error;
  }
};

export const useUVData = (selectedPlace: any) => {
  return useQuery({
    queryKey: ["uvData", selectedPlace?.lat, selectedPlace?.lng],
    queryFn: () => fetchUVData(selectedPlace.lat, selectedPlace.lng),
    enabled: !!selectedPlace,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};