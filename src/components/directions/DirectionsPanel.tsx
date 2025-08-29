import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Preschool } from '@/stores/mapStore';
import { Navigation, Car, Train, Bike, MapPin, Clock, Route } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TravelMode {
  mode: 'driving' | 'transit' | 'bicycling' | 'walking';
  icon: React.ReactNode;
  label: string;
  color: string;
}

const travelModes: TravelMode[] = [
  { mode: 'driving', icon: <Car className="w-4 h-4" />, label: 'Bil', color: 'hsl(210, 70%, 50%)' },
  { mode: 'transit', icon: <Train className="w-4 h-4" />, label: 'Kollektivt', color: 'hsl(140, 60%, 45%)' },
  { mode: 'bicycling', icon: <Bike className="w-4 h-4" />, label: 'Cykel', color: 'hsl(25, 70%, 55%)' },
  { mode: 'walking', icon: <MapPin className="w-4 h-4" />, label: 'Gång', color: 'hsl(300, 70%, 55%)' }
];

interface DirectionsResult {
  mode: string;
  duration: string;
  distance: string;
  status: string;
}

interface DirectionsPanelProps {
  preschool: Preschool;
  userLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  preschool,
  userLocation,
  onClose
}) => {
  const [directions, setDirections] = useState<DirectionsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('driving');

  useEffect(() => {
    if (userLocation && preschool.latitud && preschool.longitud) {
      fetchDirections();
    }
  }, [userLocation, preschool]);

  const fetchDirections = async () => {
    if (!userLocation || !preschool.latitud || !preschool.longitud) return;

    setLoading(true);
    try {
      const results: DirectionsResult[] = [];
      
      // Get directions for all travel modes
      for (const mode of travelModes) {
        try {
          const { data, error } = await supabase.functions.invoke('google-directions', {
            body: {
              origin: `${userLocation.lat},${userLocation.lng}`,
              destination: `${preschool.latitud},${preschool.longitud}`,
              mode: mode.mode,
              language: 'sv'
            }
          });

          if (data?.success && data.data.routes.length > 0) {
            const route = data.data.routes[0].legs[0];
            results.push({
              mode: mode.mode,
              duration: route.duration.text,
              distance: route.distance.text,
              status: 'OK'
            });
          } else {
            results.push({
              mode: mode.mode,
              duration: 'N/A',
              distance: 'N/A',
              status: 'UNAVAILABLE'
            });
          }
        } catch (error) {
          console.error(`Error fetching ${mode.mode} directions:`, error);
          results.push({
            mode: mode.mode,
            duration: 'N/A',
            distance: 'N/A',
            status: 'ERROR'
          });
        }
      }
      
      setDirections(results);
    } catch (error) {
      console.error('Error fetching directions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (mode: string) => {
    const travelMode = mode === 'driving' ? 'driving' : 
                      mode === 'transit' ? 'transit' :
                      mode === 'bicycling' ? 'bicycling' : 'walking';
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${preschool.latitud},${preschool.longitud}&travelmode=${travelMode}`;
    window.open(url, '_blank');
  };

  if (!userLocation) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <Navigation className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aktivera platsåtkomst för att se restider
          </p>
          <Button
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  // This would update parent component with user location
                },
                (error) => {
                  console.error('Error getting location:', error);
                }
              );
            }}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Hämta min position
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Route className="w-4 h-4" />
          Restider till {preschool.namn}
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {travelModes.map((mode) => (
            <div key={mode.mode} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div style={{ color: mode.color }}>{mode.icon}</div>
                <span className="font-medium">{mode.label}</span>
              </div>
              <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {directions.map((result, index) => {
            const mode = travelModes[index];
            const isAvailable = result.status === 'OK';
            
            return (
              <div
                key={mode.mode}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isAvailable ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-50'
                }`}
                onClick={() => isAvailable && openGoogleMaps(mode.mode)}
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: mode.color }}>{mode.icon}</div>
                  <span className="font-medium">{mode.label}</span>
                </div>
                <div className="text-right">
                  {isAvailable ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold">{result.duration}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.distance}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ej tillgänglig</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Klicka på ett alternativ för att öppna vägbeskrivning i Google Maps
        </p>
      </div>
    </Card>
  );
};