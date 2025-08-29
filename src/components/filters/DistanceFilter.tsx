import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Bike, Car, Train, Clock } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface DistanceFilterProps {
  userLocation?: { lat: number; lng: number };
  onLocationRequest?: () => void;
}

export const DistanceFilter: React.FC<DistanceFilterProps> = ({
  userLocation,
  onLocationRequest
}) => {
  const [selectedTransport, setSelectedTransport] = useState<'walking' | 'bicycling' | 'driving' | 'transit'>('bicycling');
  const [maxTime, setMaxTime] = useState<number>(15);
  const { setSearchFilters, searchFilters } = useMapStore();

  const transportModes = [
    { mode: 'walking' as const, icon: <MapPin className="w-4 h-4" />, label: 'Gång', color: 'hsl(300, 70%, 55%)', maxMinutes: 30 },
    { mode: 'bicycling' as const, icon: <Bike className="w-4 h-4" />, label: 'Cykel', color: 'hsl(25, 70%, 55%)', maxMinutes: 30 },
    { mode: 'driving' as const, icon: <Car className="w-4 h-4" />, label: 'Bil', color: 'hsl(210, 70%, 50%)', maxMinutes: 60 },
    { mode: 'transit' as const, icon: <Train className="w-4 h-4" />, label: 'Kollektivt', color: 'hsl(140, 60%, 45%)', maxMinutes: 60 }
  ];

  const selectedMode = transportModes.find(m => m.mode === selectedTransport)!;

  const applyDistanceFilter = () => {
    if (!userLocation) {
      onLocationRequest?.();
      return;
    }

    // Update search filters with distance criteria
    setSearchFilters({
      ...searchFilters,
      travelTime: {
        userLocation,
        maxMinutes: maxTime,
        transportMode: selectedTransport
      }
    });
  };

  const clearDistanceFilter = () => {
    setSearchFilters({
      ...searchFilters,
      travelTime: undefined
    });
  };

  if (!userLocation) {
    return (
      <Card className="p-4">
        <div className="text-center space-y-3">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold mb-1">Restidsfilter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Hitta förskolor inom en viss restid från din position
            </p>
            <Button onClick={onLocationRequest} variant="outline" className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Aktivera platsåtkomst
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Restidsfilter
        </h3>
        {searchFilters.travelTime && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDistanceFilter}
            className="text-xs"
          >
            Rensa
          </Button>
        )}
      </div>

      {/* Transport Mode Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Färdsätt</label>
        <div className="grid grid-cols-2 gap-2">
          {transportModes.map((mode) => (
            <Button
              key={mode.mode}
              variant={selectedTransport === mode.mode ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTransport(mode.mode)}
              className="justify-start gap-2"
            >
              <div style={{ color: selectedTransport === mode.mode ? 'white' : mode.color }}>
                {mode.icon}
              </div>
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Max restid</label>
          <Badge variant="secondary">
            {maxTime} min
          </Badge>
        </div>
        <Slider
          value={[maxTime]}
          onValueChange={(value) => setMaxTime(value[0])}
          max={selectedMode.maxMinutes}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5 min</span>
          <span>{selectedMode.maxMinutes} min</span>
        </div>
      </div>

      {/* Apply Filter */}
            <Button
              onClick={applyDistanceFilter}
              className="w-full"
              disabled={!userLocation}
            >
              {React.cloneElement(selectedMode.icon, { className: "w-4 h-4 mr-2" })}
              Visa förskolor inom {maxTime} min {selectedMode.label.toLowerCase()}
            </Button>

      {/* Active Filter Display */}
      {searchFilters.travelTime && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div style={{ color: selectedMode.color }}>
              {React.cloneElement(selectedMode.icon, { className: "w-4 h-4" })}
            </div>
            <span>
              Visar förskolor inom {searchFilters.travelTime.maxMinutes} min {selectedMode.label.toLowerCase()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};