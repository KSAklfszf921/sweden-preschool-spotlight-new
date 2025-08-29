import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, X, TrendingUp, Users, Award, Star, Building, MapPin } from 'lucide-react';
import { useMapStore, CommuneStats } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';

interface StatisticsPanelProps {
  className?: string;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ className }) => {
  const {
    showStatistics,
    statisticsData,
    selectedCommune,
    setShowStatistics,
    setStatisticsData,
    setSelectedCommune,
  } = useMapStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showStatistics && !statisticsData) {
      fetchStatistics();
    }
  }, [showStatistics]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Get total count
      const { data: totalData, error: totalError } = await supabase
        .from('Förskolor')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      // Get commune statistics
      const { data: communeData, error: communeError } = await supabase
        .from('Förskolor')
        .select('*')
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null);

      if (communeError) throw communeError;

      // Process commune statistics
      const communeStats: Record<string, CommuneStats> = {};
      
      communeData?.forEach((item: any) => {
        const kommun = item.Kommun;
        if (!communeStats[kommun]) {
          communeStats[kommun] = {
            kommun,
            count: 0,
            avg_staff_density: 0,
            avg_teacher_exam: 0,
            avg_google_rating: 0,
          };
        }
        
        communeStats[kommun].count++;
        if (item.Personaltäthet) {
          communeStats[kommun].avg_staff_density += item.Personaltäthet;
        }
        if (item['Andel med förskollärarexamen']) {
          communeStats[kommun].avg_teacher_exam += item['Andel med förskollärarexamen'];
        }
      });

      // Calculate averages
      const processedStats = Object.values(communeStats).map(stat => ({
        ...stat,
        avg_staff_density: stat.avg_staff_density / stat.count,
        avg_teacher_exam: stat.avg_teacher_exam / stat.count,
      })).sort((a, b) => b.count - a.count);

      setStatisticsData({
        totalPreschools: totalData?.length || 0,
        communeStats: processedStats,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topCommunes = statisticsData?.communeStats.slice(0, 10) || [];
  const selectedCommuneData = statisticsData?.communeStats.find(
    c => c.kommun === selectedCommune
  );

  const chartColors = ['hsl(var(--primary))', 'hsl(var(--nordic-blue))', 'hsl(var(--swedish-flag))'];

  return (
    <AnimatePresence>
      {showStatistics && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed left-4 top-20 bottom-4 w-96 z-60 ${className}`}
        >
          <Card className="h-full bg-card/95 backdrop-blur-sm border-border/50 shadow-nordic overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Statistik Dashboard</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatistics(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="overflow-y-auto h-full pb-20">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Laddar statistik...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Totalt</p>
                          <p className="text-lg font-bold text-foreground">
                            {statisticsData?.totalPreschools.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-nordic-blue" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kommuner</p>
                          <p className="text-lg font-bold text-foreground">
                            {statisticsData?.communeStats.length}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Selected Commune Details */}
                  {selectedCommuneData && (
                    <Card className="p-4 border-primary">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">
                          {selectedCommuneData.kommun}
                        </h3>
                        <Badge variant="secondary">Vald kommun</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Förskolor</p>
                          <p className="font-semibold text-foreground">{selectedCommuneData.count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Personaltäthet</p>
                          <p className="font-semibold text-foreground">
                            {selectedCommuneData.avg_staff_density.toFixed(1)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-1">Lärarexamen %</p>
                          <Progress 
                            value={selectedCommuneData.avg_teacher_exam} 
                            className="h-2"
                          />
                          <p className="text-xs text-right mt-1 text-muted-foreground">
                            {selectedCommuneData.avg_teacher_exam.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Top Communes Chart */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Största Kommuner
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topCommunes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="kommun" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--primary))"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Quality Distribution */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Kvalitetsfördelning
                    </h3>
                    <div className="space-y-3">
                      {topCommunes.slice(0, 5).map((commune, index) => (
                        <div key={commune.kommun} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{commune.kommun}</span>
                            <span className="text-muted-foreground">
                              {commune.avg_teacher_exam.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={commune.avg_teacher_exam} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Staff Density Comparison */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personaltäthet Jämförelse
                    </h3>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={topCommunes.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="kommun" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          angle={-45}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg_staff_density" 
                          stroke="hsl(var(--nordic-blue))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--nordic-blue))', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCommune(null)}
                      className="w-full"
                    >
                      Rensa vald kommun
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchStatistics}
                      className="w-full"
                      disabled={loading}
                    >
                      Uppdatera statistik
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatisticsPanel;