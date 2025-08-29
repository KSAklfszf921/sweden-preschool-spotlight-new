import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComparisonStore } from '@/stores/comparisonStore';
import { BarChart3, Users, GraduationCap, Star, MapPin, Building } from 'lucide-react';

export const ComparisonModal: React.FC = () => {
  const { selectedPreschools, isOpen, setIsOpen, clearComparison } = useComparisonStore();

  const getMetricColor = (value: number, allValues: number[], higherIsBetter = true) => {
    const min = Math.min(...allValues.filter(v => v > 0));
    const max = Math.max(...allValues.filter(v => v > 0));
    
    if (min === max) return 'bg-muted';
    
    const normalized = (value - min) / (max - min);
    const score = higherIsBetter ? normalized : 1 - normalized;
    
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen || selectedPreschools.length < 2) return null;

  const allRatings = selectedPreschools.map(p => p.google_rating || 0);
  const allStaff = selectedPreschools.map(p => p.personaltäthet || 0);
  const allExam = selectedPreschools.map(p => p.andel_med_förskollärarexamen || 0);
  const allChildren = selectedPreschools.map(p => p.antal_barn || 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Jämför {selectedPreschools.length} förskolor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Förskola</th>
                  <th className="text-left p-3 font-semibold">Huvudman</th>
                  <th className="text-left p-3 font-semibold">Kommun</th>
                  <th className="text-left p-3 font-semibold">Barn</th>
                </tr>
              </thead>
              <tbody>
                {selectedPreschools.map((preschool) => (
                  <tr key={preschool.id} className="border-b">
                    <td className="p-3 font-medium">{preschool.namn}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{preschool.huvudman}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{preschool.kommun}</td>
                    <td className="p-3">{preschool.antal_barn || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Metrics comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating comparison */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Google betyg
              </h3>
              <div className="space-y-3">
                {selectedPreschools.map((preschool) => (
                  <div key={preschool.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate pr-2">{preschool.namn}</span>
                      <span className="text-sm font-bold">
                        {preschool.google_rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    {preschool.google_rating && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getMetricColor(preschool.google_rating, allRatings)}`}
                          style={{ width: `${(preschool.google_rating / 5) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Staff density comparison */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Personaltäthet
              </h3>
              <div className="space-y-3">
                {selectedPreschools.map((preschool) => (
                  <div key={preschool.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate pr-2">{preschool.namn}</span>
                      <span className="text-sm font-bold">
                        {preschool.personaltäthet?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    {preschool.personaltäthet && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getMetricColor(preschool.personaltäthet, allStaff)}`}
                          style={{ width: `${Math.min((preschool.personaltäthet / Math.max(...allStaff)) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Teacher exam comparison */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-500" />
                Lärarexamen %
              </h3>
              <div className="space-y-3">
                {selectedPreschools.map((preschool) => (
                  <div key={preschool.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate pr-2">{preschool.namn}</span>
                      <span className="text-sm font-bold">
                        {preschool.andel_med_förskollärarexamen?.toFixed(0)}% || 'N/A'
                      </span>
                    </div>
                    {preschool.andel_med_förskollärarexamen && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getMetricColor(preschool.andel_med_förskollärarexamen, allExam)}`}
                          style={{ width: `${preschool.andel_med_förskollärarexamen}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-between">
            <Button onClick={clearComparison} variant="outline">
              Rensa jämförelse
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="default">
              Stäng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};