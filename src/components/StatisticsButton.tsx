import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/stores/mapStore';

export const StatisticsButton: React.FC = () => {
  const { searchFilters, filteredPreschools, preschools, showStatistics, setShowStatistics } = useMapStore();

  // Check if filters are active
  const hasActiveFilters = Object.keys(searchFilters).some(key => {
    const value = searchFilters[key as keyof typeof searchFilters];
    return value !== undefined && value !== '' && value !== null;
  }) && filteredPreschools.length !== preschools.length;

  const getButtonText = () => {
    if (showStatistics) return 'Dölj statistik';
    if (hasActiveFilters) {
      if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
        if (searchFilters.kommuner.length === 1) {
          return `Statistik för ${searchFilters.kommuner[0]}`;
        } else {
          return `Statistik för ${searchFilters.kommuner.length} kommuner`;
        }
      }
      if (searchFilters.radius) return 'Statistik för närområdet';
      if (searchFilters.huvudman) return `Statistik för ${searchFilters.huvudman.toLowerCase()}a`;
      if (searchFilters.query) return 'Statistik för sökningen';
      return 'Statistik för filter';
    }
    return 'Visa statistik';
  };

  return (
    <Button
      onClick={() => setShowStatistics(!showStatistics)}
      variant={showStatistics ? "default" : "outline"}
      size="sm"
      data-testid="statistics-button"
      className="bg-card/80 backdrop-blur-xl border-border/50 shadow-lg hover:bg-card/90"
    >
      <BarChart3 className="w-4 h-4 mr-2" />
      {getButtonText()}
    </Button>
  );
};