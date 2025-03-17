"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const SunscreenCalculator = () => {
  const [uvIndex, setUvIndex] = useState(null); // UV index from API
  const [skinTone, setSkinTone] = useState("3"); // Default to medium skin tone
  const [spf, setSpf] = useState("30"); // Default SPF
  const thickness = 0.75; // Default thickness in mg/cm²
  const [sunscreenAmount, setSunscreenAmount] = useState({ total: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const OPENUV_API_KEY = process.env.NEXT_PUBLIC_OPENUV_API_KEY || "";

  // Skin tone options based on Fitzpatrick Scale
  const skinToneOptions = [
    { value: "1", label: "Type I: Very Fair (Always burns, never tans)" },
    { value: "2", label: "Type II: Fair (Burns easily, tans minimally)" },
    { value: "3", label: "Type III: Medium (Sometimes burns, tans uniformly)" },
    { value: "4", label: "Type IV: Olive (Rarely burns, tans well)" },
    { value: "5", label: "Type V: Brown (Very rarely burns, tans very easily)" },
    { value: "6", label: "Type VI: Dark (Never burns, tans very easily)" },
  ];

  // SPF options
  const spfOptions = [
    { value: "15", label: "SPF 15" },
    { value: "30", label: "SPF 30" },
    { value: "45", label: "SPF 45" },
    { value: "50", label: "SPF 50+" },
  ];

  // Skin sensitivity coefficients
  const skinSensitivity = {
    "1": 6,
    "2": 5,
    "3": 4,
    "4": 3,
    "5": 2,
    "6": 1,
  };

  // Sunscreen amount per body part (in teaspoons)
  const sunscreenPerBodyPart = {
    faceNeckEars: 0.5, // 1/2 teaspoon
    eachArm: 0.5, // 1/2 teaspoon per arm
    eachLeg: 1, // 1 teaspoon per leg
    torso: 2, // 2 teaspoons for combined torso
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Failed to get your location. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  // Fetch UV index from Open UV API
  useEffect(() => {
    if (location.lat && location.lon) {
      const fetchUvIndex = async () => {
        try {
          const response = await axios.get("https://api.openuv.io/api/v1/uv", {
            headers: {
              "x-access-token": OPENUV_API_KEY,
            },
            params: {
              lat: location.lat,
              lng: location.lon,
            },
          });
          setUvIndex(response.data.result.uv);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching UV index:", error);
          setError("Failed to fetch UV index. Please try again later.");
          setLoading(false);
        }
      };

      fetchUvIndex();
    }
  }, [location]);

  // Calculate sunscreen amount based on UV index, skin tone, SPF, and thickness
  useEffect(() => {
    if (uvIndex !== null) {
      const S = skinSensitivity[skinTone];
      const P = parseInt(spf);
      const D = thickness;

      // Calculate risk factor
      const R = (uvIndex * S) / (P * D);

      // Adjust sunscreen amount based on risk factor
      let totalAmount = 0;
      const breakdown = {};

      for (const [part, amount] of Object.entries(sunscreenPerBodyPart)) {
        const adjustedAmount = amount * R;
        breakdown[part] = adjustedAmount.toFixed(2);
        totalAmount += adjustedAmount;
      }

      setSunscreenAmount({
        total: totalAmount.toFixed(2),
        breakdown,
      });
    }
  }, [uvIndex, skinTone, spf]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-blue-900 mb-8">
          Sunscreen Calculator
        </h1>
        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <h2 className="text-2xl font-semibold text-blue-800">
              Personalized Sun Safety Plan
            </h2>
            <p className="text-gray-600">
              Calculate the amount of sunscreen you need based on the UV index, skin tone, and SPF.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-xl font-medium text-gray-700 mb-2">
                Current UV Index:{" "}
                {loading ? (
                  <span className="text-gray-500">Loading...</span>
                ) : error ? (
                  <span className="text-red-600">Error</span>
                ) : (
                  <span className="font-bold text-blue-600">{uvIndex}</span>
                )}
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skin Tone (Fitzpatrick Scale)
              </label>
              <Select value={skinTone} onValueChange={setSkinTone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your skin tone" />
                </SelectTrigger>
                <SelectContent>
                  {skinToneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SPF Value:
              </label>
              <Select value={spf} onValueChange={setSpf}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select SPF" />
                </SelectTrigger>
                <SelectContent>
                  {spfOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sunscreen Recommendations
              </label>
              {loading ? (
                <p className="text-gray-700">Loading UV index...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : uvIndex < 3 ? (
                <p className="text-gray-700">
                  UV index is low ({uvIndex}). Most people do not need sunscreen, but if you have Type I or II skin, consider using SPF 30+ for prolonged outdoor activities.
                </p>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-800">
                    {sunscreenAmount.total} teaspoons (1 tsp ≈ 5ml)
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Apply this amount of sunscreen to exposed areas of your body:
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>Face, Neck, and Ears (exposed): {sunscreenAmount.breakdown.faceNeckEars} tsp</li>
                        <li>Each Arm (exposed): {sunscreenAmount.breakdown.eachArm} tsp</li>
                      </ul>
                    </div>
                    <div>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>Each Leg (exposed): {sunscreenAmount.breakdown.eachLeg} tsp</li>
                        <li>Torso (exposed): {sunscreenAmount.breakdown.torso} tsp</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SunscreenCalculator;