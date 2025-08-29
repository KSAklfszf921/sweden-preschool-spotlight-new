import { Preschool } from '@/stores/mapStore';

// 3D Building configuration for preschools
export interface BuildingConfig {
  height: number;
  color: string;
  opacity: number;
  baseHeight?: number;
}

// Calculate building height based on child count and zoom level
export const calculateBuildingHeight = (preschool: Preschool, zoom: number): number => {
  const childCount = preschool.antal_barn || 0;
  const baseHeight = 2; // Minimum building height in meters
  
  // Scale factor increases with zoom for better visibility
  const scaleFactor = Math.pow(zoom - 13, 1.2) * 0.8;
  
  // Logarithmic scaling for child count to prevent extreme heights
  const childHeightFactor = Math.log10(Math.max(childCount, 1) + 1) * 4;
  
  return baseHeight + (childHeightFactor * scaleFactor);
};

// Get building color based on operator type and quality metrics
export const getBuildingColor = (preschool: Preschool): string => {
  const isKommunal = preschool.huvudman === 'Kommunal';
  
  // Base colors for operator types
  const baseColor = isKommunal 
    ? 'rgba(34, 139, 34, 0.8)'  // Forest green for municipal
    : 'rgba(30, 144, 255, 0.8)'; // Dodger blue for private
  
  // Adjust color based on quality metrics
  const teacherExam = preschool.andel_med_förskollärarexamen || 0;
  const rating = preschool.google_rating || 0;
  
  // Calculate quality score (0-1)
  const qualityScore = (teacherExam / 100 * 0.6) + (rating / 5 * 0.4);
  
  if (qualityScore > 0.8) {
    // High quality: brighter, more golden tint
    return isKommunal 
      ? 'rgba(50, 205, 50, 0.9)'   // Lime green
      : 'rgba(0, 191, 255, 0.9)';  // Deep sky blue
  } else if (qualityScore > 0.6) {
    // Good quality: normal colors
    return baseColor;
  } else {
    // Lower quality: darker, more muted
    return isKommunal 
      ? 'rgba(34, 139, 34, 0.6)'  // Darker forest green
      : 'rgba(30, 144, 255, 0.6)'; // Darker blue
  }
};

// Generate Mapbox GL building extrusion layer configuration
export const generateBuildingExtrusionLayer = (zoom: number): any => {
  return {
    id: 'preschool-buildings-3d',
    type: 'fill-extrusion' as const,
    source: 'preschools',
    minzoom: 14,
    filter: ['>', ['get', 'antal_barn'], 0] as any, // Only show buildings with child count
    paint: {
      // Height based on child count
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['get', 'antal_barn'],
        0, 2,    // Minimum height
        20, 8,   // Small preschool
        40, 15,  // Medium preschool  
        60, 22,  // Large preschool
        100, 35, // Very large preschool
        200, 50  // Maximum height
      ],
      
      // Base height
      'fill-extrusion-base': 0,
      
      // Color based on operator type and quality
      'fill-extrusion-color': [
        'case',
        ['==', ['get', 'huvudman'], 'Kommunal'],
        [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'andel_med_förskollärarexamen'], 0],
          0, 'rgba(34, 139, 34, 0.6)',   // Low quality municipal
          50, 'rgba(34, 139, 34, 0.8)',  // Medium quality municipal
          80, 'rgba(50, 205, 50, 0.9)'   // High quality municipal
        ],
        [
          'interpolate',
          ['linear'], 
          ['coalesce', ['get', 'andel_med_förskollärarexamen'], 0],
          0, 'rgba(30, 144, 255, 0.6)',  // Low quality private
          50, 'rgba(30, 144, 255, 0.8)', // Medium quality private
          80, 'rgba(0, 191, 255, 0.9)'   // High quality private
        ]
      ],
      
      // Opacity based on zoom level
      'fill-extrusion-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14, 0.3,
        16, 0.7,
        18, 0.9
      ]
    }
  };
};

// Generate building footprint layer for context
export const generateBuildingFootprintLayer = (): any => {
  return {
    id: 'preschool-buildings-footprint',
    type: 'fill' as const,
    source: 'preschools',
    minzoom: 12,
    maxzoom: 14,
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'huvudman'], 'Kommunal'],
        'rgba(34, 139, 34, 0.4)',  // Green for municipal
        'rgba(30, 144, 255, 0.4)'  // Blue for private
      ],
      'fill-outline-color': [
        'case',
        ['==', ['get', 'huvudman'], 'Kommunal'],
        'rgba(34, 139, 34, 0.8)',  // Green outline
        'rgba(30, 144, 255, 0.8)'  // Blue outline
      ],
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 0.2,
        13, 0.4,
        14, 0.6
      ]
    }
  };
};

// Generate terrain context layers (parks, schools, etc.)
export const generateTerrainContextLayers = () => {
  return [
    {
      id: 'parks-context',
      type: 'fill' as const,
      source: 'mapbox-streets-v8',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'recreation_ground'],
      paint: {
        'fill-color': 'rgba(34, 139, 34, 0.1)',
        'fill-opacity': 0.2
      } as any
    },
    {
      id: 'schools-context',
      type: 'fill' as const,
      source: 'mapbox-streets-v8',
      'source-layer': 'landuse', 
      filter: ['==', 'class', 'school'],
      paint: {
        'fill-color': 'rgba(255, 165, 0, 0.1)',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 0.1,
          16, 0.2
        ]
      }
    }
  ];
};

// Get preschool clustering configuration for address-based grouping
export const getAddressClusterConfig = () => {
  return {
    cluster: true,
    clusterMaxZoom: 16,
    clusterRadius: 30, // Smaller radius for address-level clustering
    clusterProperties: {
      'total_children': ['+', ['get', 'antal_barn']],
      'avg_staff': [['/', ['+', ['get', 'personaltäthet']], ['get', 'point_count']], 0],
      'avg_teacher_exam': [['/', ['+', ['get', 'andel_med_förskollärarexamen']], ['get', 'point_count']], 0],
      'avg_rating': [['/', ['+', ['get', 'google_rating']], ['get', 'point_count']], 0],
      'kommunal_count': [
        '+',
        ['case', ['==', ['get', 'huvudman'], 'Kommunal'], 1, 0]
      ],
      'enskild_count': [
        '+', 
        ['case', ['==', ['get', 'huvudman'], 'Enskild'], 1, 0]
      ]
    }
  };
};