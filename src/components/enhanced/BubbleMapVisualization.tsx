import React, { useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Map as MapboxMap } from 'mapbox-gl';

interface BubbleMapVisualizationProps {
  map?: MapboxMap | null;
}

export const BubbleMapVisualization: React.FC<BubbleMapVisualizationProps> = ({ map }) => {
  const { filteredPreschools, mapZoom } = useMapStore();
  const clustersRef = useRef<Map<string, { lat: number; lng: number; count: number; preschools: any[] }>>(new Map());

  useEffect(() => {
    // Check if map exists and style is loaded
    if (!map || !map.isStyleLoaded() || !filteredPreschools.length) return;

    console.log('Adding bubble visualization to map');

    // Remove existing layers and sources safely
    try {
      if (map.getLayer('preschool-bubbles')) {
        map.removeLayer('preschool-bubbles');
      }
      if (map.getLayer('preschool-bubble-labels')) {
        map.removeLayer('preschool-bubble-labels');
      }
      if (map.getSource('preschool-bubbles')) {
        map.removeSource('preschool-bubbles');
      }
    } catch (error) {
      console.warn('Error removing existing layers:', error);
    }

    // Filter valid preschools with coordinates
    const validPreschools = filteredPreschools.filter(p => p.latitud && p.longitud);
    
    // Create clusters based on zoom level
    const clusterDistance = mapZoom > 12 ? 0.005 : mapZoom > 10 ? 0.01 : 0.02;
    clustersRef.current.clear();
    
    validPreschools.forEach(preschool => {
      const lat = preschool.latitud!;
      const lng = preschool.longitud!;
      const key = `${Math.round(lat / clusterDistance) * clusterDistance}-${Math.round(lng / clusterDistance) * clusterDistance}`;
      
      if (clustersRef.current.has(key)) {
        const cluster = clustersRef.current.get(key)!;
        cluster.count++;
        cluster.preschools.push(preschool);
      } else {
        clustersRef.current.set(key, {
          lat: Math.round(lat / clusterDistance) * clusterDistance,
          lng: Math.round(lng / clusterDistance) * clusterDistance,
          count: 1,
          preschools: [preschool]
        });
      }
    });

    const features = Array.from(clustersRef.current.values()).map(cluster => {
      const kommunalCount = cluster.preschools.filter(p => p.huvudman === 'Kommunal').length;
      const enskildCount = cluster.preschools.filter(p => p.huvudman === 'Enskild').length;
      const avgRating = cluster.preschools
        .filter(p => p.google_rating)
        .reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
        cluster.preschools.filter(p => p.google_rating).length || 0;
      
      // Determine bubble color based on composition
      let bubbleType = 'mixed';
      if (kommunalCount > enskildCount * 2) bubbleType = 'kommunal';
      else if (enskildCount > kommunalCount * 2) bubbleType = 'enskild';
      else if (avgRating >= 4.5) bubbleType = 'high-rating';

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [cluster.lng, cluster.lat]
        },
        properties: {
          cluster: true,
          cluster_id: `${cluster.lat}-${cluster.lng}`,
          point_count: cluster.count,
          point_count_abbreviated: cluster.count > 1000 ? `${Math.round(cluster.count / 1000)}k` : cluster.count.toString(),
          bubble_type: bubbleType,
          kommunal_count: kommunalCount,
          enskild_count: enskildCount,
          avg_rating: avgRating,
          total_children: cluster.preschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0)
        }
      };
    });

    // Add source safely
    try {
      map.addSource('preschool-bubbles', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });
    } catch (error) {
      console.error('Error adding source:', error);
      return;
    }

    // Add bubble layer with dynamic styling safely
    try {
      map.addLayer({
        id: 'preschool-bubbles',
        type: 'circle',
        source: 'preschool-bubbles',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            1, 12,
            5, 18,
            10, 24,
            20, 30,
            50, 40,
            100, 50
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'bubble_type'], 'kommunal'], 'hsl(210, 85%, 60%)', // Blue
            ['==', ['get', 'bubble_type'], 'enskild'], 'hsl(25, 85%, 60%)', // Orange
            ['==', ['get', 'bubble_type'], 'high-rating'], 'hsl(130, 70%, 60%)', // Green
            'hsl(220, 15%, 65%)' // Default mixed/mountain color
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'bubble_type'], 'kommunal'], 'hsl(210, 85%, 45%)',
            ['==', ['get', 'bubble_type'], 'enskild'], 'hsl(25, 85%, 45%)',
            ['==', ['get', 'bubble_type'], 'high-rating'], 'hsl(130, 70%, 45%)',
            'hsl(220, 15%, 50%)'
          ],
          'circle-stroke-opacity': 0.8,
          'circle-opacity': 0.7
        }
      });
    } catch (error) {
      console.error('Error adding bubble layer:', error);
      return;
    }

    // Add labels layer for higher zoom levels
    if (mapZoom > 10) {
      try {
        map.addLayer({
          id: 'preschool-bubble-labels',
          type: 'symbol',
          source: 'preschool-bubbles',
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['get', 'point_count'],
              1, 11,
              5, 13,
              10, 15,
              20, 17,
              50, 19,
              100, 22
            ],
            'text-anchor': 'center',
            'text-justify': 'center'
          },
          paint: {
            'text-color': 'white',
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 2
          }
        });
      } catch (error) {
        console.error('Error adding labels layer:', error);
      }
    }

    // Add click handler for bubbles
    const handleBubbleClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['preschool-bubbles'] });
      if (features.length > 0) {
        const feature = features[0];
        const cluster = Array.from(clustersRef.current.values()).find(c => 
          `${c.lat}-${c.lng}` === feature.properties?.cluster_id
        );
        
        if (cluster) {
          // Zoom to cluster bounds
          const lats = cluster.preschools.map(p => p.latitud).filter(Boolean);
          const lngs = cluster.preschools.map(p => p.longitud).filter(Boolean);
          
          if (lats.length > 0) {
            const bounds = [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)]
            ];
            
            map.fitBounds(bounds as any, { padding: 50, maxZoom: 15 });
          }
        }
      }
    };

    map.on('click', 'preschool-bubbles', handleBubbleClick);
    map.on('mouseenter', 'preschool-bubbles', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'preschool-bubbles', () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      map.off('click', 'preschool-bubbles', handleBubbleClick);
      try {
        map.off('mouseenter', 'preschool-bubbles');
        map.off('mouseleave', 'preschool-bubbles');
      } catch (error) {
        console.warn('Error removing mouse listeners:', error);
      }
    };
  }, [map, filteredPreschools, mapZoom]);

  return null;
};