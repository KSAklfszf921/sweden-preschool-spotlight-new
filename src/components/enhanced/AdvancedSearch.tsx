import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMapStore } from '@/stores/mapStore';
import { Search, MapPin, Filter, Star, Users, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ isOpen, onClose }) => {
  const { searchFilters, setSearchFilters, preschools } = useMapStore();
  
  const [localFilters, setLocalFilters] = useState({
    minChildren: 0,
    maxChildren: 200,
    minStaff: 0,
    maxStaff: 10,
    minExam: 0,
    maxExam: 100,
    minRating: 0,
    maxRating: 5,
    hasGoogleRating: false,
    hasContact: false,
    sortBy: 'namn' as 'namn' | 'antal_barn' | 'google_rating' | 'andel_med_förskollärarexamen',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  const uniqueKommuner = [...new Set(preschools.map(p => p.kommun))].sort();

  const applyFilters = () => {
    setSearchFilters({
      ...searchFilters,
      minChildren: localFilters.minChildren > 0 ? localFilters.minChildren : undefined,
      maxChildren: localFilters.maxChildren < 200 ? localFilters.maxChildren : undefined,
      minStaff: localFilters.minStaff > 0 ? localFilters.minStaff : undefined,
      maxStaff: localFilters.maxStaff < 10 ? localFilters.maxStaff : undefined,
      minExam: localFilters.minExam > 0 ? localFilters.minExam : undefined,
      maxExam: localFilters.maxExam < 100 ? localFilters.maxExam : undefined,
      minRating: localFilters.minRating > 0 ? localFilters.minRating : undefined,
      maxRating: localFilters.maxRating < 5 ? localFilters.maxRating : undefined,
      hasGoogleRating: localFilters.hasGoogleRating || undefined,
      hasContact: localFilters.hasContact || undefined,
      sortBy: localFilters.sortBy,
      sortOrder: localFilters.sortOrder
    });
    onClose();
  };

  const resetFilters = () => {
    setLocalFilters({
      minChildren: 0,
      maxChildren: 200,
      minStaff: 0,
      maxStaff: 10,
      minExam: 0,
      maxExam: 100,
      minRating: 0,
      maxRating: 5,
      hasGoogleRating: false,
      hasContact: false,
      sortBy: 'namn',
      sortOrder: 'asc'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Search className="w-5 h-5" />
                Avancerad sökning
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Numerical Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" />
                    Antal barn: {localFilters.minChildren} - {localFilters.maxChildren}
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localFilters.minChildren, localFilters.maxChildren]}
                      onValueChange={([min, max]) => 
                        setLocalFilters(prev => ({ ...prev, minChildren: min, maxChildren: max }))
                      }
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4" />
                    Personaltäthet: {localFilters.minStaff} - {localFilters.maxStaff}
                  </Label>
                  <Slider
                    value={[localFilters.minStaff, localFilters.maxStaff]}
                    onValueChange={([min, max]) => 
                      setLocalFilters(prev => ({ ...prev, minStaff: min, maxStaff: max }))
                    }
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" />
                    Lärarexamen: {localFilters.minExam}% - {localFilters.maxExam}%
                  </Label>
                  <Slider
                    value={[localFilters.minExam, localFilters.maxExam]}
                    onValueChange={([min, max]) => 
                      setLocalFilters(prev => ({ ...prev, minExam: min, maxExam: max }))
                    }
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4" />
                    Google-betyg: {localFilters.minRating} - {localFilters.maxRating}
                  </Label>
                  <Slider
                    value={[localFilters.minRating, localFilters.maxRating]}
                    onValueChange={([min, max]) => 
                      setLocalFilters(prev => ({ ...prev, minRating: min, maxRating: max }))
                    }
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Har Google-betyg</Label>
                  <Switch
                    checked={localFilters.hasGoogleRating}
                    onCheckedChange={(checked) => 
                      setLocalFilters(prev => ({ ...prev, hasGoogleRating: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Har kontaktuppgifter</Label>
                  <Switch
                    checked={localFilters.hasContact}
                    onCheckedChange={(checked) => 
                      setLocalFilters(prev => ({ ...prev, hasContact: checked }))
                    }
                  />
                </div>
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Sortera efter</Label>
                  <Select
                    value={localFilters.sortBy}
                    onValueChange={(value: any) => 
                      setLocalFilters(prev => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="namn">Namn</SelectItem>
                      <SelectItem value="antal_barn">Antal barn</SelectItem>
                      <SelectItem value="google_rating">Google-betyg</SelectItem>
                      <SelectItem value="andel_med_förskollärarexamen">Lärarexamen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Sorteringsordning</Label>
                  <Select
                    value={localFilters.sortOrder}
                    onValueChange={(value: any) => 
                      setLocalFilters(prev => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Stigande</SelectItem>
                      <SelectItem value="desc">Fallande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={resetFilters}>
                Återställ filter
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Avbryt
                </Button>
                <Button onClick={applyFilters}>
                  Tillämpa filter
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};