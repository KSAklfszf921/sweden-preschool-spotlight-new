import React, { useState, useMemo } from 'react';
import { X, MapPin, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMapStore } from '@/stores/mapStore';

interface MultiMunicipalitySelectProps {
  selectedKommuner: string[];
  onSelectionChange: (kommuner: string[]) => void;
  className?: string;
}

export const MultiMunicipalitySelect: React.FC<MultiMunicipalitySelectProps> = ({
  selectedKommuner,
  onSelectionChange,
  className
}) => {
  const { preschools } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique municipalities with preschool counts
  const municipalitiesWithCounts = useMemo(() => {
    const kommunCounts = preschools.reduce((acc, preschool) => {
      if (preschool.kommun) {
        acc[preschool.kommun] = (acc[preschool.kommun] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(kommunCounts)
      .map(([kommun, count]) => ({ kommun, count }))
      .sort((a, b) => a.kommun.localeCompare(b.kommun));
  }, [preschools]);

  // Filter municipalities based on search
  const filteredMunicipalities = useMemo(() => {
    if (!searchQuery) return municipalitiesWithCounts;
    
    return municipalitiesWithCounts.filter(({ kommun }) =>
      kommun.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [municipalitiesWithCounts, searchQuery]);

  const addMunicipality = (kommun: string) => {
    if (!selectedKommuner.includes(kommun)) {
      onSelectionChange([...selectedKommuner, kommun]);
    }
    setSearchQuery('');
    setIsExpanded(false);
  };

  const removeMunicipality = (kommun: string) => {
    onSelectionChange(selectedKommuner.filter(k => k !== kommun));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected municipalities */}
      {selectedKommuner.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedKommuner.map(kommun => (
            <Badge
              key={kommun}
              variant="secondary"
              className="flex items-center gap-1 pr-1 pl-2 py-1"
            >
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{kommun}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeMunicipality(kommun)}
                className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Rensa alla
          </Button>
        </div>
      )}

      {/* Add municipality input */}
      <div className="relative">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Lägg till kommun..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsExpanded(e.target.value.length > 0);
              }}
              onFocus={() => setIsExpanded(true)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Dropdown with municipalities */}
        {isExpanded && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 border shadow-lg">
            <ScrollArea className="max-h-48">
              <div className="p-2 space-y-1">
                {filteredMunicipalities.length > 0 ? (
                  filteredMunicipalities.map(({ kommun, count }) => (
                    <Button
                      key={kommun}
                      variant="ghost"
                      size="sm"
                      onClick={() => addMunicipality(kommun)}
                      disabled={selectedKommuner.includes(kommun)}
                      className="w-full justify-between h-8 px-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{kommun}</span>
                      </div>
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        {count}
                      </Badge>
                    </Button>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Ingen kommun hittades
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Summary */}
      {selectedKommuner.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedKommuner.length} kommun{selectedKommuner.length !== 1 ? 'er' : ''} vald{selectedKommuner.length !== 1 ? 'a' : ''}
        </div>
      )}
    </div>
  );
};