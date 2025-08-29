import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useComparisonStore } from '@/stores/comparisonStore';
import { BarChart3, X, TrendingUp, Users, Award, Star } from 'lucide-react';

export const ComparisonPanel: React.FC = () => {
  const { selectedPreschools, removeFromComparison, clearComparison, setIsOpen } = useComparisonStore();
  const [showPreview, setShowPreview] = useState(false);

  if (selectedPreschools.length === 0) return null;

  const getAverage = (field: keyof typeof selectedPreschools[0]) => {
    const values = selectedPreschools
      .map(p => p[field])
      .filter(v => v !== null && v !== undefined) as number[];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const avgChildren = getAverage('antal_barn');
  const avgStaff = getAverage('personaltäthet');
  const avgExam = getAverage('andel_med_förskollärarexamen');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Jämförelse
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 w-6 p-0"
              >
                <TrendingUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearComparison}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Preview */}
          {showPreview && selectedPreschools.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 bg-muted/30 rounded-md space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Snitt barn:
                </span>
                <span className="font-medium">{avgChildren.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Personal:
                </span>
                <span className="font-medium">{avgStaff.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Examen:
                </span>
                <span className="font-medium">{avgExam.toFixed(0)}%</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-2 mb-4">
            {selectedPreschools.map((preschool) => (
              <div key={preschool.id} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{preschool.namn}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">{preschool.kommun}</p>
                    {preschool.google_rating && (
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        ★ {preschool.google_rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromComparison(preschool.id)}
                  className="h-5 w-5 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {selectedPreschools.length}/5
            </Badge>
            {selectedPreschools.length >= 2 && (
              <Button
                onClick={() => setIsOpen(true)}
                size="sm"
                className="text-xs"
              >
                Jämför {selectedPreschools.length} förskolor
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};