import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore } from '@/stores/mapStore';

interface CoordinateStats {
  total: number;
  withCoordinates: number;
  missingCoordinates: number;
  needsGeocoding: number;
  byKommun: Record<string, {
    total: number;
    missing: number;
    percentage: number;
  }>;
}

export const useAdminCoordinateStats = () => {
  const [stats, setStats] = useState<CoordinateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { preschools } = useMapStore();

  const calculateStats = () => {
    if (!preschools.length) return;

    const total = preschools.length;
    const withCoordinates = preschools.filter(p => 
      p.latitud !== null && p.longitud !== null && 
      p.latitud !== 0 && p.longitud !== 0
    ).length;
    const missingCoordinates = total - withCoordinates;
    const needsGeocoding = preschools.filter(p => 
      p.latitud === null || p.longitud === null || 
      p.latitud === 0 || p.longitud === 0
    ).length;

    // Calculate by kommun
    const byKommun: Record<string, { total: number; missing: number; percentage: number }> = {};
    
    preschools.forEach(p => {
      if (!byKommun[p.kommun]) {
        byKommun[p.kommun] = { total: 0, missing: 0, percentage: 0 };
      }
      byKommun[p.kommun].total++;
      
      if (p.latitud === null || p.longitud === null || p.latitud === 0 || p.longitud === 0) {
        byKommun[p.kommun].missing++;
      }
    });

    // Calculate percentages
    Object.keys(byKommun).forEach(kommun => {
      const stats = byKommun[kommun];
      stats.percentage = Math.round((stats.missing / stats.total) * 100);
    });

    setStats({
      total,
      withCoordinates,
      missingCoordinates,
      needsGeocoding,
      byKommun
    });
    setIsLoading(false);
  };

  useEffect(() => {
    calculateStats();
  }, [preschools]);

  return {
    stats,
    isLoading,
    refresh: calculateStats
  };
};