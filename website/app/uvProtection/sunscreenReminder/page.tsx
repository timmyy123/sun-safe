"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Page() {
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [manualUvIndex, setManualUvIndex] = useState<string>(""); // For manual UV input
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false); // For mouse hover effect
  const [useManualUv, setUseManualUv] = useState(true); // Default to manual UV input
  const OPENUV_API_KEY = process.env.NEXT_PUBLIC_OPENUV_API_KEY || "";

  // Helps avoid double toasts in React Strict Mode (dev environment)
  const isInitialRender = useRef(true);

  // Generate a random ID for the timer
  const generateTimerId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Fetch UV index based on user's location
  const fetchUvIndex = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lng}`,
        {
          headers: {
            "x-access-token": OPENUV_API_KEY,
          },
        }
      );
      const data = await response.json();
      const uv = parseFloat(data.result.uv.toFixed(2)); // Round to 2 decimal places
      setUvIndex(uv);
      return uv; // Return the UV index for further processing
    } catch (error) {
      console.error("Failed to fetch UV index:", error);
      toast("API Error", {
        description: "Failed to fetch UV index. Please enter the UV index manually.",
        style: {
          backgroundColor: "#FF6B6B", // Soft red background
          color: "#ffffff",
          border: 'none',
          fontSize: '16px', // Larger font size
        },
        duration: 5000, // 5 seconds
      });
      return null; // Return null if fetching fails
    }
  };

  // Get user's location and fetch UV index
  const getLocationAndUvIndex = async () => {
    return new Promise<void>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const uv = await fetchUvIndex(latitude, longitude);
            if (uv !== null) {
              startTimer(uv); // Start timer if UV index is fetched successfully
            }
            resolve();
          },
          (error) => {
            setLocationError("Failed to get location. Please enable location access.");
            console.error("Geolocation error:", error);
            reject(error);
          }
        );
      } else {
        setLocationError("Geolocation is not supported by your browser.");
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Load saved timer state from localStorage on component mount
  useEffect(() => {
    const savedTimer = JSON.parse(localStorage.getItem("sunscreenTimer") || "null");

    if (savedTimer) {
      const { startTime, endTime, lastUvIndex } = savedTimer;
      const currentTime = Date.now();

      if (currentTime < endTime) {
        const remainingSeconds = Math.floor((endTime - currentTime) / 1000); // Round to integer
        setSecondsLeft(remainingSeconds);
        setRunning(true);
        setUvIndex(lastUvIndex); // Set the last UV index
      } else {
        // Clear localStorage if the timer has already ended
        localStorage.removeItem("sunscreenTimer");
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let timerId: NodeJS.Timeout | null = null;
    if (running && secondsLeft > 0) {
      timerId = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setRunning(false);
            toast("Time’s up!", {
              description: "Reapply your sunscreen now.",
              style: {
                backgroundColor: "#FFD166", // Soft orange background
                color: "#ffffff",
                border: 'none',
                fontSize: '16px', // Larger font size
              },
              duration: 5000, // 5 seconds
            });
            // Clear localStorage when timer ends
            localStorage.removeItem("sunscreenTimer");
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [running, secondsLeft]);

  // Start timer based on UV index
  const startTimer = (uv: number) => {
    // Clear existing timer if any
    setRunning(false);
    setSecondsLeft(0);
    localStorage.removeItem("sunscreenTimer");

    if (uv < 3) {
      toast("Low UV Index", {
        description: "UV index is too low. No need to apply sunscreen now.",
        style: {
          backgroundColor: "#06D6A0", // Soft green background
          color: "#ffffff",
          border: 'none',
          fontSize: '16px', // Larger font size
        },
        duration: 5000, // 5 seconds
      });
    } else {
      // Set timer duration based on UV index
      const totalSeconds = Math.max(1800, 7200 - uv * 600); // Example formula
      const startTime = Date.now();
      const endTime = startTime + totalSeconds * 1000;

      // Save timer state to localStorage
      const timerId = generateTimerId();
      localStorage.setItem(
        "sunscreenTimer",
        JSON.stringify({
          timerId,
          lastUvIndex: uv,
          startTime,
          endTime,
        })
      );

      setSecondsLeft(totalSeconds);
      setRunning(true);
      setUvIndex(uv); // Set the UV index

      toast("Timer Started", {
        description: `Timer set for ${Math.floor(totalSeconds / 60)} minutes.`,
        style: {
          backgroundColor: "#118AB2", // Soft blue background
          color: "#ffffff",
          border: 'none',
          fontSize: '16px', // Larger font size
        },
        duration: 5000, // 5 seconds
      });
    }
  };

  // Handle manual UV input and start timer
  const handleManualStart = () => {
    const uv = parseFloat(manualUvIndex);
    if (isNaN(uv) || uv < 0 || uv > 15) {
      toast("Invalid Input", {
        description: "Please enter a valid UV index (0 to 15).",
        style: {
          backgroundColor: "#FF6B6B", // Soft red background
          color: "#ffffff",
          border: 'none',
          fontSize: '16px', // Larger font size
        },
        duration: 5000, // 5 seconds
      });
    } else {
      startTimer(uv);
    }
  };

  // Validate manual UV input
  const handleManualUvIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setManualUvIndex(value);
    }
  };

  // Clear timer and localStorage
  const handleClearTimer = () => {
    if (!running) {
      toast("No Timer Running", {
        description: "There is no active timer to stop.",
        style: {
          backgroundColor: "#FF6B6B", // Soft red background
          color: "#ffffff",
          border: 'none',
          fontSize: '16px', // Larger font size
        },
        duration: 5000, // 5 seconds
      });
      return;
    }

    setRunning(false);
    setSecondsLeft(0);
    setUvIndex(null); // Reset UV index to null
    localStorage.removeItem("sunscreenTimer");
    toast("Timer Cleared", {
      description: "The timer has been reset.",
      style: {
        backgroundColor: "#118AB2", // Soft blue background
        color: "#ffffff",
        border: 'none',
        fontSize: '16px', // Larger font size
      },
      duration: 5000, // 5 seconds
    });
  };

  // Format time as integer
  const formatTime = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setUseManualUv(checked);
    if (checked) {
      // When switching to manual mode, load saved timer state
      const savedTimer = JSON.parse(localStorage.getItem("sunscreenTimer") || "null");
      if (savedTimer) {
        const { lastUvIndex, endTime } = savedTimer;
        const currentTime = Date.now();
        if (currentTime < endTime) {
          const remainingSeconds = Math.floor((endTime - currentTime) / 1000);
          setSecondsLeft(remainingSeconds);
          setRunning(true);
          setUvIndex(lastUvIndex);
        }
      }
    } else {
      // When switching to auto mode, reset UV index
      // setUvIndex(null);
    }
  };

  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <CardHeader>
        <CardTitle>Sunscreen Timer</CardTitle>
        <CardDescription>Automatically reminds you to reapply sunscreen based on UV index.</CardDescription>
      </CardHeader>
      {/* Hide CardContent if uvIndex is null and there is no location error */}
      {(uvIndex !== null || locationError) && (
        <CardContent className="space-y-2">
          {locationError ? (
            <div className="text-red-500">{locationError}</div>
          ) : (
            <div>
              <div className="text-lg font-bold">
                {useManualUv ? "UV Index" : "UV Index"}: {uvIndex?.toFixed(2)}
              </div>
              {running && <div className="text-2xl font-bold">{formatTime()}</div>}
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className="flex flex-col space-y-6">
        {/* First row: Switch and labels */}
        <div className="flex items-center justify-center space-x-2 w-full">
          <span className="text-sm">Get UV from Location</span>
          <Switch
            checked={useManualUv}
            onCheckedChange={handleSwitchChange}
            className="cursor-pointer"
          />
          <span className="text-sm">Enter UV Manually</span>
        </div>

        {/* Second row: Input and Start Timer */}
        {useManualUv ? (
          <div className="flex flex-col space-y-2 w-full">
            <div className="text-sm text-gray-600">
              Enter a UV index (0 to 15). Timer will only start if UV is 3 or higher.
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={0}
                max={15}
                step={0.1}
                placeholder="Enter UV Index (0-15)"
                value={manualUvIndex}
                onChange={handleManualUvIndexChange}
                className="flex-1" // Take up remaining space
              />
              <Button
                onClick={handleManualStart}
                className="bg-[#118AB2] hover:bg-[#0E7A9A] text-white cursor-pointer"
              >
                Start Timer
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={getLocationAndUvIndex}
            className="w-full bg-[#118AB2] hover:bg-[#0E7A9A] text-white cursor-pointer"
          >
            Get UV from Location and Start Timer
          </Button>
        )}

        {/* Third row: Stop Timer */}
        <Button
          onClick={handleClearTimer}
          className="w-full bg-[#FFD166] hover:bg-[#E6B850] text-white cursor-pointer"
        >
          Stop Timer
        </Button>
      </CardFooter>
    </Card>
  );
}