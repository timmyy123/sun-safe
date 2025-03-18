"use client";
 
 import React, { useState, useEffect, useRef } from "react";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { toast } from "sonner"; // from npm install sonner
 
 export default function Page() {
   const [minutes, setMinutes] = useState(120); // default 120 minutes
   const [secondsLeft, setSecondsLeft] = useState(0);
   const [running, setRunning] = useState(false);
 
   // Helps avoid double toasts in React Strict Mode (dev environment)
   const isInitialRender = useRef(true);
 
   useEffect(() => {
     // Skip the effect on the very first render
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
             return 0;
           }
           return prev - 1;
         });
       }, 1000);
     }
 
     return () => {
       if (timerId) {
         clearInterval(timerId);
       }
     };
   }, [running, secondsLeft]);
 
   const handleStart = () => {
     const totalSeconds = minutes * 60;
     setSecondsLeft(totalSeconds);
     setRunning(true);
   };
 
   const handleStop = () => {
     setRunning(false);
   };
 
   const formatTime = () => {
     const m = Math.floor(secondsLeft / 60);
     const s = secondsLeft % 60;
     return `${m}:${s.toString().padStart(2, "0")}`;
   };
 
   return (
     <Card className="mx-auto mt-10 max-w-md">
       <CardHeader>
         <CardTitle>Sunscreen Timer</CardTitle>
         <CardDescription>Set a reminder to reapply sunscreen.</CardDescription>
       </CardHeader>
       <CardContent className="space-y-2">
         <div className="flex items-center space-x-2">
           <label htmlFor="minutes" className="text-sm font-medium">
             Minutes:
           </label>
           <Input
             id="minutes"
             type="number"
             min={1}
             value={minutes}
             onChange={(e) => setMinutes(Number(e.target.value))}
             className="w-20"
           />
         </div>
         {running && <div className="text-2xl font-bold">{formatTime()}</div>}
       </CardContent>
       <CardFooter className="space-x-2">
         {!running ? (
           <Button onClick={handleStart} className="bg-amber-400">Start</Button>
         ) : (
           <Button variant="destructive" onClick={handleStop}>
             Stop
           </Button>
         )}
       </CardFooter>
     </Card>
   );
 }