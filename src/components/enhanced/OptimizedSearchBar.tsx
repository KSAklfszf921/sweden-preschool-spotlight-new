import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, X, Navigation, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapStore } from '@/stores/mapStore';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { SWEDISH_MUNICIPALITIES } from '@/data/municipalities';
interface OptimizedSearchBarProps {
  className?: string;
}
export const OptimizedSearchBar: React.FC<OptimizedSearchBarProps> = ({
  className
}) => {
  const {
    preschools,
    searchFilters,
    setSearchFilters,
    clearFilters,
    setMapCenter,
    setMapZoom,
    filteredPreschools
  } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'kommun' | 'preschool';
    value: string;
    label: string;
    count?: number;
  }>>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Memoized unique values for performance
  // Use comprehensive list of all Swedish municipalities
  const uniqueKommuner = useMemo(() => SWEDISH_MUNICIPALITIES, []);

  // Generate suggestions based on search query
  const generateSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions: Array<{
      type: 'kommun' | 'preschool';
      value: string;
      label: string;
      count?: number;
    }> = [];

    // Add kommun suggestions
    const matchingKommuner = uniqueKommuner.filter(k => 
      k.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    matchingKommuner.forEach(kommun => {
      const count = preschools.filter(p => p.kommun === kommun).length;
      suggestions.push({
        type: 'kommun',
        value: kommun,
        label: kommun,
        count
      });
    });

    // Add preschool suggestions
    const matchingPreschools = preschools.filter(p => 
      p.namn.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    matchingPreschools.forEach(preschool => {
      suggestions.push({
        type: 'preschool',
        value: preschool.namn,
        label: `${preschool.namn}, ${preschool.kommun}`
      });
    });

    setSuggestions(suggestions.slice(0, 10));
    setShowSuggestions(suggestions.length > 0);
  }, [uniqueKommuner, preschools]);

  // Handle search query changes
  useEffect(() => {
    generateSuggestions(searchQuery);
  }, [searchQuery, generateSuggestions]);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion: typeof suggestions[0]) => {
    if (suggestion.type === 'kommun') {
      setSearchQuery(suggestion.value);
      // Add to existing municipalities instead of replacing
      const currentKommuner = searchFilters.kommuner || [];
      if (!currentKommuner.includes(suggestion.value)) {
        setSearchFilters({
          kommuner: [...currentKommuner, suggestion.value]
        });
      }
    } else {
      setSearchQuery(suggestion.value);
      setSearchFilters({
        query: suggestion.value
      });
    }
    setShowSuggestions(false);
  }, [setSearchFilters, searchFilters.kommuner]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect - only apply when not using suggestions
  useEffect(() => {
    if (debouncedSearchQuery.length > 0 && !showSuggestions && suggestions.length === 0) {
      // Only apply automatic search if no suggestions are being shown
      const kommun = uniqueKommuner.find(k => k.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      if (kommun) {
        setSearchFilters({
          kommuner: [kommun]
        });
      } else {
        setSearchFilters({
          query: debouncedSearchQuery
        });
      }
    } else if (debouncedSearchQuery.length === 0 && searchQuery.length === 0) {
      clearFilters();
    }
  }, [debouncedSearchQuery, uniqueKommuner, setSearchFilters, clearFilters, searchQuery, showSuggestions, suggestions.length]);
  const handleGetCurrentLocation = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      const {
        latitude,
        longitude
      } = position.coords;
      const center: [number, number] = [longitude, latitude];
      setUserLocation({
        lat: latitude,
        lng: longitude
      });
      setMapCenter(center);
      setMapZoom(12);
      setSearchFilters({
        radius: 2000,
        // 2km default
        center: center,
        nearbyMode: true
      });
      setIsLocating(false);
    }, error => {
      console.error('Error getting location:', error);
      setIsLocating(false);
      alert('Kunde inte hämta din position. Kontrollera att du tillåter platsåtkomst.');
    });
  }, [setMapCenter, setMapZoom, setSearchFilters]);
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    clearFilters();
    setUserLocation(null);
  }, [clearFilters]);
  const hasActiveFilters = useMemo(() => {
    return Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.length > 0 : typeof value === 'boolean' ? value : true);
    });
  }, [searchFilters]);
  const filterCount = useMemo(() => {
    return Object.keys(searchFilters).filter(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      // Only count meaningful filters, not empty arrays or default values
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return true;
      if (typeof value === 'object' && value !== null) return true;
      return false;
    }).length;
  }, [searchFilters]);

  // Minimized view
  if (!isExpanded) {
    return <motion.div initial={{
      opacity: 0,
      x: -20
    }} animate={{
      opacity: 1,
      x: 0
    }} className={`absolute left-4 top-4 z-30 ${className}`}>
        <Card className="glass-search border-0 shadow-lg card-hover">
          <div className="p-3 px-0 py-0">
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsExpanded(true)} variant="ghost" size="sm" className="h-8 px-2 hover-scale transition-all duration-200 font-heading">
                <Search className="h-4 w-4 mr-1 text-primary" />
                <span className="font-medium text-base">Sök förskolor</span>
                {hasActiveFilters && <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {filterCount}
                  </Badge>}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              
              {/* Quick clear button when filters are active */}
              {hasActiveFilters && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                  title="Rensa alla filter"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
            
            
            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-border/50">
                <ActiveFiltersDisplay />
              </div>
            )}
          </div>
        </Card>
      </motion.div>;
}
  return <motion.div initial={{
    opacity: 0,
    x: -20
  }} animate={{
    opacity: 1,
    x: 0
  }} className={`absolute left-4 top-4 z-30 w-96 ${className}`}>
      <Card className="glass-search border-0 shadow-lg card-hover">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-base">Sök förskolor</h3>
              {hasActiveFilters && <Badge variant="secondary" className="h-5">
                  {filterCount}
                </Badge>}
            </div>
            <Button onClick={() => setIsExpanded(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                ref={inputRef} 
                type="text" 
                placeholder="Sök kommun eller förskola..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                className="pl-10 pr-10 border-0 focus:ring-2 focus:ring-primary/20" 
              />
              {searchQuery && (
                <Button size="sm" variant="ghost" onClick={clearSearch} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50">
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors text-sm border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {suggestion.type === 'kommun' ? (
                            <MapPin className="h-3 w-3 text-primary" />
                          ) : (
                            <Search className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-foreground">{suggestion.label}</span>
                        </div>
                        {suggestion.count && (
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {suggestion.count}
                          </Badge>
                        )}
                      </div>
                      {suggestion.type === 'kommun' && (
                        <div className="text-xs text-muted-foreground ml-5">
                          {suggestion.count} förskolor
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Quick filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Kommuner {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                    <span className="text-primary">({searchFilters.kommuner.length})</span>
                  )}
                </label>
                <div className="space-y-2">
                  {/* Selected municipalities */}
                  {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {searchFilters.kommuner.map(kommun => (
                        <Badge
                          key={kommun}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1 pl-2 py-1 text-xs"
                        >
                          <span>{kommun}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newKommuner = searchFilters.kommuner?.filter(k => k !== kommun);
                              setSearchFilters({
                                ...searchFilters,
                                kommuner: newKommuner?.length ? newKommuner : undefined
                              });
                            }}
                            className="h-3 w-3 p-0 hover:bg-destructive/20"
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Add municipality selector */}
                  <Select 
                    value="add" 
                    onValueChange={value => {
                      if (value !== 'add' && value !== 'all') {
                        const currentKommuner = searchFilters.kommuner || [];
                        if (!currentKommuner.includes(value)) {
                          setSearchFilters({
                            ...searchFilters,
                            kommuner: [...currentKommuner, value]
                          });
                        }
                      } else if (value === 'all') {
                        setSearchFilters({
                          ...searchFilters,
                          kommuner: undefined
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="+ Lägg till kommun" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="all">Rensa alla kommuner</SelectItem>
                      {uniqueKommuner.map(kommun => (
                        <SelectItem 
                          key={kommun} 
                          value={kommun} 
                          className="text-xs"
                          disabled={searchFilters.kommuner?.includes(kommun)}
                        >
                          {kommun} ({preschools.filter(p => p.kommun === kommun).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Huvudman</label>
                <Select value={searchFilters.huvudman || 'all'} onValueChange={value => {
                setSearchFilters({
                  ...searchFilters,
                  huvudman: value === 'all' ? undefined : value
                });
              }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla typer</SelectItem>
                    <SelectItem value="Kommunal">Kommunal</SelectItem>
                    <SelectItem value="Enskild">Fristående</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location button */}
            <Button 
              onClick={handleGetCurrentLocation} 
              variant={userLocation ? "default" : "outline"} 
              size="sm" 
              className="w-full hover-scale transition-all duration-200 font-medium"
              disabled={isLocating}
            >
              {isLocating ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : userLocation ? (
                <Target className="w-4 h-4 mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {isLocating ? "Hämtar position..." : userLocation ? "Position aktiv" : "🎯 Nära mig"}
            </Button>

            {/* Results count and clear all */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {filteredPreschools.length.toLocaleString()} förskolor hittades
              </div>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Rensa allt
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>;
};