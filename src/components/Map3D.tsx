import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPopup } from '@/components/enhanced/EnhancedPopup';
import { mapboxConfig } from '@/utils/mapboxConfig';
import { 
  calculateOptimalView, 
  determineViewScenario, 
  createSmoothEasing, 
  debounce 
} from '@/utils/mapViewHelpers';

// Mapbox token - will be set via proxy in production
// For development, we'll use a fallback but prefer proxy
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';
mapboxgl.accessToken = MAPBOX_TOKEN;
interface Map3DProps {
  className?: string;
}
export const Map3D: React.FC<Map3DProps> = ({
  className
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPreschool, setPopupPreschool] = useState<Preschool | null>(null);
  const [isMapAnimating, setIsMapAnimating] = useState(false);
  const previousFilters = useRef<any>(null);
  const {
    filteredPreschools,
    selectedPreschool,
    setSelectedPreschool,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    showClusters,
    heatmapType,
    heatmapIntensity,
    layerVisibility,
    preschools,
    updateVisiblePreschoolsFromViewport,
    searchFilters
  } = useMapStore();
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with compatible style for deployment
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11', // Use v11 for MapboxLanguage compatibility
      center: [15.5, 62.0],
      zoom: 5.5,
      pitch: 30,
      bearing: 0,
      antialias: true
      // Removed maxBounds to allow full world view
    });

    // Add 3D terrain
    map.current.on('style.load', () => {
      if (!map.current) return;

      // Check if terrain source already exists before adding
      if (!map.current.getSource('mapbox-dem')) {
        // Add terrain source
        map.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
      }

      // Add terrain layer
      map.current.setTerrain({
        'source': 'mapbox-dem',
        'exaggeration': 1.5
      });

      // Add Nordic-inspired sky and atmosphere
      map.current.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 12,
          'sky-atmosphere-color': 'hsl(210, 85%, 85%)',
          // Nordic blue atmosphere
          'sky-atmosphere-halo-color': 'hsl(207, 89%, 90%)' // Light Nordic halo
        }
      });

      // Use standard map colors - removed custom color overrides

      setIsLoading(false);
    });

    // Add Swedish language support with fallback to English
    try {
      const language = new MapboxLanguage({
        defaultLanguage: 'en' // Fallback to English since 'sv' isn't supported
      });
      map.current.addControl(language);
    } catch (error) {
      console.warn('Language control not available:', error);
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Add geolocate control
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    // Handle map movement
    map.current.on('moveend', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      setMapCenter([center.lng, center.lat]);
      setMapZoom(zoom);

      // Update visible preschools for list module
      const bounds = map.current.getBounds();
      updateVisiblePreschoolsFromViewport({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });
    return () => {
      map.current?.remove();
    };
  }, []);

  // Calculate display logic outside useEffect to prevent undefined variable errors
  const currentZoom = mapZoom;
  const shouldShowHeatmap = currentZoom <= 6;
  const shouldShowClusters = currentZoom > 6 && currentZoom <= 11;
  const shouldShowMarkers = currentZoom > 11;

  // Dynamic clustering system based on zoom level
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing preschool layers and sources
    const layersToRemove = ['preschools-clusters', 'preschools-cluster-count', 'preschools-unclustered', 'preschool-labels'];
    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });
    if (map.current?.getSource('preschools')) {
      map.current.removeSource('preschools');
    }

    // Filter out preschools without valid coordinates (handle null values properly)
    const validPreschools = filteredPreschools.filter(p => p.latitud !== null && p.longitud !== null && p.latitud !== 0 && p.longitud !== 0 && typeof p.latitud === 'number' && typeof p.longitud === 'number' && p.latitud >= 55.0 && p.latitud <= 69.1 && p.longitud >= 10.9 && p.longitud <= 24.2);
    console.log(`Rendering ${validPreschools.length}/${filteredPreschools.length} preschools on map`);
    if (validPreschools.length === 0) return;

    // Create GeoJSON data from valid preschools
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: validPreschools.map(preschool => ({
        type: 'Feature' as const,
        properties: {
          id: preschool.id,
          namn: preschool.namn,
          kommun: preschool.kommun,
          adress: preschool.adress,
          antal_barn: preschool.antal_barn || 0,
          huvudman: preschool.huvudman,
          personaltäthet: preschool.personaltäthet || 0,
          andel_med_förskollärarexamen: preschool.andel_med_förskollärarexamen || 0,
          antal_barngrupper: preschool.antal_barngrupper,
          google_rating: preschool.google_rating || 0
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [preschool.longitud, preschool.latitud]
        }
      }))
    };

    // Determine cluster settings based on zoom level
    const shouldCluster = currentZoom < 10;

    // Check if source exists, if so update it, otherwise add new source
    if (map.current.getSource('preschools')) {
      const source = map.current.getSource('preschools') as mapboxgl.GeoJSONSource;
      source.setData(geojsonData);
    } else {
      // Add source with dynamic clustering
      map.current.addSource('preschools', {
        type: 'geojson',
        data: geojsonData,
        cluster: shouldCluster,
        clusterMaxZoom: 10,
        // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points
      });
    }
    if (shouldCluster) {
      // Add cluster circles
      map.current.addLayer({
        id: 'preschools-clusters',
        type: 'circle',
        source: 'preschools',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], 'hsl(210, 60%, 55%)',
          // Small clusters - blue
          10, 'hsl(140, 40%, 45%)',
          // Medium clusters - green
          30, 'hsl(25, 70%, 55%)' // Large clusters - orange
          ],
          'circle-radius': ['step', ['get', 'point_count'], 25,
          // Small clusters
          10, 35,
          // Medium clusters
          30, 50 // Large clusters
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'preschools-cluster-count',
        type: 'symbol',
        source: 'preschools',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 16
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add click handler for clusters to zoom in
      map.current.on('click', 'preschools-clusters', e => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['preschools-clusters']
        });
        const clusterId = features[0].properties!.cluster_id;
        const source = map.current!.getSource('preschools') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      });
      map.current.on('mouseenter', 'preschools-clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'preschools-clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }

    // Add individual markers (shown when not clustering or unclustered points)
    map.current.addLayer({
      id: 'preschools-unclustered',
      type: 'circle',
      source: 'preschools',
      filter: shouldCluster ? ['!', ['has', 'point_count']] : ['all'],
      paint: {
        'circle-color': ['case',
        // Color by Google rating if available
        ['>', ['get', 'google_rating'], 4.5], 'hsl(120, 70%, 45%)',
        // Green for excellent rating
        ['>', ['get', 'google_rating'], 4.0], 'hsl(60, 70%, 50%)',
        // Yellow for good rating
        ['>', ['get', 'google_rating'], 0], 'hsl(25, 70%, 55%)',
        // Orange for lower rating
        // Fallback to ownership type if no rating
        ['==', ['get', 'huvudman'], 'Kommunal'], 'hsl(210, 70%, 50%)',
        // Blue for municipal
        ['==', ['get', 'huvudman'], 'Privat'], 'hsl(140, 60%, 45%)',
        // Green for private
        ['==', ['get', 'huvudman'], 'Fristående'], 'hsl(140, 60%, 45%)',
        // Green for independent (same as private)
        'hsl(25, 70%, 55%)' // Orange for others/unknown
        ],
        'circle-radius': ['case',
        // Larger radius for highly rated preschools
        ['>', ['get', 'google_rating'], 4.5], ['interpolate', ['linear'], ['get', 'antal_barn'], 0, 22,
        // Minimum size for highly rated
        20, 26,
        // Small highly rated preschools
        50, 32,
        // Medium highly rated preschools  
        100, 38,
        // Large highly rated preschools
        200, 44 // Very large highly rated preschools
        ],
        // Standard radius for others
        ['interpolate', ['linear'], ['get', 'antal_barn'], 0, 18,
        // Minimum size
        20, 20,
        // Small preschools
        50, 25,
        // Medium preschools  
        100, 30,
        // Large preschools
        200, 35 // Very large preschools
        ]],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.85
      }
    });

    // Add labels for individual markers
    map.current.addLayer({
      id: 'preschool-labels',
      type: 'symbol',
      source: 'preschools',
      filter: shouldCluster ? ['!', ['has', 'point_count']] : ['all'],
      minzoom: 11,
      layout: {
        'text-field': ['get', 'namn'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 2],
        'text-max-width': 12
      },
      paint: {
        'text-color': '#1f2937',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add click handlers for individual markers
    map.current.on('click', 'preschools-unclustered', e => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const preschoolId = feature.properties?.id;
        const preschool = filteredPreschools.find(p => p.id === preschoolId);
        if (preschool) {
          setPopupPreschool(preschool);
          setShowPopup(true);
        }
      }
    });
    map.current.on('mouseenter', 'preschools-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'preschools-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, [filteredPreschools, layerVisibility, mapZoom, setSelectedPreschool]);

  // Smart map view adaptation based on filtered preschools
  const adaptMapView = useCallback(
    debounce((preschools: Preschool[], filters: any) => {
      if (!map.current || !map.current.isStyleLoaded() || preschools.length === 0) return;

      const municipalityCount = filters.kommuner ? filters.kommuner.length : 
        new Set(preschools.map(p => p.kommun)).size;
      
      const scenario = determineViewScenario(preschools.length, municipalityCount);
      const viewOptions = calculateOptimalView(preschools, scenario);

      setIsMapAnimating(true);

      if (viewOptions.bounds) {
        map.current.fitBounds(viewOptions.bounds, {
          padding: viewOptions.padding,
          duration: viewOptions.duration,
          essential: viewOptions.essential,
          pitch: viewOptions.pitch
        });
      } else if (viewOptions.center) {
        map.current.flyTo({
          center: viewOptions.center,
          zoom: viewOptions.zoom,
          pitch: viewOptions.pitch,
          duration: viewOptions.duration,
          essential: viewOptions.essential,
          easing: createSmoothEasing(scenario)
        });
      }

      // Reset animation state after animation completes
      setTimeout(() => setIsMapAnimating(false), viewOptions.duration! + 100);
    }, 300),
    []
  );

  // React to filtered preschools changes
  useEffect(() => {
    const currentFilters = JSON.stringify(searchFilters);
    
    // Only adapt view if filters have actually changed and we have results
    if (
      filteredPreschools.length > 0 && 
      currentFilters !== previousFilters.current &&
      (searchFilters.kommuner?.length || searchFilters.query || searchFilters.nearbyMode || 
       Object.keys(searchFilters).length > 0)
    ) {
      adaptMapView(filteredPreschools, searchFilters);
      previousFilters.current = currentFilters;
    }
  }, [filteredPreschools, searchFilters, adaptMapView]);

  // Center map when a preschool is selected (enhanced with smooth animation)
  useEffect(() => {
    if (selectedPreschool && map.current && selectedPreschool.latitud && selectedPreschool.longitud) {
      setIsMapAnimating(true);
      
      map.current.flyTo({
        center: [selectedPreschool.longitud, selectedPreschool.latitud],
        zoom: 16,
        pitch: 45,
        bearing: 0,
        duration: 1500,
        essential: true,
        easing: createSmoothEasing('single')
      });

      setTimeout(() => setIsMapAnimating(false), 1600);
    }
  }, [selectedPreschool]);

  // Calculate national averages for popup comparisons
  const nationalAverage = React.useMemo(() => {
    if (preschools.length === 0) return undefined;
    const validChildren = preschools.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = preschools.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = preschools.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = preschools.filter(p => p.google_rating).map(p => p.google_rating!);
    return {
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? validStaff.reduce((a, b) => a + b, 0) / validStaff.length : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? validRating.reduce((a, b) => a + b, 0) / validRating.length : 0
    };
  }, [preschools]);
  return <div className={`relative ${className}`}>
      <AnimatePresence>
        {showPopup && popupPreschool && <EnhancedPopup preschool={popupPreschool} onClose={() => {
        setShowPopup(false);
        setPopupPreschool(null);
      }} onViewDetails={() => {
        setSelectedPreschool(popupPreschool);
        setShowPopup(false);
        setPopupPreschool(null);
      }} nationalAverage={nationalAverage} />}
      </AnimatePresence>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {isLoading && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-foreground font-medium">Laddar 3D-karta över Sverige...</p>
          </div>
        </motion.div>}

      {/* Map animation indicator */}
      {isMapAnimating && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border z-50"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-foreground font-medium">Anpassar kartvy...</span>
          </div>
        </motion.div>
      )}


      {/* Enhanced preschool count with context */}
      
    </div>;
};