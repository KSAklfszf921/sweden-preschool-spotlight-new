import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';

interface ActiveFiltersDisplayProps {
  className?: string;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({ className }) => {
  const { searchFilters, clearSpecificFilter, clearFilters } = useMapStore();

  const getFilterDisplayItems = () => {
    const items: Array<{ key: string; label: string; value: any }> = [];

    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      searchFilters.kommuner.forEach(kommun => {
        items.push({
          key: `kommun-${kommun}`,
          label: kommun,
          value: kommun
        });
      });
    }

    if (searchFilters.huvudman && searchFilters.huvudman !== 'alla') {
      items.push({
        key: 'huvudman',
        label: searchFilters.huvudman === 'Enskild' ? 'Fristående' : searchFilters.huvudman,
        value: searchFilters.huvudman
      });
    }

    if (searchFilters.query) {
      items.push({
        key: 'query',
        label: `Sökning: "${searchFilters.query}"`,
        value: searchFilters.query
      });
    }

    if (searchFilters.nearbyMode) {
      items.push({
        key: 'nearby',
        label: `Närområde (${searchFilters.radius ? Math.round(searchFilters.radius / 1000) : 2} km)`,
        value: 'nearby'
      });
    }

    if (searchFilters.maxChildren && searchFilters.maxChildren < 200) {
      items.push({
        key: 'maxChildren',
        label: `Max ${searchFilters.maxChildren} barn`,
        value: searchFilters.maxChildren
      });
    }

    if (searchFilters.minPersonaltäthet) {
      items.push({
        key: 'minPersonaltäthet',
        label: `Personal ≥ ${searchFilters.minPersonaltäthet}`,
        value: searchFilters.minPersonaltäthet
      });
    }

    if (searchFilters.minExamen) {
      items.push({
        key: 'minExamen',
        label: `Examen ≥ ${searchFilters.minExamen}%`,
        value: searchFilters.minExamen
      });
    }

    return items;
  };

  const handleRemoveFilter = (key: string, value: any) => {
    if (key.startsWith('kommun-')) {
      // Remove specific municipality
      const kommunToRemove = value;
      const newKommuner = searchFilters.kommuner?.filter(k => k !== kommunToRemove);
      if (newKommuner && newKommuner.length > 0) {
        clearSpecificFilter('kommuner');
        // Re-set with remaining municipalities
        setTimeout(() => {
          useMapStore.getState().setSearchFilters({ kommuner: newKommuner });
        }, 0);
      } else {
        clearSpecificFilter('kommuner');
      }
    } else if (key === 'nearby') {
      clearSpecificFilter('nearbyMode');
    } else {
      clearSpecificFilter(key as keyof typeof searchFilters);
    }
  };

  const filterItems = getFilterDisplayItems();

  if (filterItems.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {filterItems.map(item => (
        <Badge
          key={item.key}
          variant="secondary"
          className="flex items-center gap-1 pr-1 pl-2 py-1"
        >
          <span className="text-xs">{item.label}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRemoveFilter(item.key, item.value)}
            className="h-3 w-3 p-0 hover:bg-destructive/20 ml-1"
            title={`Ta bort filter: ${item.label}`}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}
      
      {filterItems.length > 1 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={clearFilters}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive ml-1"
        >
          Rensa alla
        </Button>
      )}
    </div>
  );
};