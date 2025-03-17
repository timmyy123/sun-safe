"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // from npm install sonner

export default function Page() {
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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
      setUvIndex(parseFloat(data.result.uv.toFixed(2))); // Round to 2 decimal places
    } catch (error) {
      console.error("Failed to fetch UV index:", error);
      toast("Error", {
        description: "Failed to fetch UV index. Please try again later.",
        style: {
          backgroundColor: "#FF0000", // Red background
          color: "#ffffff",
          border: 'none'
        },
      });
    }
  };

  // Get user's location and fetch UV index
  const getLocationAndUvIndex = () => {
    return new Promise<void>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchUvIndex(latitude, longitude);
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

        // Optional: Fetch UV index even if a timer exists, to compare with the previous UV index
        // and adjust the timer if necessary.
        getLocationAndUvIndex()
          .then(() => {
            if (uvIndex !== null && uvIndex > lastUvIndex * 1.2) {
              // If UV index is 20% higher than before, reduce the timer by 10%
              const newSecondsLeft = remainingSeconds * 0.9;
              setSecondsLeft(newSecondsLeft);
              localStorage.setItem(
                "sunscreenTimer",
                JSON.stringify({
                  ...savedTimer,
                  endTime: currentTime + newSecondsLeft * 1000,
                })
              );
            }
          })
          .catch((error) => {
            console.error("Failed to fetch UV index:", error);
          });
      } else {
        // Clear localStorage if the timer has already ended
        localStorage.removeItem("sunscreenTimer");
      }
    } else {
      // If no timer exists, fetch UV index
      getLocationAndUvIndex().catch((error) => {
        console.error("Failed to fetch UV index:", error);
      });
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
                backgroundColor: "#FFA500", // Orange background
                color: "#ffffff",
                border: 'none'
              },
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
  useEffect(() => {
    if (uvIndex !== null && !localStorage.getItem("sunscreenTimer")) {
      if (uvIndex < 3) {
        toast("Low UV Index", {
          description: "No need to apply sunscreen now.",
          style: {
            backgroundColor: "#00FF00", // Green background
            color: "#ffffff",
            border: 'none'
          },
        });
      } else {
        // Set timer duration based on UV index
        const totalSeconds = Math.max(1800, 7200 - uvIndex * 600); // Example formula
        const startTime = Date.now();
        const endTime = startTime + totalSeconds * 1000;

        // Save timer state to localStorage
        const timerId = generateTimerId();
        localStorage.setItem(
          "sunscreenTimer",
          JSON.stringify({
            timerId,
            lastUvIndex: uvIndex,
            startTime,
            endTime,
          })
        );

        setSecondsLeft(totalSeconds);
        setRunning(true);
      }
    }
  }, [uvIndex]);

  // Clear timer and localStorage
  const handleClearTimer = () => {
    setRunning(false);
    setSecondsLeft(0);
    setUvIndex(null); // Reset UV index to null
    localStorage.removeItem("sunscreenTimer");
    toast("Timer Cleared", {
      description: "The timer has been reset.",
      style: {
        backgroundColor: "#1677FF", // Blue background
        color: "#ffffff",
        border: 'none'
      },
    });
  };

  // Format time as integer
  const formatTime = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="mx-auto mt-10 max-w-md">
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
              <div className="text-lg font-bold">Current UV Index: {uvIndex?.toFixed(2)}</div>
              {running && <div className="text-2xl font-bold">{formatTime()}</div>}
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className="space-x-2">
        {running && (
          <Button
            variant="destructive"
            onClick={handleClearTimer}
            style={{ cursor: 'pointer' }}
          >
            Clear Timer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}