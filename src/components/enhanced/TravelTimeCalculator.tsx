import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { Car, Bus, Bike, Clock, MapPin, Route } from 'lucide-react';
import { motion } from 'framer-motion';

interface TravelTimeResult {
  preschoolId: string;
  driving?: { duration: string; distance: string };
  transit?: { duration: string; distance: string };
  bicycling?: { duration: string; distance: string };
  walking?: { duration: string; distance: string };
}

interface TravelTimeCalculatorProps {
  userLocation: { lat: number; lng: number };
  maxDistance?: number; // in km
}

export const TravelTimeCalculator: React.FC<TravelTimeCalculatorProps> = ({ 
  userLocation, 
  maxDistance = 20 
}) => {
  const { filteredPreschools } = useMapStore();
  const [travelTimes, setTravelTimes] = useState<Map<string, TravelTimeResult>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sortedByTravelTime, setSortedByTravelTime] = useState<Preschool[]>([]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTravelTimes = async () => {
    if (!userLocation) return;

    setIsCalculating(true);
    setProgress(0);

    // Filter preschools within maxDistance
    const nearbyPreschools = filteredPreschools.filter(p => {
      if (!p.latitud || !p.longitud) return false;
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        p.latitud, p.longitud
      );
      return distance <= maxDistance;
    });

    const results = new Map<string, TravelTimeResult>();
    const batchSize = 5; // Process in smaller batches to avoid rate limiting

    for (let i = 0; i < nearbyPreschools.length; i += batchSize) {
      const batch = nearbyPreschools.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (preschool) => {
          try {
            const { data, error } = await supabase.functions.invoke('google-directions', {
              body: {
                origin: `${userLocation.lat},${userLocation.lng}`,
                destination: `${preschool.latitud},${preschool.longitud}`,
                mode: 'driving',
                language: 'sv'
              }
            });

            if (data?.success && data.data?.routes?.[0]) {
              const route = data.data.routes[0].legs[0];
              results.set(preschool.id, {
                preschoolId: preschool.id,
                driving: {
                  duration: route.duration.text,
                  distance: route.distance.text
                }
              });
            }
          } catch (error) {
            console.error(`Error calculating travel time for ${preschool.namn}:`, error);
          }
        })
      );

      setProgress(((i + batchSize) / nearbyPreschools.length) * 100);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < nearbyPreschools.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setTravelTimes(results);
    
    // Sort preschools by travel time
    const sorted = nearbyPreschools
      .filter(p => results.has(p.id))
      .sort((a, b) => {
        const aDuration = results.get(a.id)?.driving?.duration;
        const bDuration = results.get(b.id)?.driving?.duration;
        
        if (!aDuration || !bDuration) return 0;
        
        // Extract minutes from duration string (e.g., "15 min" -> 15)
        const aMinutes = parseInt(aDuration.match(/\d+/)?.[0] || '999');
        const bMinutes = parseInt(bDuration.match(/\d+/)?.[0] || '999');
        
        return aMinutes - bMinutes;
      });

    setSortedByTravelTime(sorted);
    setIsCalculating(false);
  };

  useEffect(() => {
    if (userLocation && filteredPreschools.length > 0) {
      calculateTravelTimes();
    }
  }, [userLocation, filteredPreschools]);

  const formatTravelTime = (duration: string) => {
    const match = duration.match(/(\d+)\s*min/);
    if (match) {
      const minutes = parseInt(match[1]);
      if (minutes < 60) {
        return `${minutes}min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
      }
    }
    return duration;
  };

  const getTravelTimeColor = (duration: string) => {
    const minutes = parseInt(duration.match(/\d+/)?.[0] || '999');
    if (minutes <= 10) return 'text-green-600';
    if (minutes <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Route className="w-4 h-4" />
          Restider från din position
        </h3>
        <Button
          onClick={calculateTravelTimes}
          variant="outline"
          size="sm"
          disabled={isCalculating}
          className="text-xs"
        >
          {isCalculating ? 'Beräknar...' : 'Uppdatera'}
        </Button>
      </div>

      {isCalculating && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm">Beräknar restider...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {sortedByTravelTime.length > 0 && !isCalculating && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedByTravelTime.slice(0, 10).map((preschool, index) => {
            const travelData = travelTimes.get(preschool.id);
            const drivingTime = travelData?.driving?.duration || '';
            
            return (
              <motion.div
                key={preschool.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{preschool.namn}</p>
                  <p className="text-xs text-muted-foreground truncate">{preschool.kommun}</p>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  {drivingTime && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTravelTimeColor(drivingTime)}`}
                    >
                      <Car className="w-3 h-3 mr-1" />
                      {formatTravelTime(drivingTime)}
                    </Badge>
                  )}
                  
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isCalculating && travelTimes.size === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Inga förskolor inom {maxDistance}km hittades</p>
        </div>
      )}
    </Card>
  );
};