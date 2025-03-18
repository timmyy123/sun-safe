"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { Info } from "lucide-react";

// Skin types based on Fitzpatrick scale
const skinTypes = [
  {
    id: "type1",
    name: "Type I",
    description: "Very fair skin, always burns, never tans",
    color: "#fde4d0",
    spfMultiplier: 1.5,
    image: "/skin-type-1.png"
  },
  {
    id: "type2",
    name: "Type II",
    description: "Fair skin, burns easily, tans minimally",
    color: "#f8d5c0",
    spfMultiplier: 1.3,
    image: "/skin-type-2.png"
  },
  {
    id: "type3",
    name: "Type III",
    description: "Medium skin, sometimes burns, gradually tans",
    color: "#e8b89b",
    spfMultiplier: 1.1,
    image: "/skin-type-3.png"
  },
  {
    id: "type4",
    name: "Type IV",
    description: "Olive skin, rarely burns, tans well",
    color: "#c78e69",
    spfMultiplier: 1.0,
    image: "/skin-type-4.png"
  },
  {
    id: "type5",
    name: "Type V",
    description: "Brown skin, very rarely burns, tans easily",
    color: "#a76b45",
    spfMultiplier: 0.9,
    image: "/skin-type-5.png"
  },
  {
    id: "type6",
    name: "Type VI",
    description: "Dark brown or black skin, never burns",
    color: "#614335",
    spfMultiplier: 0.8,
    image: "/skin-type-6.png"
  }
];

export default function SunscreenCalculatorPage() {
  const [selectedSkinType, setSelectedSkinType] = useState(skinTypes[2].id);
  const [uvIndex, setUvIndex] = useState(6);
  const [spoonsNeeded, setSpoonsNeeded] = useState(0);
  const [spf, setSpf] = useState(30);
  
  // Calculate sunscreen amount whenever inputs change
  useEffect(() => {
    // Find the selected skin type object
    const skinType = skinTypes.find(type => type.id === selectedSkinType);
    
    // Base calculation (teaspoons)
    // Standard is about 1 teaspoon for moderate UV (6-7) for average skin
    let baseAmount = 0;
    
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
    
    // Adjust for skin type if we have a valid skin type
    if (skinType) {
      baseAmount *= skinType.spfMultiplier;
    }
    
    // SPF adjustment (higher SPF products are often thicker)
    const spfFactor = spf <= 30 ? 1 : spf <= 50 ? 1.1 : 1.2;
    baseAmount *= spfFactor;
    
    // Round to 1 decimal place
    setSpoonsNeeded(Math.round(baseAmount * 10) / 10);
  }, [selectedSkinType, uvIndex, spf]);
  
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
  
  const uvSeverity = getUvSeverity(uvIndex);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-amber-300 text-center">Personalized Sunscreen Calculator</h1>
      <p className="text-center text-cyan-500 mb-8">Calculate how much sunscreen you need based on your skin type and UV conditions</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Tell us about yourself and the conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
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
              
              {/* UV Index Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Current UV Index</Label>
                  <span className={`font-medium ${uvSeverity.color}`}>
                    {uvIndex} ({uvSeverity.label})
                  </span>
                </div>
                
                <Slider 
                  min={1} 
                  max={12} 
                  step={1} 
                  value={[uvIndex]} 
                  onValueChange={(values) => setUvIndex(values[0])}
                  className="py-4"
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
              </div>
              
              {/* SPF Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Sunscreen SPF</Label>
                <RadioGroup 
                  value={spf.toString()} 
                  onValueChange={(value) => setSpf(parseInt(value, 10))}
                  className="flex flex-wrap gap-4"
                >
                  {[15, 30, 50, 70, 100].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value.toString()} id={`spf-${value}`} />
                      <Label htmlFor={`spf-${value}`} className="cursor-pointer">SPF {value}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
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
            <CardContent className="flex-grow flex flex-col justify-center space-y-6">
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-amber-100 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <span className="block text-5xl font-bold text-amber-600">{spoonsNeeded}</span>
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
                <h4 className="font-medium">Remember:</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  <li>Apply sunscreen 20 minutes before sun exposure</li>
                  <li>Reapply every 2 hours or after swimming/sweating</li>
                  <li>Don't forget commonly missed areas like ears and back of neck</li>
                  <li>For full body coverage, multiply by 6-7 times this amount</li>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}