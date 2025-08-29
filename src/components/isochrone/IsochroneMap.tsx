import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Bike, Car, Train, Clock, Target, Eye, EyeOff } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import mapboxgl from 'mapbox-gl';

interface IsochroneMapProps {
  map?: mapboxgl.Map | null;
  userLocation?: { lat: number; lng: number };
  onLocationRequest?: () => void;
}

export const IsochroneMap: React.FC<IsochroneMapProps> = ({
  map,
  userLocation,
  onLocationRequest
}) => {
  const [selectedTransport, setSelectedTransport] = useState<'walking' | 'bicycling' | 'driving' | 'transit'>('bicycling');
  const [maxTime, setMaxTime] = useState<number>(15);
  const [showIsochrone, setShowIsochrone] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { filteredPreschools } = useMapStore();

  const transportModes = [
    { mode: 'walking' as const, icon: <MapPin className="w-4 h-4" />, label: 'Gång', color: 'hsl(300, 70%, 55%)', maxMinutes: 30 },
    { mode: 'bicycling' as const, icon: <Bike className="w-4 h-4" />, label: 'Cykel', color: 'hsl(25, 70%, 55%)', maxMinutes: 30 },
    { mode: 'driving' as const, icon: <Car className="w-4 h-4" />, label: 'Bil', color: 'hsl(210, 70%, 50%)', maxMinutes: 60 },
    { mode: 'transit' as const, icon: <Train className="w-4 h-4" />, label: 'Kollektivt', color: 'hsl(140, 60%, 45%)', maxMinutes: 60 }
  ];

  const selectedMode = transportModes.find(m => m.mode === selectedTransport)!;

  useEffect(() => {
    if (map && showIsochrone && userLocation) {
      generateIsochrone();
    } else if (map && !showIsochrone) {
      removeIsochrone();
    }
  }, [map, showIsochrone, userLocation, selectedTransport, maxTime]);

  const generateIsochrone = async () => {
    if (!map || !userLocation) return;

    setLoading(true);
    try {
      // Generate isochrone polygon using Mapbox Isochrone API
      const profile = selectedTransport === 'driving' ? 'driving' : 
                    selectedTransport === 'bicycling' ? 'cycling' : 'walking';
      
      const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${userLocation.lng},${userLocation.lat}?contours_minutes=${maxTime}&polygons=true&access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Remove existing isochrone
        removeIsochrone();

        // Add isochrone source
        map.addSource('isochrone', {
          type: 'geojson',
          data: data
        });

        // Add isochrone fill layer
        map.addLayer({
          id: 'isochrone-fill',
          type: 'fill',
          source: 'isochrone',
          paint: {
            'fill-color': selectedMode.color,
            'fill-opacity': 0.2
          }
        });

        // Add isochrone border layer
        map.addLayer({
          id: 'isochrone-border',
          type: 'line',
          source: 'isochrone',
          paint: {
            'line-color': selectedMode.color,
            'line-width': 3,
            'line-opacity': 0.8
          }
        });

        // Count preschools within isochrone
        const preschoolsInArea = countPreschoolsInIsochrone(data.features[0].geometry);
        console.log(`${preschoolsInArea} förskolor inom ${maxTime} min ${selectedMode.label.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error generating isochrone:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeIsochrone = () => {
    if (!map) return;

    const layersToRemove = ['isochrone-fill', 'isochrone-border'];
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    
    if (map.getSource('isochrone')) {
      map.removeSource('isochrone');
    }
  };

  const countPreschoolsInIsochrone = (isochroneGeometry: any) => {
    // Simple point-in-polygon check for preschools
    // This is a simplified implementation - in production you'd use a proper geospatial library
    let count = 0;
    filteredPreschools.forEach(preschool => {
      if (preschool.latitud && preschool.longitud) {
        // Simplified bounding box check (not accurate point-in-polygon)
        const bounds = getBounds(isochroneGeometry);
        if (preschool.latitud >= bounds.south && preschool.latitud <= bounds.north &&
            preschool.longitud >= bounds.west && preschool.longitud <= bounds.east) {
          count++;
        }
      }
    });
    return count;
  };

  const getBounds = (geometry: any) => {
    const coordinates = geometry.coordinates[0];
    let north = -90, south = 90, east = -180, west = 180;
    
    coordinates.forEach(([lng, lat]: [number, number]) => {
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    });
    
    return { north, south, east, west };
  };

  const toggleIsochrone = () => {
    if (!userLocation) {
      onLocationRequest?.();
      return;
    }
    setShowIsochrone(!showIsochrone);
  };

  if (!userLocation) {
    return (
      <Card className="p-4">
        <div className="text-center space-y-3">
          <Target className="w-8 h-8 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold mb-1">Restidszoner</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Visa alla förskolor inom en viss restid på kartan
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
          <Target className="w-4 h-4" />
          Restidszoner
        </h3>
        <Button
          variant={showIsochrone ? "default" : "outline"}
          size="sm"
          onClick={toggleIsochrone}
          disabled={loading}
        >
          {showIsochrone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
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
              disabled={showIsochrone && loading}
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
          disabled={showIsochrone && loading}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5 min</span>
          <span>{selectedMode.maxMinutes} min</span>
        </div>
      </div>

      {/* Status */}
      {loading && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Genererar restidszon...</span>
          </div>
        </div>
      )}

      {showIsochrone && !loading && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div style={{ color: selectedMode.color }}>
              {React.cloneElement(selectedMode.icon, { className: "w-4 h-4" })}
            </div>
            <span>
              Visar område inom {maxTime} min {selectedMode.label.toLowerCase()}
            </span>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Restidszoner visar ungefärliga områden baserat på genomsnittliga restider och kan variera beroende på trafikförhållanden.
      </div>
    </Card>
  );
};