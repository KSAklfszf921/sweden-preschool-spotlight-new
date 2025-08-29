import type { LngLatBoundsLike, LngLatLike } from 'mapbox-gl';
import type { Preschool } from '@/stores/mapStore';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewOptions {
  center?: LngLatLike;
  zoom?: number;
  bounds?: LngLatBoundsLike;
  duration?: number;
  essential?: boolean;
  pitch?: number;
  bearing?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Calculate optimal map view for a set of preschools
 */
export const calculateOptimalView = (
  preschools: Preschool[],
  scenario: 'single' | 'few' | 'many' | 'municipality' | 'multi-municipality' = 'many'
): MapViewOptions => {
  const validPreschools = preschools.filter(
    p => p.latitud !== null && p.longitud !== null && 
    p.latitud !== 0 && p.longitud !== 0 &&
    typeof p.latitud === 'number' && typeof p.longitud === 'number'
  );

  if (validPreschools.length === 0) {
    return {
      center: [15.0, 62.0],
      zoom: 5,
      duration: 1000,
      essential: true
    };
  }

  // Single preschool - zoom in close with details
  if (validPreschools.length === 1) {
    const preschool = validPreschools[0];
    return {
      center: [preschool.longitud!, preschool.latitud!],
      zoom: 15,
      pitch: 45,
      duration: 1500,
      essential: true,
      padding: { top: 50, bottom: 50, left: 50, right: 50 }
    };
  }

  // Calculate bounds for multiple preschools
  const lats = validPreschools.map(p => p.latitud!);
  const lngs = validPreschools.map(p => p.longitud!);
  
  const bounds: LngLatBoundsLike = [
    [Math.min(...lngs), Math.min(...lats)], // Southwest
    [Math.max(...lngs), Math.max(...lats)]  // Northeast
  ];

  // Calculate geographic spread
  const latSpread = Math.max(...lats) - Math.min(...lats);
  const lngSpread = Math.max(...lngs) - Math.min(...lngs);
  const maxSpread = Math.max(latSpread, lngSpread);

  // Determine optimal settings based on scenario and spread
  let zoom: number;
  let duration: number;
  let padding: { top: number; bottom: number; left: number; right: number };
  let pitch = 30;

  switch (scenario) {
    case 'few': // 2-10 preschools
      if (maxSpread < 0.005) {
        zoom = 14;
        padding = { top: 100, bottom: 100, left: 100, right: 100 };
      } else if (maxSpread < 0.02) {
        zoom = 13;
        padding = { top: 80, bottom: 80, left: 80, right: 80 };
      } else {
        zoom = 12;
        padding = { top: 60, bottom: 60, left: 60, right: 60 };
      }
      duration = 1200;
      break;

    case 'municipality':
      if (maxSpread < 0.01) {
        zoom = 13;
        padding = { top: 80, bottom: 80, left: 80, right: 80 };
      } else if (maxSpread < 0.05) {
        zoom = 12;
        padding = { top: 100, bottom: 100, left: 100, right: 100 };
      } else {
        zoom = 11;
        padding = { top: 120, bottom: 120, left: 120, right: 120 };
      }
      duration = 1500;
      pitch = 20;
      break;

    case 'multi-municipality':
      if (maxSpread < 0.1) {
        zoom = 10;
        padding = { top: 100, bottom: 100, left: 100, right: 100 };
      } else if (maxSpread < 0.5) {
        zoom = 8;
        padding = { top: 120, bottom: 120, left: 120, right: 120 };
      } else {
        zoom = 6;
        padding = { top: 150, bottom: 150, left: 150, right: 150 };
      }
      duration = 2000;
      pitch = 15;
      break;

    case 'many': // 10+ preschools
    default:
      if (maxSpread < 0.01) {
        zoom = 13;
        padding = { top: 80, bottom: 80, left: 80, right: 80 };
      } else if (maxSpread < 0.05) {
        zoom = 11;
        padding = { top: 100, bottom: 100, left: 100, right: 100 };
      } else if (maxSpread < 0.2) {
        zoom = 9;
        padding = { top: 120, bottom: 120, left: 120, right: 120 };
      } else {
        zoom = 7;
        padding = { top: 150, bottom: 150, left: 150, right: 150 };
      }
      duration = 1800;
      pitch = 20;
      break;
  }

  return {
    bounds,
    duration,
    essential: true,
    pitch,
    padding
  };
};

/**
 * Determine the appropriate scenario based on preschool count and context
 */
export const determineViewScenario = (
  preschoolCount: number,
  municipalityCount: number
): 'single' | 'few' | 'many' | 'municipality' | 'multi-municipality' => {
  if (preschoolCount === 1) return 'single';
  if (municipalityCount > 1) return 'multi-municipality';
  if (municipalityCount === 1) return 'municipality';
  if (preschoolCount <= 10) return 'few';
  return 'many';
};

/**
 * Create smooth easing function for map animations
 */
export const createSmoothEasing = (scenario: string) => {
  switch (scenario) {
    case 'single':
      return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'municipality':
    case 'multi-municipality':
      return (t: number) => t * t * (3 - 2 * t);
    default:
      return (t: number) => 1 - Math.pow(1 - t, 3);
  }
};

/**
 * Debounce function for map updates
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};