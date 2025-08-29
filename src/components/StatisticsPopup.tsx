import React, { useState, useMemo } from 'react';
import { BarChart3, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
interface StatisticsPopupProps {
  className?: string;
}
export const StatisticsPopup: React.FC<StatisticsPopupProps> = ({
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    preschools,
    filteredPreschools,
    visiblePreschools,
    searchFilters,
    mapZoom
  } = useMapStore();

  // Calculate statistics based on context
  const stats = useMemo(() => {
    const currentPreschools = mapZoom > 8 ? visiblePreschools : filteredPreschools;
    if (currentPreschools.length === 0) return null;
    const totalChildren = currentPreschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0);
    const avgChildren = totalChildren / currentPreschools.length;
    const withStaff = currentPreschools.filter(p => p.personaltäthet && p.personaltäthet > 0);
    const avgStaff = withStaff.length > 0 ? withStaff.reduce((sum, p) => sum + p.personaltäthet!, 0) / withStaff.length : 0;
    const withExam = currentPreschools.filter(p => p.andel_med_förskollärarexamen != null);
    const avgExam = withExam.length > 0 ? withExam.reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / withExam.length : 0;
    const municipal = currentPreschools.filter(p => p.huvudman === 'Kommunal').length;
    const privatCount = currentPreschools.filter(p => p.huvudman === 'Enskild').length;
    return {
      total: currentPreschools.length,
      avgChildren: Math.round(avgChildren),
      avgStaff: Number(avgStaff.toFixed(1)),
      avgExam: Math.round(avgExam),
      municipal,
      privatCount
    };
  }, [filteredPreschools, visiblePreschools, mapZoom]);

  // National averages for comparison
  const nationalStats = useMemo(() => {
    if (preschools.length === 0) return null;
    const totalChildren = preschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0);
    const avgChildren = totalChildren / preschools.length;
    const withStaff = preschools.filter(p => p.personaltäthet && p.personaltäthet > 0);
    const avgStaff = withStaff.length > 0 ? withStaff.reduce((sum, p) => sum + p.personaltäthet!, 0) / withStaff.length : 0;
    const withExam = preschools.filter(p => p.andel_med_förskollärarexamen != null);
    const avgExam = withExam.length > 0 ? withExam.reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / withExam.length : 0;
    return {
      avgChildren: Math.round(avgChildren),
      avgStaff: Number(avgStaff.toFixed(1)),
      avgExam: Math.round(avgExam)
    };
  }, [preschools]);
  const getComparisonIcon = (current: number, national: number, higherIsBetter: boolean = true) => {
    const diff = Math.abs(current - national);
    if (diff < national * 0.05) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const isHigher = current > national;
    const isGood = higherIsBetter ? isHigher : !isHigher;
    return isGood ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-orange-500" />;
  };
  const getContextTitle = () => {
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      return `${searchFilters.kommuner[0]} vs Riket`;
    }
    if (mapZoom > 8) {
      return 'Synliga vs Riket';
    }
    return 'Aktuellt urval vs Riket';
  };
  if (!stats || !nationalStats) return null;
  return <div className={`fixed bottom-4 right-4 z-60 ${className}`}>
      <AnimatePresence mode="wait">
        {!isOpen ? <motion.div key="button" initial={{
        scale: 0.9,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} exit={{
        scale: 0.9,
        opacity: 0
      }} transition={{
        duration: 0.2
      }}>
            
          </motion.div> : <motion.div key="popup" initial={{
        scale: 0.9,
        opacity: 0,
        y: 20
      }} animate={{
        scale: 1,
        opacity: 1,
        y: 0
      }} exit={{
        scale: 0.9,
        opacity: 0,
        y: 20
      }} transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}>
            <Card className="w-80 p-4 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <h3 className="font-medium text-sm">{getContextTitle()}</h3>
                </div>
                <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon" className="w-6 h-6 rounded-full">
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Förskolor</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.total}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Barn/förskola</span>
                    <div className="flex items-center gap-1">
                      {getComparisonIcon(stats.avgChildren, nationalStats.avgChildren)}
                      <span className="text-sm font-medium">{stats.avgChildren}</span>
                      <span className="text-xs text-muted-foreground">({nationalStats.avgChildren})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personaltäthet</span>
                    <div className="flex items-center gap-1">
                      {getComparisonIcon(stats.avgStaff, nationalStats.avgStaff)}
                      <span className="text-sm font-medium">{stats.avgStaff}</span>
                      <span className="text-xs text-muted-foreground">({nationalStats.avgStaff})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lärarexamen %</span>
                    <div className="flex items-center gap-1">
                      {getComparisonIcon(stats.avgExam, nationalStats.avgExam)}
                      <span className="text-sm font-medium">{stats.avgExam}%</span>
                      <span className="text-xs text-muted-foreground">({nationalStats.avgExam}%)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Huvudman</div>
                  <div className="flex justify-between">
                    <div className="text-center">
                      <div className="text-sm font-medium">{stats.municipal}</div>
                      <div className="text-xs text-muted-foreground">Kommunal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{stats.privatCount}</div>
                      <div className="text-xs text-muted-foreground">Enskild</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>}
      </AnimatePresence>
    </div>;
};