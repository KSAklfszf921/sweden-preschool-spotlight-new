import React, { useState } from 'react';
import { Navigation, MapPin, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';

export const NearbyPreschoolsButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [radius, setRadius] = useState([2]);
  const [isActive, setIsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { setSearchFilters, setMapCenter, setMapZoom } = useMapStore();

  const handleNearbySearch = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const center: [number, number] = [longitude, latitude];
        
        setMapCenter(center);
        setMapZoom(12);
        setSearchFilters({ 
          radius: radius[0] * 1000, // Convert to meters
          center: center 
        });
        setIsActive(true);
        setIsExpanded(false);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('Kunde inte hämta din position. Kontrollera att du tillåter platsåtkomst.');
      }
    );
  };

  const handleCancelLocation = () => {
    setSearchFilters({});
    setIsActive(false);
    setIsExpanded(false);
    setMapCenter([15.0, 62.0]);
    setMapZoom(5);
  };

  const toggleExpanded = () => {
    if (isActive) {
      handleCancelLocation();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={toggleExpanded}
        variant={isActive ? "destructive" : "outline"}
        size="sm"
        className="text-xs h-7"
        disabled={isLocating}
      >
        {isLocating ? (
          <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1" />
        ) : (
          <Navigation className="w-3 h-3 mr-1" />
        )}
        {isLocating ? "Hämtar position..." : isActive ? "Avbryt platshämtning" : "Förskolor nära mig"}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 z-50"
          >
            <Card className="p-3 bg-card/95 backdrop-blur-xl border-border/50 shadow-lg min-w-48">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">Sökradie</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {radius[0]} km
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setRadius([Math.max(0.5, radius[0] - 0.5)])}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setRadius([Math.min(10, radius[0] + 0.5)])}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <Slider
                    value={radius}
                    onValueChange={setRadius}
                    max={10}
                    min={0.5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <Button
                  onClick={handleNearbySearch}
                  variant="default"
                  size="sm"
                  className="w-full text-xs"
                >
                  Sök förskolor
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};