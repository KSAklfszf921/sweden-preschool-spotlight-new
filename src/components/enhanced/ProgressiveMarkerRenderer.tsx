import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { Preschool } from '@/stores/mapStore';

interface ProgressiveMarkerRendererProps {
  preschools: Preschool[];
  map: mapboxgl.Map | null;
  onAnimationComplete?: () => void;
}

// Group preschools by region for progressive loading
const groupPreschoolsByRegion = (preschools: Preschool[]) => {
  const regions: { [key: string]: Preschool[] } = {};
  
  preschools.forEach(preschool => {
    if (!preschool.latitud || !preschool.longitud) return;
    
    const lat = preschool.latitud;
    const lng = preschool.longitud;
    
    // Group by approximate geographical regions in Sweden
    let region = 'north';
    if (lat < 60) region = 'south';
    else if (lat < 64) region = 'central';
    
    if (!regions[region]) regions[region] = [];
    regions[region].push(preschool);
  });
  
  return regions;
};

export const ProgressiveMarkerRenderer: React.FC<ProgressiveMarkerRendererProps> = ({
  preschools,
  map,
  onAnimationComplete
}) => {
  const [currentWave, setCurrentWave] = useState(0);
  const [visibleMarkers, setVisibleMarkers] = useState<Set<string>>(new Set());
  const regions = React.useMemo(() => groupPreschoolsByRegion(preschools), [preschools]);
  const regionOrder = ['south', 'central', 'north'];

  const addMarkersForRegion = useCallback((regionIndex: number) => {
    if (!map || regionIndex >= regionOrder.length) {
      onAnimationComplete?.();
      return;
    }

    const regionName = regionOrder[regionIndex];
    const regionPreschools = regions[regionName] || [];
    
    // Add markers in batches with staggered animation
    regionPreschools.forEach((preschool, index) => {
      if (!preschool.latitud || !preschool.longitud) return;
      
      setTimeout(() => {
        const markerId = preschool.id;
        
        // Create animated marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'preschool-marker';
        markerEl.style.cssText = `
          width: 12px;
          height: 12px;
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--background));
          border-radius: 50%;
          cursor: pointer;
          transform: scale(0);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        // Add to map
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([preschool.longitud, preschool.latitud])
          .addTo(map);
        
        // Animate in
        requestAnimationFrame(() => {
          markerEl.style.transform = 'scale(1)';
        });
        
        setVisibleMarkers(prev => new Set(prev).add(markerId));
      }, index * 20); // Stagger by 20ms per marker
    });
    
    // Move to next region after current region is done
    setTimeout(() => {
      setCurrentWave(regionIndex + 1);
    }, regionPreschools.length * 20 + 300);
    
  }, [map, regions, regionOrder, onAnimationComplete]);

  useEffect(() => {
    if (!map || !preschools.length) return;
    
    // Start the progressive loading animation
    const timer = setTimeout(() => {
      addMarkersForRegion(0);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [map, preschools, addMarkersForRegion]);

  useEffect(() => {
    if (currentWave > 0 && currentWave < regionOrder.length) {
      addMarkersForRegion(currentWave);
    }
  }, [currentWave, addMarkersForRegion, regionOrder.length]);

  return null; // This component doesn't render anything directly
};