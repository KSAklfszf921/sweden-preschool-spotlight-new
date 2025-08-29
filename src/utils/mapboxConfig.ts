export const mapboxConfig = {
  accessToken: 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw',
  
  // Modern Scandinavian-minimalist design configuration
  swedenStyle: {
    // Nature-inspired colors - modern and fresh
    water: 'hsl(205, 45%, 88%)', // Soft Nordic blue-gray water
    land: 'hsl(120, 8%, 97%)', // Almost white with subtle green warmth
    forest: 'hsl(135, 20%, 28%)', // Deep forest green with modern touch
    
    // Infrastructure colors - minimal and clean
    roads: 'hsl(210, 8%, 85%)', // Light gray roads, barely visible
    buildings: 'hsl(210, 5%, 92%)', // Very light buildings that blend
    
    // Modern heatmap gradient - light blue to red
    heatmap: {
      minimal: 'hsl(200, 50%, 95%)', // Almost invisible start
      low: 'hsl(195, 65%, 85%)', // Light blue
      medium: 'hsl(180, 70%, 70%)', // Cyan
      high: 'hsl(45, 90%, 65%)', // Warm yellow
      intense: 'hsl(25, 85%, 60%)', // Orange
      critical: 'hsl(5, 80%, 58%)' // Red
    },
    
    // Preschool marker colors - distinct and professional
    preschoolColors: {
      municipal: 'hsl(210, 60%, 55%)', // Warm blue for municipal
      private: 'hsl(140, 40%, 45%)', // Elegant green for private
      cooperative: 'hsl(25, 70%, 55%)', // Soft orange for cooperative
      unknown: 'hsl(220, 10%, 60%)' // Neutral gray for unknown
    },
    
    // Quality indicators
    qualityRings: {
      excellent: 'hsl(45, 95%, 50%)', // Gold ring
      good: 'hsl(0, 0%, 75%)', // Silver ring
      standard: 'transparent' // No ring
    }
  },
  
  // Performance settings optimized for Sweden with zoom-based hierarchy
  settings: {
    maxZoom: 18,
    minZoom: 4,
    centerSweden: [15.5, 62.0], // Geographic center of Sweden
    defaultZoom: 5.5,
    
    // Zoom-based visual hierarchy thresholds
    zoomThresholds: {
      heatmapOnly: 8, // Below this zoom, only show heatmap
      clustersStart: 9, // Start showing clusters
      markersStart: 13, // Start showing individual markers
      detailsStart: 15 // Show full marker details
    },
    
    // Clustering settings - more refined
    clusterRadius: 60,
    clusterMaxZoom: 12,
    
    // Modern heatmap settings
    heatmapRadius: 25,
    heatmapMaxZoom: 9,
    heatmapIntensity: 0.8,
    
    // Marker sizing based on child count - larger for better clickability
    markerSizes: {
      small: 12, // 1-20 children
      medium: 18, // 21-50 children  
      large: 24, // 51+ children
      cluster: 20 // Cluster markers
    }
  }
};