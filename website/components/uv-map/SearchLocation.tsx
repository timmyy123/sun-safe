"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

type SearchLocationProps = {
  handleSearch: (query: string) => void;
  searchError: string;
};

const SearchLocation = ({ handleSearch, searchError }: SearchLocationProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch location suggestions from Mapbox
  const fetchSuggestions = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          input
        )}.json`,
        {
          params: {
            access_token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
            limit: 5,
            types: "place,locality,neighborhood,address",
            autocomplete: true,
            country: "au", // Limit to Australia
          },
        }
      );

      if (response.data.features) {
        setSuggestions(response.data.features);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce function for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside of suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
    setShowSuggestions(false);
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: any) => {
    setQuery(suggestion.place_name);
    handleSearch(suggestion.place_name);
    setShowSuggestions(false);
  };

  return (
    <div className="mb-6 relative">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a location..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-4 py-2 w-full bg-white border-slate-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        </div>
        <Button type="submit" className="bg-sky-500 hover:bg-sky-600">Search</Button>
      </form>

      {searchError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {/* Location suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex items-start border-b border-slate-100 last:border-0"
              onClick={() => selectSuggestion(suggestion)}
            >
              <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-slate-500" />
              <div>
                <div className="font-medium">{suggestion.text}</div>
                <div className="text-xs text-slate-500">
                  {suggestion.place_name.replace(`${suggestion.text}, `, '')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && showSuggestions && (
        <div className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-lg border border-slate-200 p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">Searching locations...</p>
        </div>
      )}
    </div>
  );
};

export default SearchLocation;