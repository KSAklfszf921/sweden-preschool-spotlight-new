import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
import { motion } from 'framer-motion';
import { TrendingUp, Users, GraduationCap, Star, Building2, MapPin } from 'lucide-react';

interface StatisticsOverlayProps {
  className?: string;
}

export const StatisticsOverlay: React.FC<StatisticsOverlayProps> = ({ className }) => {
  const { 
    filteredPreschools, 
    visiblePreschools, 
    preschools,
    selectedCommune,
    mapZoom
  } = useMapStore();

  // Calculate live statistics
  const stats = useMemo(() => {
    const dataSource = mapZoom > 6 ? visiblePreschools : filteredPreschools;
    
    if (dataSource.length === 0) {
      return {
        total: 0,
        avgChildren: 0,
        avgStaff: 0,
        avgTeacherExam: 0,
        avgRating: 0,
        kommunal: 0,
        enskild: 0,
        withRating: 0
      };
    }

    const validChildren = dataSource.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = dataSource.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = dataSource.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = dataSource.filter(p => p.google_rating).map(p => p.google_rating!);

    return {
      total: dataSource.length,
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? (validStaff.reduce((a, b) => a + b, 0) / validStaff.length) : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? (validRating.reduce((a, b) => a + b, 0) / validRating.length) : 0,
      kommunal: dataSource.filter(p => p.huvudman === 'Kommunal').length,
      enskild: dataSource.filter(p => p.huvudman === 'Enskild').length,
      withRating: validRating.length
    };
  }, [filteredPreschools, visiblePreschools, mapZoom]);

  // National averages for comparison
  const nationalStats = useMemo(() => {
    if (preschools.length === 0) return null;
    
    const validChildren = preschools.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = preschools.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = preschools.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = preschools.filter(p => p.google_rating).map(p => p.google_rating!);

    return {
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? (validStaff.reduce((a, b) => a + b, 0) / validStaff.length) : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? (validRating.reduce((a, b) => a + b, 0) / validRating.length) : 0,
    };
  }, [preschools]);

  const getComparisonIndicator = (current: number, national: number) => {
    if (current > national * 1.1) return { color: 'text-green-500', icon: '↗' };
    if (current < national * 0.9) return { color: 'text-red-500', icon: '↘' };
    return { color: 'text-blue-500', icon: '→' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-20 left-4 z-60 ${className}`}
    >
      <Card className="bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 p-4 w-80">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Live Statistik</h3>
          <Badge variant="secondary" className="text-xs">
            {mapZoom > 6 ? 'Synliga' : 'Filtrerade'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Count */}
          <div className="col-span-2 p-3 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Förskolor</span>
              </div>
              <div className="text-lg font-bold text-primary">
                {stats.total.toLocaleString()}
              </div>
            </div>
            {selectedCommune && (
              <div className="text-xs text-muted-foreground mt-1">
                i {selectedCommune}
              </div>
            )}
          </div>

          {/* Average Children */}
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium">Snitt Barn</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">{stats.avgChildren}</span>
              {nationalStats && (
                <span className={`text-xs ${getComparisonIndicator(stats.avgChildren, nationalStats.avgChildren).color}`}>
                  {getComparisonIndicator(stats.avgChildren, nationalStats.avgChildren).icon}
                </span>
              )}
            </div>
          </div>

          {/* Staff Density */}
          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium">Personal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600">{stats.avgStaff.toFixed(1)}</span>
              {nationalStats && (
                <span className={`text-xs ${getComparisonIndicator(stats.avgStaff, nationalStats.avgStaff).color}`}>
                  {getComparisonIndicator(stats.avgStaff, nationalStats.avgStaff).icon}
                </span>
              )}
            </div>
          </div>

          {/* Teacher Exam */}
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium">Lärarexamen</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-600">{stats.avgTeacherExam}%</span>
              {nationalStats && (
                <span className={`text-xs ${getComparisonIndicator(stats.avgTeacherExam, nationalStats.avgTeacherExam).color}`}>
                  {getComparisonIndicator(stats.avgTeacherExam, nationalStats.avgTeacherExam).icon}
                </span>
              )}
            </div>
          </div>

          {/* Google Rating */}
          <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium">Betyg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-yellow-600">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.withRating}/{stats.total}
              </span>
            </div>
          </div>

          {/* Operator Distribution */}
          <div className="col-span-2 p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3 w-3 text-indigo-600" />
              <span className="text-xs font-medium">Huvudman</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs">Kommunal:</span>
                <span className="font-semibold text-green-600">{stats.kommunal}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs">Enskild:</span>
                <span className="font-semibold text-blue-600">{stats.enskild}</span>
              </div>
            </div>
          </div>
        </div>

        {nationalStats && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Jämfört med rikssnitt • {preschools.length.toLocaleString()} förskolor totalt
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};