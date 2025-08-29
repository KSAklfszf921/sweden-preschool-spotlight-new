import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  X, 
  MapPin, 
  Building, 
  Users,
  Clock,
  Filter
} from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { Preschool } from '@/stores/mapStore';

interface SearchSuggestion {
  type: 'name' | 'address' | 'municipality' | 'category';
  value: string;
  label: string;
  count?: number;
  icon: any;
}

export const AdvancedSearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    preschools, 
    setSearchFilters,
    searchFilters
  } = useMapStore();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, preschools]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSuggestions = () => {
    const query = searchQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Search by preschool name
    const nameMatches = preschools
      .filter(p => p.namn.toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({
        type: 'name' as const,
        value: p.namn,
        label: p.namn,
        icon: Building
      }));

    // Search by municipality
    const municipalities = [...new Set(preschools.map(p => p.kommun))]
      .filter(m => m.toLowerCase().includes(query))
      .slice(0, 3)
      .map(m => ({
        type: 'municipality' as const,
        value: m,
        label: `${m} kommun`,
        count: preschools.filter(p => p.kommun === m).length,
        icon: MapPin
      }));

    // Search by address
    const addressMatches = preschools
      .filter(p => p.adress?.toLowerCase().includes(query))
      .slice(0, 3)
      .map(p => ({
        type: 'address' as const,
        value: p.adress,
        label: p.adress,
        icon: MapPin
      }));

    newSuggestions.push(...nameMatches, ...municipalities, ...addressMatches);
    setSuggestions(newSuggestions);
  };

  const handleSearch = (value: string) => {
    setSearchFilters({ query: value });
    setSearchQuery(value);
    
    // Save to recent searches
    const updated = [value, ...recentSearches.filter(s => s !== value)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilters({ query: '' });
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          data-search-trigger
          placeholder="Sök förskola, kommun eller adress..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Search suggestions */}
            {suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Sökförslag
                </h4>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full justify-start h-auto p-2 text-left"
                    >
                      <suggestion.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{suggestion.label}</span>
                          {suggestion.count && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent searches */}
            {recentSearches.length > 0 && suggestions.length === 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Senaste sökningar
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs h-auto p-1"
                  >
                    Rensa
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleSearch(search)}
                      className="w-full justify-start h-auto p-2"
                    >
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick filters */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Snabbfilter
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSearch('kommunal')}
                >
                  Kommunala förskolor
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSearch('enskild')}
                >
                  Enskilda förskolor
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSearch('Stockholm')}
                >
                  Stockholm
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSearch('Göteborg')}
                >
                  Göteborg
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};