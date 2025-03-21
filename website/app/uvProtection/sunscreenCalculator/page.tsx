"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, MapPin, AlertCircle } from "lucide-react";

// Skin types based on Fitzpatrick scale
const skinTypes = [
  {
    id: "type1",
    value: "1",
    name: "Type I",
    description: "Very fair skin, always burns, never tans",
    color: "#fde4d0",
    spfMultiplier: 1.5,
    sensitivity: 6
  },
  {
    id: "type2",
    value: "2",
    name: "Type II",
    description: "Fair skin, burns easily, tans minimally",
    color: "#f8d5c0",
    spfMultiplier: 1.3,
    sensitivity: 5
  },
  {
    id: "type3",
    value: "3",
    name: "Type III",
    description: "Medium skin, sometimes burns, gradually tans",
    color: "#e8b89b",
    spfMultiplier: 1.1,
    sensitivity: 4
  },
  {
    id: "type4",
    value: "4",
    name: "Type IV",
    description: "Olive skin, rarely burns, tans well",
    color: "#c78e69",
    spfMultiplier: 1.0,
    sensitivity: 3
  },
  {
    id: "type5",
    value: "5",
    name: "Type V",
    description: "Brown skin, very rarely burns, tans easily",
    color: "#a76b45",
    spfMultiplier: 0.9,
    sensitivity: 2
  },
  {
    id: "type6",
    value: "6",
    name: "Type VI",
    description: "Dark brown or black skin, never burns",
    color: "#614335",
    spfMultiplier: 0.8,
    sensitivity: 1
  }
];

// Sunscreen amount per body part (in teaspoons)
const baseSunscreenPerBodyPart = {
  faceNeckEars: 0.5, // 1/2 teaspoon
  eachArm: 0.5,      // 1/2 teaspoon per arm
  eachLeg: 1,        // 1 teaspoon per leg
  torso: 2,          // 2 teaspoons for combined torso
};

export default function EnhancedSunscreenCalculator() {
  // Mode state
  const [mode, setMode] = useState("manual"); // "manual" or "automatic"
  
  // User inputs
  const [selectedSkinType, setSelectedSkinType] = useState(skinTypes[2].id);
  const [manualUvIndex, setManualUvIndex] = useState(6);
  const [spf, setSpf] = useState(30);
  const thickness = 0.75; // Default thickness in mg/cm² - hidden from UI but kept for calculations
  
  // Location and API data
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [autoUvIndex, setAutoUvIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Results
  const [teaspoons, setTeaspoons] = useState(0);
  const [bodyPartBreakdown, setBodyPartBreakdown] = useState({});
  
  // Get currently selected skin type
  const currentSkinType = skinTypes.find(type => type.id === selectedSkinType) || skinTypes[0];
  
  // Get UV index severity
  const getUvSeverity = (index) => {
    if (index <= 2) return { label: "Low", color: "text-green-500" };
    if (index <= 5) return { label: "Moderate", color: "text-yellow-500" };
    if (index <= 7) return { label: "High", color: "text-orange-500" };
    if (index <= 10) return { label: "Very High", color: "text-red-500" };
    return { label: "Extreme", color: "text-purple-500" };
  };
  
  // Current UV index and severity
  const currentUvIndex = mode === "automatic" ? autoUvIndex : manualUvIndex;
  const uvSeverity = getUvSeverity(currentUvIndex || 0);
  
  // Get user's location and UV index
  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            setLocation({ lat, lon });
            
            try {
              const response = await axios.get("https://api.openuv.io/api/v1/uv", {
                headers: { "x-access-token": process.env.NEXT_PUBLIC_OPENUV_API_KEY },
                params: { lat, lng: lon }
              });
  
              const uvIndex = response.data.result.uv;
  
              setAutoUvIndex(parseFloat(uvIndex.toFixed(1)));
              setLoading(false);
            } catch (error) {
              console.error("Error fetching UV index:", error);
              setError("Failed to fetch UV index. Please try again or use manual mode.");
              setLoading(false);
            }
          },
          (locationError) => {
            console.error("Error getting location:", locationError);
            setError("Failed to get your location. Please enable location services or use manual mode.");
            setLoading(false);
          }
        );
      } else {
        setError("Geolocation is not supported by your browser. Please use manual mode.");
        setLoading(false);
      }
    } catch (e) {
      setError("An error occurred. Please try again or use manual mode.");
      setLoading(false);
    }
  };
  
  // Calculate sunscreen amount based on both models
  useEffect(() => {
    if (currentUvIndex === null && mode === "automatic") {
      return;
    }
    
    // Get the current skin type
    const skinType = skinTypes.find(type => type.id === selectedSkinType);
    
    // Method 1: Simple calculation from first version
    let baseAmount = 0;
    const uvIndex = currentUvIndex || 0;
    
    // UV index influences amount
    if (uvIndex <= 2) {
      baseAmount = 0.5; // Very low UV
    } else if (uvIndex <= 5) {
      baseAmount = 1; // Low to moderate UV
    } else if (uvIndex <= 7) {
      baseAmount = 1.5; // High UV
    } else if (uvIndex <= 10) {
      baseAmount = 2; // Very high UV
    } else {
      baseAmount = 2.5; // Extreme UV
    }
    
    // Adjust for skin type
    if (skinType) {
      baseAmount *= skinType.spfMultiplier;
    }
    
    // SPF adjustment (higher SPF products are often thicker)
    const spfFactor = spf <= 30 ? 1 : spf <= 50 ? 1.1 : 1.2;
    baseAmount *= spfFactor;
    
    // Method 2: Formula from second version
    const S = skinType.sensitivity;
    const P = spf;
    const D = thickness;
    const R = (uvIndex * S) / (P * D);
    
    // Calculate amounts for different body parts
    const breakdown = {};
    let totalBodyAmount = 0;
    
    for (const [part, amount] of Object.entries(baseSunscreenPerBodyPart)) {
      const adjustedAmount = amount * R;
      breakdown[part] = parseFloat(adjustedAmount.toFixed(1));
      totalBodyAmount += adjustedAmount;
    }
    
    // Use the more advanced calculation (Method 2)
    setTeaspoons(parseFloat(breakdown.faceNeckEars.toFixed(1))); // Set teaspoons to match face/neck amount
    setBodyPartBreakdown(breakdown);
    
  }, [selectedSkinType, manualUvIndex, autoUvIndex, mode, spf, thickness]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-amber-500 text-center">Personalized Sunscreen Calculator</h1>
      <p className="text-center text-cyan-600 mb-8">Calculate how much sunscreen you need based on your skin type and UV conditions</p>
      
      {/* Removed the top tabs section */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input section */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Tell us about yourself and the conditions</CardDescription>
              </div>
              
              {/* Mode tabs moved to right side of the card header */}
              <Tabs defaultValue="manual" value={mode} onValueChange={setMode} className="w-55">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="manual" className="text-xs cursor-pointer">
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="automatic" className="text-xs cursor-pointer">
                    Auto-Detect UV
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-15 pb-7">
              {/* Skin Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Your Skin Type</Label>
                  <div className="relative group">
                    <Info size={18} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 w-64 p-2 bg-white border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 text-xs">
                      The Fitzpatrick scale classifies skin types based on how they react to sun exposure. Knowing your type helps determine appropriate sun protection.
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {skinTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedSkinType(type.id)}
                      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all ${
                        selectedSkinType === type.id 
                          ? "border-amber-500 bg-amber-50" 
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div 
                        className="w-full h-16 rounded-md mb-2" 
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <p className="text-sm font-medium text-center">{type.name}</p>
                      
                      {selectedSkinType === type.id && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Description of selected skin type */}
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                  <strong>{currentSkinType.name}:</strong> {currentSkinType.description}
                </div>
              </div>
              
              {/* UV Index */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    {mode === "automatic" ? "Detected UV Index" : "Current UV Index"}
                  </Label>
                  
                  {mode === "automatic" ? (
                    autoUvIndex !== null ? (
                      <span className={`font-medium ${getUvSeverity(autoUvIndex).color}`}>
                        {autoUvIndex} ({getUvSeverity(autoUvIndex).label})
                      </span>
                    ) : (
                      <span className="text-slate-500">Not detected</span>
                    )
                  ) : (
                    <span className={`font-medium ${uvSeverity.color}`}>
                      {manualUvIndex} ({uvSeverity.label})
                    </span>
                  )}
                </div>
                
                {mode === "automatic" ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={fetchLocation} 
                      className="w-full flex items-center justify-center gap-2 cursor-pointer"
                      disabled={loading}
                    >
                      <MapPin size={16} />
                      {loading ? "Detecting..." : "Detect UV Index"}
                    </Button>
                    
                    {error && (
                      <div className="text-sm text-red-500 flex items-start gap-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    {autoUvIndex !== null && (
                      <div className={`text-sm p-2 rounded-md ${getUvSeverity(autoUvIndex).color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                        <span className={getUvSeverity(autoUvIndex).color}>
                          The current UV index in your location is <strong>{autoUvIndex}</strong> ({getUvSeverity(autoUvIndex).label})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Slider 
                      min={1} 
                      max={12} 
                      step={1} 
                      value={[manualUvIndex]} 
                      onValueChange={(values) => setManualUvIndex(values[0])}
                      className="py-4 cursor-pointer"
                    />
                    
                    <div className="relative h-3 w-full">
                      <div className="absolute inset-0 flex">
                        <div className="h-full w-1/5 bg-green-500 rounded-l-full"></div>
                        <div className="h-full w-1/5 bg-yellow-500"></div>
                        <div className="h-full w-1/5 bg-orange-500"></div>
                        <div className="h-full w-1/5 bg-red-500"></div>
                        <div className="h-full w-1/5 bg-purple-500 rounded-r-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1-2 Low</span>
                      <span>3-5 Moderate</span>
                      <span>6-7 High</span>
                      <span>8-10 Very High</span>
                      <span>11+ Extreme</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* SPF Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Sunscreen SPF</Label>
                <RadioGroup 
                  value={spf.toString()} 
                  onValueChange={(value) => setSpf(parseInt(value, 10))}
                  className="flex flex-wrap gap-5"
                >
                  {[15, 30, 50, 70, 100].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value.toString()} id={`spf-${value}`} className="cursor-pointer" />
                      <Label htmlFor={`spf-${value}`} className="cursor-pointer">SPF {value}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Advanced Options removed but thickness value is still used in calculations */}
            </CardContent>
          </Card>
        </div>
        
        {/* Results section */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Your Recommendation</CardTitle>
              <CardDescription>Personalized sunscreen usage guidance</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center space-y-4">
              {(mode === "automatic" && autoUvIndex === null) ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">
                    Please detect your UV index to see personalized recommendations
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48">
                      <div className="absolute inset-0 bg-amber-100 rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <span className="block text-5xl font-bold text-amber-600">{bodyPartBreakdown.faceNeckEars}</span>
                          <span className="text-amber-800">teaspoons</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-medium">For your face & neck</h3>
                    <p className="text-slate-600">Based on your skin type and current UV index</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Full Body Application</h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>Face, Neck & Ears:</span>
                        <span className="font-medium">{bodyPartBreakdown.faceNeckEars} tsp</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Each Arm:</span>
                        <span className="font-medium">{bodyPartBreakdown.eachArm} tsp</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Each Leg:</span>
                        <span className="font-medium">{bodyPartBreakdown.eachLeg} tsp</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Torso (Front & Back):</span>
                        <span className="font-medium">{bodyPartBreakdown.torso} tsp</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between font-medium">
                        <span>Total Body:</span>
                        <span>{Object.values(bodyPartBreakdown).reduce((a, b) => a + b, 0).toFixed(1)} tsp</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Remember:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      <li>Apply sunscreen 20 minutes before sun exposure</li>
                      <li>1 teaspoon ≈ 5ml of sunscreen</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <div className="flex items-start">
                      <div className="mr-3 text-amber-600">
                        <Info size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800">Your risk profile</h4>
                        <p className="text-sm text-amber-700">
                          With {currentSkinType.name} skin in {uvSeverity.label.toLowerCase()} UV conditions, 
                          you have {currentSkinType.id.includes("type1") || currentSkinType.id.includes("type2") ? "higher" : "moderate"} 
                          risk of sun damage. In addition to sunscreen, consider seeking shade and wearing protective clothing.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}