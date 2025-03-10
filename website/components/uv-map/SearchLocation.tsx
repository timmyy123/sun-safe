import React, { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type SearchLocationProps = {
  handleSearch: (query: string) => void;
  searchError: string;
};

const SearchLocation = ({ handleSearch, searchError }: SearchLocationProps) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSubmit = () => {
    handleSearch(searchInput);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 border-0 bg-slate-50 text-slate-700"
            placeholder="Search for a location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <Button
          onClick={handleSubmit}
          className="bg-sky-500 hover:bg-sky-600"
        >
          Search
        </Button>
      </div>

      {searchError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SearchLocation;