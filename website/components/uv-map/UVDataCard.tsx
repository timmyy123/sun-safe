import React from "react";
import { format } from "date-fns";
import { Sun, MapPin, Clock, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getUVRiskLevel, formatSafeExposureTime } from "@/hooks/useUVData";

type UVDataCardProps = {
  selectedPlace: any;
  uvData: any;
  isLoadingUV: boolean;
  uvError: any;
};

const UVDataCard = ({
  selectedPlace,
  uvData,
  isLoadingUV,
  uvError,
}: UVDataCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="mr-2 h-5 w-5 text-yellow-500" />
          UV Index Information
        </CardTitle>
        <CardDescription>
          {selectedPlace ? (
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {selectedPlace.name}
            </div>
          ) : (
            "Select a location to view UV data"
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!selectedPlace && (
          <div className="text-center py-10">
            <p>
              Click on the map or search for a location to see UV index
              data
            </p>
          </div>
        )}

        {selectedPlace && isLoadingUV && (
          <div className="text-center py-10">
            <p>Loading UV data...</p>
          </div>
        )}

        {selectedPlace && uvError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load UV data. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {selectedPlace && uvData && (
          <Tabs defaultValue="current">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current UV</TabsTrigger>
              <TabsTrigger value="forecast">Daily Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4 pt-4">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-6 text-center">
                <p className="text-5xl font-bold">
                  {uvData.result.uv.toFixed(1)}
                </p>
                <p className="text-lg mt-2">Current UV Index</p>
                <Badge
                  className={`mt-2 bg-${
                    getUVRiskLevel(uvData.result.uv).color
                  }-500`}
                >
                  {getUVRiskLevel(uvData.result.uv).level} Risk
                </Badge>
                <p className="mt-4 opacity-90">
                  {format(
                    new Date(uvData.result.uv_time),
                    "MMM d, h:mm a"
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm text-gray-500">Max UV Today</p>
                  <p className="text-xl font-semibold">
                    {uvData.result.uv_max.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">
                    at{" "}
                    {format(
                      new Date(uvData.result.uv_max_time),
                      "h:mm a"
                    )}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm text-gray-500">Safe Exposure</p>
                  <p className="text-xl font-semibold">
                    {formatSafeExposureTime(
                      uvData.result.safe_exposure_time.st2
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    for average skin
                  </p>
                </div>
              </div>

              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                <h3 className="font-medium mb-2">Protection Advice</h3>
                {uvData.result.uv > 2 ? (
                  <ul className="text-sm space-y-1">
                    <li>• Wear SPF 30+ sunscreen</li>
                    <li>• Reapply every 2 hours</li>
                    <li>• Seek shade during midday hours</li>
                    {uvData.result.uv > 5 && (
                      <li>• Wear protective clothing</li>
                    )}
                    {uvData.result.uv > 7 && (
                      <li>• Avoid outside exposure when possible</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm">
                    Low risk today. Basic sun protection recommended.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forecast" className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Morning</span>
                  </div>
                  <span className="font-semibold">
                    {(uvData.result.uv * 0.7).toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Noon</span>
                  </div>
                  <span className="font-semibold">
                    {uvData.result.uv_max.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Afternoon</span>
                  </div>
                  <span className="font-semibold">
                    {(uvData.result.uv * 0.9).toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Evening</span>
                  </div>
                  <span className="font-semibold">
                    {(uvData.result.uv * 0.5).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>
                  Forecast is an approximation based on current UV
                  patterns
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      {selectedPlace && uvData && (
        <CardFooter>
          <div className="w-full text-center text-sm text-gray-500">
            <p>
              Last updated: {format(new Date(), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default UVDataCard;