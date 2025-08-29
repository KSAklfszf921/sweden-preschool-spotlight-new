import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Filter, RotateCcw, Navigation, Settings, Clock, ChevronDown, ChevronUp, Minus, Plus, Star, Users, Award, SlidersHorizontal, BookOpen, Home, Route, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMapStore } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilters } from '@/components/SearchFilters';
import { DistanceFilter } from '@/components/filters/DistanceFilter';
import { AdvancedSearch } from '@/components/enhanced/AdvancedSearch';
import { TravelTimeCalculator } from '@/components/enhanced/TravelTimeCalculator';

const SmartSearchBar: React.FC = () => {
  const { 
    preschools, 
    searchFilters, 
    setSearchFilters, 
    clearFilters, 
    setMapCenter, 
    setMapZoom, 
    filteredPreschools,
    setSelectedPreschool 
  } = useMapStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [radius, setRadius] = useState([2]);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showTravelTimes, setShowTravelTimes] = useState(false);
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    minChildren: [0],
    maxChildren: [200],
    minStaff: [0],
    maxStaff: [10],
    minExam: [0],
    maxExam: [100],
    minRating: [0],
    maxRating: [5],
    hasGoogleRating: false,
    hasContact: false,
    sortBy: 'namn' as 'namn' | 'antal_barn' | 'google_rating' | 'andel_med_förskollärarexamen',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get unique values for filters
  const uniqueKommuner = [...new Set(preschools.map(p => p.kommun))].filter(Boolean).sort();
  const uniqueHuvudman = [...new Set(preschools.map(p => p.huvudman))].filter(Boolean).sort();

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsLoading(true);
      
      // Generate suggestions based on search query
      const filteredKommuner = uniqueKommuner.filter(kommun => 
        kommun.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

      const filteredPreschools = preschools
        .filter(p => p.namn.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(p => p.namn);

      setSuggestions([...filteredKommuner, ...filteredPreschools]);
      setShowSuggestions(true);
      setIsLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [searchQuery, preschools, uniqueKommuner]);

  // Separate effect for applying search filters to avoid infinite loops
  useEffect(() => {
    if (searchQuery.length > 0) {
      const kommun = uniqueKommuner.find(k => 
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (kommun) {
        setSearchFilters({ kommuner: [kommun] });
      } else {
        const matchingPreschools = preschools.filter(p => 
          p.namn.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matchingPreschools.length > 0) {
          setSearchFilters({ query: searchQuery });
        }
      }
    }
  }, [searchQuery, setSearchFilters]); // Fixed dependencies

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearFilters();
    setUserLocation(null);
    setAdvancedFilters({
      minChildren: [0],
      maxChildren: [200],
      minStaff: [0],
      maxStaff: [10],
      minExam: [0],
      maxExam: [100],
      minRating: [0],
      maxRating: [5],
      hasGoogleRating: false,
      hasContact: false,
      sortBy: 'namn',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = () => {
    return Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      return value !== undefined && value !== null && 
        (Array.isArray(value) ? value.length > 0 : 
         typeof value === 'string' ? value.length > 0 : 
         typeof value === 'boolean' ? value : true);
    });
  };

  const handleLocationSearch = () => {
    if (searchQuery.toLowerCase() === 'min position' || searchQuery.toLowerCase() === 'min plats') {
      handleGetCurrentLocation();
    } else {
      // Regular search functionality
      const kommun = uniqueKommuner.find(k => 
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (kommun) {
        setSearchFilters({ kommuner: [kommun] });
      } else {
        setSearchFilters({ query: searchQuery });
      }
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const center: [number, number] = [longitude, latitude];
        
        setUserLocation({ lat: latitude, lng: longitude });
        setMapCenter(center);
        setMapZoom(12);
        setSearchFilters({ 
          radius: radius[0] * 1000,
          center: center,
          nearbyMode: true
        });
        setIsLocating(false);
        setActiveTab('location');
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('Kunde inte hämta din position. Kontrollera att du tillåter platsåtkomst.');
      }
    );
  };

  const updateRadius = (newRadius: number[]) => {
    setRadius(newRadius);
    if (userLocation) {
      setSearchFilters({ 
        ...searchFilters,
        radius: newRadius[0] * 1000,
        center: [userLocation.lng, userLocation.lat],
        nearbyMode: true
      });
    }
  };

  const applyAdvancedFilters = () => {
    setSearchFilters({
      ...searchFilters,
      minChildren: advancedFilters.minChildren[0] > 0 ? advancedFilters.minChildren[0] : undefined,
      maxChildren: advancedFilters.maxChildren[0] < 200 ? advancedFilters.maxChildren[0] : undefined,
      minStaff: advancedFilters.minStaff[0] > 0 ? advancedFilters.minStaff[0] : undefined,
      maxStaff: advancedFilters.maxStaff[0] < 10 ? advancedFilters.maxStaff[0] : undefined,
      minExam: advancedFilters.minExam[0] > 0 ? advancedFilters.minExam[0] : undefined,
      maxExam: advancedFilters.maxExam[0] < 100 ? advancedFilters.maxExam[0] : undefined,
      minRating: advancedFilters.minRating[0] > 0 ? advancedFilters.minRating[0] : undefined,
      maxRating: advancedFilters.maxRating[0] < 5 ? advancedFilters.maxRating[0] : undefined,
      hasGoogleRating: advancedFilters.hasGoogleRating || undefined,
      hasContact: advancedFilters.hasContact || undefined,
      sortBy: advancedFilters.sortBy,
      sortOrder: advancedFilters.sortOrder
    });
  };

  const filterCount = Object.keys(searchFilters).filter(key => 
    searchFilters[key as keyof typeof searchFilters] !== undefined
  ).length;

  // Minimized view
  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-4 top-4 z-30"
      >
        <Card className="glass-search border-0 shadow-lg card-hover">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsExpanded(true)}
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover-scale transition-all duration-200 font-heading"
              >
                <Search className="h-4 w-4 mr-1 text-primary" />
                <span className="text-sm font-medium">Sök & Filter</span>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {filterCount}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              {hasActiveFilters() && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Rensa alla filter"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredPreschools.length.toLocaleString()} förskolor
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Expanded view
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-4 z-30 w-96"
    >
      <Card className="glass-search border-0 shadow-lg card-hover">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-lg">Sök & Filter</h3>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="h-5">
                  {filterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters() && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Rensa alla filter"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Main Search */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Sök förskolor, kommuner, 'min position'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLocationSearch();
                    }
                  }}
                  className="pl-10 pr-10 border-0 focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleLocationSearch}
                size="sm"
                variant="default"
                className="h-10 px-3"
                disabled={isLocating}
              >
                {isLocating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleGetCurrentLocation}
                variant={userLocation ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                disabled={isLocating}
              >
                {isLocating ? (
                  <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                ) : (
                  <Navigation className="w-3 h-3 mr-1" />
                )}
                {isLocating ? "Hämtar..." : userLocation ? "Position OK" : "Min position"}
              </Button>
              <Button
                onClick={() => setShowAdvancedSearch(true)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <SlidersHorizontal className="h-3 w-3 mr-1" />
                Avancerat
              </Button>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="search" className="text-xs">
                <Search className="w-3 h-3 mr-1" />
                Sök
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                Plats
              </TabsTrigger>
              <TabsTrigger value="filters" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Verktyg
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kommun</label>
                <Select
                  value={searchFilters.kommuner?.[0] || 'all'}
                  onValueChange={(value) => {
                    setSearchFilters({ ...searchFilters, kommuner: value === 'all' ? undefined : [value] });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj kommun" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-lg max-h-60 overflow-y-auto z-50">
                    <SelectItem value="all">Alla kommuner</SelectItem>
                    {uniqueKommuner.slice(0, 50).map(kommun => (
                      <SelectItem key={kommun} value={kommun} className="text-xs">
                        {kommun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Huvudman</label>
                <Select
                  value={searchFilters.huvudman || 'all'}
                  onValueChange={(value) => {
                    setSearchFilters({ ...searchFilters, huvudman: value === 'all' ? undefined : value });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj typ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-lg z-50">
                    <SelectItem value="all">Alla typer</SelectItem>
                    <SelectItem value="Kommunal">Kommunal</SelectItem>
                    <SelectItem value="Enskild">Fristående</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-3 mt-3">
              {userLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Target className="w-4 h-4" />
                    Position hämtad
                  </div>
                  
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Sökradie: {radius[0]} km
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => updateRadius([Math.max(0.5, radius[0] - 0.5)])}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => updateRadius([Math.min(10, radius[0] + 0.5)])}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={radius}
                      onValueChange={updateRadius}
                      max={10}
                      min={0.5}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={() => setShowTravelTimes(!showTravelTimes)}
                    variant={showTravelTimes ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                  >
                    <Route className="w-3 h-3 mr-1" />
                    {showTravelTimes ? "Dölj restider" : "Visa restider"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Aktivera platsåtkomst för närliggande förskolor
                  </p>
                  <Button onClick={handleGetCurrentLocation} size="sm" className="w-full">
                    <Navigation className="w-3 h-3 mr-1" />
                    Hämta min position
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="filters" className="space-y-3 mt-3">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                    <Users className="w-3 h-3" />
                    Barn: {advancedFilters.minChildren[0]} - {advancedFilters.maxChildren[0]}
                  </Label>
                  <Slider
                    value={[advancedFilters.minChildren[0], advancedFilters.maxChildren[0]]}
                    onValueChange={([min, max]) => {
                      setAdvancedFilters(prev => ({ 
                        ...prev, 
                        minChildren: [min], 
                        maxChildren: [max] 
                      }));
                      applyAdvancedFilters();
                    }}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3" />
                    Betyg: {advancedFilters.minRating[0]} - {advancedFilters.maxRating[0]}
                  </Label>
                  <Slider
                    value={[advancedFilters.minRating[0], advancedFilters.maxRating[0]]}
                    onValueChange={([min, max]) => {
                      setAdvancedFilters(prev => ({ 
                        ...prev, 
                        minRating: [min], 
                        maxRating: [max] 
                      }));
                      applyAdvancedFilters();
                    }}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Google-betyg</Label>
                    <Switch
                      checked={advancedFilters.hasGoogleRating}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({ ...prev, hasGoogleRating: checked }));
                        applyAdvancedFilters();
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Kontakt</Label>
                    <Switch
                      checked={advancedFilters.hasContact}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters(prev => ({ ...prev, hasContact: checked }));
                        applyAdvancedFilters();
                      }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowAdvancedSearch(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <SlidersHorizontal className="w-3 h-3 mr-1" />
                  Avancerat
                </Button>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Återställ
                </Button>
              </div>
              
              {userLocation && (
                <DistanceFilter 
                  userLocation={userLocation}
                  onLocationRequest={handleGetCurrentLocation}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Results summary */}
          <div className="pt-3 mt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resultat:</span>
              <span className="font-medium text-foreground">
                {filteredPreschools.length.toLocaleString()} förskolor
              </span>
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters() && (
            <div className="space-y-2 mt-3">
              <div className="flex flex-wrap gap-1">
                {searchFilters.query && (
                  <Badge variant="secondary" className="text-xs">
                    Sök: {searchFilters.query}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchFilters({ ...searchFilters, query: undefined })}
                      className="ml-1 h-3 w-3 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Kommuner: {searchFilters.kommuner.length}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchFilters({ ...searchFilters, kommuner: undefined })}
                      className="ml-1 h-3 w-3 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                {searchFilters.nearbyMode && (
                  <Badge variant="secondary" className="text-xs">
                    I närheten ({radius[0]} km)
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSearchFilters({ ...searchFilters, nearbyMode: false, center: undefined, radius: undefined });
                        setUserLocation(null);
                      }}
                      className="ml-1 h-3 w-3 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Travel Times Panel */}
      <AnimatePresence>
        {showTravelTimes && userLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2"
          >
            <TravelTimeCalculator userLocation={userLocation} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />

      {/* Search suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 z-40"
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border/20 last:border-0"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                    setSearchFilters({ ...searchFilters, query: suggestion });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export { SmartSearchBar };