import { HeatmapType } from '@/stores/mapStore';

// Modern minimalist gradient colors - light blue to red
export const HEATMAP_GRADIENTS = {
  density: {
    name: 'Förskoltäthet',
    description: 'Antal förskolor per område',
    colors: [
      { stop: 0, color: 'rgba(200, 225, 240, 0)' },     // Minimal start
      { stop: 0.1, color: 'hsl(195, 65%, 85%)' },       // Light blue
      { stop: 0.3, color: 'hsl(180, 70%, 70%)' },       // Cyan
      { stop: 0.5, color: 'hsl(45, 90%, 65%)' },        // Warm yellow
      { stop: 0.7, color: 'hsl(25, 85%, 60%)' },        // Orange
      { stop: 1, color: 'hsl(5, 80%, 58%)' }            // Red
    ]
  },
  staff: {
    name: 'Personaltäthet',
    description: 'Vuxen-barn ratio (bättre personal = blåare)',
    colors: [
      { stop: 0, color: 'rgba(200, 225, 240, 0)' },
      { stop: 0.2, color: 'hsl(195, 65%, 85%)' },
      { stop: 0.4, color: 'hsl(180, 70%, 70%)' },
      { stop: 0.6, color: 'hsl(45, 90%, 65%)' },
      { stop: 0.8, color: 'hsl(25, 85%, 60%)' },
      { stop: 1, color: 'hsl(5, 80%, 58%)' }
    ]
  },
  quality: {
    name: 'Lärarexamen %',
    description: 'Andel med förskollärarexamen',
    colors: [
      { stop: 0, color: 'rgba(200, 225, 240, 0)' },
      { stop: 0.2, color: 'hsl(195, 65%, 85%)' },
      { stop: 0.4, color: 'hsl(180, 70%, 70%)' },
      { stop: 0.6, color: 'hsl(45, 90%, 65%)' },
      { stop: 0.8, color: 'hsl(25, 85%, 60%)' },
      { stop: 1, color: 'hsl(5, 80%, 58%)' }
    ]
  },
  rating: {
    name: 'Google Betyg',
    description: 'Föräldrarnas betyg',
    colors: [
      { stop: 0, color: 'rgba(200, 225, 240, 0)' },
      { stop: 0.2, color: 'hsl(195, 65%, 85%)' },
      { stop: 0.4, color: 'hsl(180, 70%, 70%)' },
      { stop: 0.6, color: 'hsl(45, 90%, 65%)' },
      { stop: 0.8, color: 'hsl(25, 85%, 60%)' },
      { stop: 1, color: 'hsl(5, 80%, 58%)' }
    ]
  }
} as const;

// Weight calculation functions for each heatmap type
export const calculateHeatmapWeight = (preschool: any, type: HeatmapType, zoom: number): number => {
  let baseWeight = 1;
  
  switch (type) {
    case 'density': {
      // Base weight with child count influence
      const childCount = preschool.antal_barn || 0;
      baseWeight = 1 + Math.log10(Math.max(childCount, 1)) * 0.3;
      // Add group count influence
      const groupCount = preschool.antal_barngrupper || 1;
      baseWeight += Math.log10(groupCount + 1) * 0.2;
      break;
    }
      
    case 'staff': {
      // Staff density with logarithmic scaling (higher is better)
      const staffRatio = preschool.personaltäthet || 0;
      if (staffRatio > 0) {
        // Invert the scale: higher staff ratio = higher weight
        baseWeight = Math.max(0.2, Math.log10(staffRatio * 20) * 0.8);
      } else {
        baseWeight = 0.1; // Low weight for unknown staff ratio
      }
      break;
    }
      
    case 'quality': {
      // Teacher qualification percentage with exponential scaling
      const qualPercent = preschool.andel_med_förskollärarexamen || 0;
      baseWeight = Math.max(0.2, Math.pow(qualPercent / 100, 0.7) * 2.5);
      break;
    }
      
    case 'rating': {
      // Google rating with exponential emphasis on higher ratings
      const rating = preschool.google_rating || 0;
      if (rating > 0) {
        baseWeight = Math.max(0.3, Math.pow(rating / 5, 1.5) * 3);
        // Boost for high review count
        const reviewCount = preschool.google_reviews_count || 0;
        if (reviewCount > 10) {
          baseWeight *= (1 + Math.log10(reviewCount / 10) * 0.2);
        }
      } else {
        baseWeight = 0.1; // Low weight for no rating
      }
      break;
    }
      
    default: {
      // Enhanced default weight considering multiple factors
      const childrenWeight = Math.log10(Math.max(preschool.antal_barn || 1, 1)) * 0.2;
      const ratingWeight = preschool.google_rating ? (preschool.google_rating / 5) * 0.3 : 0;
      const groupWeight = preschool.antal_barngrupper ? Math.log10(preschool.antal_barngrupper + 1) * 0.2 : 0;
      const qualityWeight = preschool.andel_med_förskollärarexamen ? (preschool.andel_med_förskollärarexamen / 100) * 0.3 : 0;
      baseWeight = 1 + childrenWeight + ratingWeight + groupWeight + qualityWeight;
      break;
    }
  }
  
  // Apply zoom-based weight adjustment to prevent oversaturation
  const zoomAdjustment = Math.min(zoom / 6, 1);
  return Math.max(0.1, Math.min(baseWeight * (0.5 + zoomAdjustment * 0.5), 6));
};

// Generate Mapbox GL heatmap color expression from gradient
export const generateHeatmapColorExpression = (type: HeatmapType) => {
  const gradient = HEATMAP_GRADIENTS[type];
  
  const expression: any[] = [
    'interpolate',
    ['exponential', 1.8],
    ['heatmap-density']
  ];
  
  gradient.colors.forEach(({ stop, color }) => {
    expression.push(stop, color);
  });
  
  return expression;
};

// Get adaptive intensity based on data density and zoom
export const getAdaptiveIntensity = (dataCount: number, zoom: number, baseIntensity: number = 1): number => {
  // Logarithmic scaling based on data density
  const densityFactor = Math.log10(Math.max(dataCount, 10)) / 4;
  
  // Zoom-based intensity scaling
  const zoomFactor = Math.pow(zoom / 6, 1.5);
  
  // Combine factors with base intensity
  const adaptiveIntensity = densityFactor * zoomFactor * baseIntensity * 0.8;
  
  return Math.min(Math.max(adaptiveIntensity, 0.1), 3);
};

// Get adaptive radius based on zoom and data density
export const getAdaptiveRadius = (zoom: number, dataCount: number): any => {
  const baseSizes = [
    Math.max(6, 15 - dataCount / 500),
    Math.max(8, 18 - dataCount / 400),
    Math.max(12, 22 - dataCount / 300),
    Math.max(16, 28 - dataCount / 200),
    Math.max(20, 35 - dataCount / 150),
    Math.max(25, 45 - dataCount / 100)
  ];
  
  return [
    'interpolate',
    ['exponential', 1.8],
    ['zoom'],
    1, baseSizes[0],
    2, baseSizes[1], 
    3, baseSizes[2],
    4, baseSizes[3],
    5, baseSizes[4],
    6, baseSizes[5]
  ];
};