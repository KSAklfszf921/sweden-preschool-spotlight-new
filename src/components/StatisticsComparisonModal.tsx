import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, GraduationCap, Star, MapPin } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface StatisticsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsComparisonModal: React.FC<StatisticsComparisonModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { filteredPreschools, preschools, searchFilters } = useMapStore();

  // Calculate statistics for filtered results
  const getFilteredStats = () => {
    if (filteredPreschools.length === 0) return null;

    const totalPreschools = filteredPreschools.length;
    const avgRating = filteredPreschools
      .filter(p => p.google_rating)
      .reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
      filteredPreschools.filter(p => p.google_rating).length;
    
    const avgStaff = filteredPreschools
      .filter(p => p.personaltäthet)
      .reduce((sum, p) => sum + (p.personaltäthet || 0), 0) / 
      filteredPreschools.filter(p => p.personaltäthet).length;
    
    const avgExam = filteredPreschools
      .filter(p => p.andel_med_förskollärarexamen)
      .reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / 
      filteredPreschools.filter(p => p.andel_med_förskollärarexamen).length;

    return {
      count: totalPreschools,
      avgRating: avgRating || 0,
      avgStaff: avgStaff || 0,
      avgExam: avgExam || 0
    };
  };

  // Calculate national statistics
  const getNationalStats = () => {
    if (preschools.length === 0) return null;

    const totalPreschools = preschools.length;
    const avgRating = preschools
      .filter(p => p.google_rating)
      .reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
      preschools.filter(p => p.google_rating).length;
    
    const avgStaff = preschools
      .filter(p => p.personaltäthet)
      .reduce((sum, p) => sum + (p.personaltäthet || 0), 0) / 
      preschools.filter(p => p.personaltäthet).length;
    
    const avgExam = preschools
      .filter(p => p.andel_med_förskollärarexamen)
      .reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / 
      preschools.filter(p => p.andel_med_förskollärarexamen).length;

    return {
      count: totalPreschools,
      avgRating: avgRating || 0,
      avgStaff: avgStaff || 0,
      avgExam: avgExam || 0
    };
  };

  const filteredStats = getFilteredStats();
  const nationalStats = getNationalStats();

  const getFilterTitle = () => {
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) return `Statistik för ${searchFilters.kommuner[0]}`;
    if (searchFilters.radius) return 'Statistik för närområdet';
    if (searchFilters.huvudman) return `Statistik för ${searchFilters.huvudman.toLowerCase()}a förskolor`;
    return 'Statistik för filter';
  };

  const getComparisonIndicator = (filtered: number, national: number) => {
    const diff = filtered - national;
    const percentage = ((diff / national) * 100);
    
    if (Math.abs(percentage) < 2) return { text: 'Liknande', color: 'bg-muted' };
    if (percentage > 0) return { text: `+${percentage.toFixed(1)}%`, color: 'bg-green-500' };
    return { text: `${percentage.toFixed(1)}%`, color: 'bg-red-500' };
  };

  if (!filteredStats || !nationalStats) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {getFilterTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Antal förskolor</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{filteredStats.count}</div>
                <div className="text-xs text-muted-foreground">
                  av {nationalStats.count} totalt
                </div>
              </div>
            </div>
          </Card>

          {/* Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rating Comparison */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Genomsnittligt betyg</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ditt urval:</span>
                    <span className="font-bold">{filteredStats.avgRating.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nationellt:</span>
                    <span className="text-muted-foreground">{nationalStats.avgRating.toFixed(1)}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${getComparisonIndicator(filteredStats.avgRating, nationalStats.avgRating).color}`}
                  >
                    {getComparisonIndicator(filteredStats.avgRating, nationalStats.avgRating).text}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Staff Density Comparison */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Personaltäthet</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ditt urval:</span>
                    <span className="font-bold">{filteredStats.avgStaff.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nationellt:</span>
                    <span className="text-muted-foreground">{nationalStats.avgStaff.toFixed(1)}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${getComparisonIndicator(filteredStats.avgStaff, nationalStats.avgStaff).color}`}
                  >
                    {getComparisonIndicator(filteredStats.avgStaff, nationalStats.avgStaff).text}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Teacher Exam Comparison */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Lärarexamen %</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ditt urval:</span>
                    <span className="font-bold">{filteredStats.avgExam.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nationellt:</span>
                    <span className="text-muted-foreground">{nationalStats.avgExam.toFixed(1)}%</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${getComparisonIndicator(filteredStats.avgExam, nationalStats.avgExam).color}`}
                  >
                    {getComparisonIndicator(filteredStats.avgExam, nationalStats.avgExam).text}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Stäng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};