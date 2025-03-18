"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface GoogleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query?: string;
}

const GoogleSearchModal = ({ isOpen, onClose, query = "" }: GoogleSearchModalProps) => {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen && searchContainerRef.current) {
      searchContainerRef.current.innerHTML = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);

    // Set a timeout to show the error if still loading
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        setError("Search is taking longer than expected. Try refreshing.");
      }
    }, 5000);

    // Safely clear timeout when search completes
    const finishLoading = () => {
      setIsLoading(false);
      clearTimeout(loadTimeout);
    };

    // Load or reuse script
    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (document.getElementById("google-cse-script")) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.id = "google-cse-script";
        script.src = `https://cse.google.com/cse.js?cx=${process.env.NEXT_PUBLIC_GOOGLE_CSE_ID}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load search script"));
        document.head.appendChild(script);
      });

    // Initialize Google search
    const initializeSearch = () => {
      if (!searchContainerRef.current) return;
      searchContainerRef.current.innerHTML = '';

      const searchEl = document.createElement("div");
      searchEl.className = "gcse-search";
      searchContainerRef.current.appendChild(searchEl);

      try {
        if (window.google?.search?.cse) {
          window.google.search.cse.element.render({
            div: searchEl,
            tag: "search",
            gname: "sunsafesearch",
          });

          // Apply initial query if provided
          setTimeout(() => {
            if (query && searchContainerRef.current) {
              const inputEl = searchContainerRef.current.querySelector("input.gsc-input") as HTMLInputElement;
              if (inputEl) {
                inputEl.value = query;
                const searchButton = searchContainerRef.current.querySelector(".gsc-search-button button") as HTMLButtonElement;
                if (searchButton) {
                  searchButton.click();
                }
              }
            }
            finishLoading();
          }, 300);
        } else {
          setError("Search could not be initialized");
          finishLoading();
        }
      } catch {
        setError("There was a problem initializing the search");
        finishLoading();
      }
    };

    loadScript()
      .then(() => {
        // Poll until google.search.cse is ready
        let attempts = 0;
        const checkGoogleCSE = setInterval(() => {
          if (window.google?.search?.cse) {
            clearInterval(checkGoogleCSE);
            initializeSearch();
          } else if (attempts >= 10) {
            clearInterval(checkGoogleCSE);
            setError("Search engine failed to initialize");
            finishLoading();
          }
          attempts++;
        }, 200);
      })
      .catch(() => {
        setError("Failed to load search. Please try again later.");
        finishLoading();
      });

    return () => clearTimeout(loadTimeout);
  }, [isOpen, query]);

  // Custom styling
  useEffect(() => {
    if (!isOpen) return;
    const style = document.createElement("style");
    style.id = "google-cse-modal-styles";
    style.innerHTML = `
      .gsc-control-cse {
        padding: 0 !important; border: none !important; background: transparent !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
      .gsc-input-box { border-radius: 0.375rem !important; border: 1px solid #e2e8f0 !important; }
      .gsc-search-button-v2 {
        border-radius: 0.375rem !important; padding: 8px 16px !important;
        background-color: #f59e0b !important; border: none !important;
      }
      .gsc-search-button-v2:hover { background-color: #f97316 !important; }
      .gs-title, .gs-title * {
        color: #2563eb !important; text-decoration: none !important;
      }
      .gs-title:hover { text-decoration: underline !important; }
      .gs-snippet { font-family: system-ui, -apple-system, sans-serif !important; }
      .gsc-cursor-page {
        padding: 5px 10px !important; border-radius: 4px !important;
      }
      .gsc-cursor-current-page {
        background-color: #f59e0b !important; color: white !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById("google-cse-modal-styles");
      if (existingStyle?.parentNode) existingStyle.parentNode.removeChild(existingStyle);
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search UV Protection Resources</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-slate-600">Loading search...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-4 text-center">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Refresh
            </button>
          </div>
        )}

        <div
          ref={searchContainerRef}
          className={`min-h-[400px] ${error ? "opacity-50" : ""}`}
        />
      </DialogContent>
    </Dialog>
  );
};

export default GoogleSearchModal;