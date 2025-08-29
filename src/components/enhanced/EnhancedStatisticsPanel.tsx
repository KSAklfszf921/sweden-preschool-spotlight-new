import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { BarChart3, X, TrendingUp, Users, Award, Star, Building, MapPin, Target, Zap, ArrowUpDown } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface EnhancedStatisticsPanelProps {
  className?: string;
}

const EnhancedStatisticsPanel: React.FC<EnhancedStatisticsPanelProps> = ({ className }) => {
  const {
    showStatistics,
    setShowStatistics,
    filteredPreschools,
    preschools,
    searchFilters,
    selectedCommune
  } = useMapStore();

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const currentData = filteredPreschools;
    const allData = preschools;

    if (currentData.length === 0 || allData.length === 0) return null;

    // Current selection stats
    const validChildren = currentData.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = currentData.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = currentData.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = currentData.filter(p => p.google_rating).map(p => p.google_rating!);
    const validGroups = currentData.filter(p => p.antal_barngrupper).map(p => p.antal_barngrupper!);

    // National stats for comparison
    const allValidChildren = allData.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const allValidStaff = allData.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const allValidExam = allData.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const allValidRating = allData.filter(p => p.google_rating).map(p => p.google_rating!);
    const allValidGroups = allData.filter(p => p.antal_barngrupper).map(p => p.antal_barngrupper!);

    const current = {
      total: currentData.length,
      totalChildren: validChildren.reduce((a, b) => a + b, 0),
      avgChildren: validChildren.length > 0 ? validChildren.reduce((a, b) => a + b, 0) / validChildren.length : 0,
      avgStaff: validStaff.length > 0 ? validStaff.reduce((a, b) => a + b, 0) / validStaff.length : 0,
      avgExam: validExam.length > 0 ? validExam.reduce((a, b) => a + b, 0) / validExam.length : 0,
      avgRating: validRating.length > 0 ? validRating.reduce((a, b) => a + b, 0) / validRating.length : 0,
      avgGroups: validGroups.length > 0 ? validGroups.reduce((a, b) => a + b, 0) / validGroups.length : 0,
      kommunal: currentData.filter(p => p.huvudman === 'Kommunal').length,
      enskild: currentData.filter(p => p.huvudman === 'Enskild').length,
      withRating: validRating.length
    };

    const national = {
      total: allData.length,
      totalChildren: allValidChildren.reduce((a, b) => a + b, 0),
      avgChildren: allValidChildren.length > 0 ? allValidChildren.reduce((a, b) => a + b, 0) / allValidChildren.length : 0,
      avgStaff: allValidStaff.length > 0 ? allValidStaff.reduce((a, b) => a + b, 0) / allValidStaff.length : 0,
      avgExam: allValidExam.length > 0 ? allValidExam.reduce((a, b) => a + b, 0) / allValidExam.length : 0,
      avgRating: allValidRating.length > 0 ? allValidRating.reduce((a, b) => a + b, 0) / allValidRating.length : 0,
      avgGroups: allValidGroups.length > 0 ? allValidGroups.reduce((a, b) => a + b, 0) / allValidGroups.length : 0,
      kommunal: allData.filter(p => p.huvudman === 'Kommunal').length,
      enskild: allData.filter(p => p.huvudman === 'Enskild').length
    };

    return { current, national };
  }, [filteredPreschools, preschools]);

  // Size distribution data
  const sizeDistribution = useMemo(() => {
    if (!stats) return [];
    
    const sizes = [
      { name: 'Små (<30)', range: [0, 30], color: '#22c55e' },
      { name: 'Medelstora (31-70)', range: [31, 70], color: '#3b82f6' },
      { name: 'Stora (71-120)', range: [71, 120], color: '#f59e0b' },
      { name: 'Mycket stora (>120)', range: [121, 999], color: '#ef4444' }
    ];

    return sizes.map(size => ({
      ...size,
      count: filteredPreschools.filter(p => 
        p.antal_barn && p.antal_barn >= size.range[0] && p.antal_barn <= size.range[1]
      ).length
    }));
  }, [filteredPreschools, stats]);

  // Staff distribution data
  const staffDistribution = useMemo(() => {
    if (!stats) return [];
    
    const staffData: any[] = [];
    const step = 0.5;
    for (let i = 0; i <= 8; i += step) {
      const count = filteredPreschools.filter(p => 
        p.personaltäthet && p.personaltäthet >= i && p.personaltäthet < i + step
      ).length;
      
      if (count > 0) {
        staffData.push({
          range: `${i.toFixed(1)}-${(i + step).toFixed(1)}`,
          count,
          value: i + step / 2
        });
      }
    }
    return staffData;
  }, [filteredPreschools]);

  // Comparison indicator
  const getComparison = (current: number, national: number) => {
    const diff = ((current - national) / national) * 100;
    if (Math.abs(diff) < 2) return { text: '≈ vs riket', color: 'text-muted-foreground', icon: '→' };
    if (diff > 0) return { text: `↗ ${diff.toFixed(1)}% vs riket`, color: 'text-green-600', icon: '↗' };
    return { text: `↘ ${Math.abs(diff).toFixed(1)}% vs riket`, color: 'text-red-600', icon: '↘' };
  };

  const getContextTitle = () => {
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      return `Statistik för ${searchFilters.kommuner.join(', ')}`;
    }
    if (searchFilters.radius && searchFilters.center) {
      return 'Statistik för närområdet';
    }
    if (selectedCommune) {
      return `Statistik för ${selectedCommune}`;
    }
    if (searchFilters.huvudman) {
      return `Statistik för ${searchFilters.huvudman.toLowerCase()}a förskolor`;
    }
    return 'Statistik för alla förskolor';
  };

  if (!stats) return null;

  const pieData = [
    { name: 'Kommunal', value: stats.current.kommunal, color: '#3b82f6' },
    { name: 'Enskild', value: stats.current.enskild, color: '#f59e0b' }
  ];

  return (
    <AnimatePresence>
      {showStatistics && (
        <motion.div
          initial={{ opacity: 0, x: -400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -400 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed left-4 top-20 bottom-4 w-[450px] z-60 ${className}`}
        >
          <Card className="h-full bg-card/95 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Statistik & Analys</CardTitle>
                  <p className="text-sm text-muted-foreground">{getContextTitle()}</p>
                </div>
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

            <CardContent className="overflow-y-auto h-full pb-20 p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="grid w-full grid-cols-3 m-4">
                  <TabsTrigger value="overview" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Översikt
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    Jämförelse
                  </TabsTrigger>
                  <TabsTrigger value="distribution" className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Fördelning
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="px-4 space-y-4 mt-0">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <Building className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {stats.current.total.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Förskolor totalt</p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                      <div className="text-center">
                        <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {stats.current.totalChildren.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">Barn totalt</p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                      <div className="text-center">
                        <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {stats.current.avgChildren.toFixed(0)}
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Snitt barn/förskola</p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                      <div className="text-center">
                        <Award className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {stats.current.avgExam.toFixed(1)}%
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Snitt förskollärarexamen</p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
                      <div className="text-center">
                        <Zap className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                          {stats.current.avgStaff.toFixed(1)}
                        </p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">Snitt personaltäthet</p>
                      </div>
                    </Card>
                  </div>

                  {/* Main operator distribution chart */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Fördelning Kommunal vs Enskild
                    </h3>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Kommunal ({stats.current.kommunal} st, {((stats.current.kommunal / stats.current.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm">Enskild ({stats.current.enskild} st, {((stats.current.enskild / stats.current.total) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="comparison" className="px-4 space-y-4 mt-0">
                  {/* Comparison Cards */}
                  <div className="space-y-3">
                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Barn per förskola</h4>
                          <p className="text-2xl font-bold text-blue-600">{stats.current.avgChildren.toFixed(1)}</p>
                          <p className={`text-xs ${getComparison(stats.current.avgChildren, stats.national.avgChildren).color}`}>
                            {getComparison(stats.current.avgChildren, stats.national.avgChildren).text}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Rikssnitt: {stats.national.avgChildren.toFixed(1)}
                        </Badge>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Barn per grupp</h4>
                          <p className="text-2xl font-bold text-green-600">{stats.current.avgGroups.toFixed(1)}</p>
                          <p className={`text-xs ${getComparison(stats.current.avgGroups, stats.national.avgGroups).color}`}>
                            {getComparison(stats.current.avgGroups, stats.national.avgGroups).text}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Rikssnitt: {stats.national.avgGroups.toFixed(1)}
                        </Badge>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Personaltäthet</h4>
                          <p className="text-2xl font-bold text-purple-600">{stats.current.avgStaff.toFixed(1)}</p>
                          <p className={`text-xs ${getComparison(stats.current.avgStaff, stats.national.avgStaff).color}`}>
                            {getComparison(stats.current.avgStaff, stats.national.avgStaff).text}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Rikssnitt: {stats.national.avgStaff.toFixed(1)}
                        </Badge>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Förskollärarexamen</h4>
                          <p className="text-2xl font-bold text-amber-600">{stats.current.avgExam.toFixed(1)}%</p>
                          <p className={`text-xs ${getComparison(stats.current.avgExam, stats.national.avgExam).color}`}>
                            {getComparison(stats.current.avgExam, stats.national.avgExam).text}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Rikssnitt: {stats.national.avgExam.toFixed(1)}%
                        </Badge>
                      </div>
                    </Card>

                    {stats.current.avgRating > 0 && (
                      <Card className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Google Betyg</h4>
                            <p className="text-2xl font-bold text-yellow-600">{stats.current.avgRating.toFixed(1)}</p>
                            <p className={`text-xs ${getComparison(stats.current.avgRating, stats.national.avgRating).color}`}>
                              {getComparison(stats.current.avgRating, stats.national.avgRating).text}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Rikssnitt: {stats.national.avgRating.toFixed(1)}
                          </Badge>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Municipality comparison if selected */}
                  {selectedCommune && (
                    <Card className="p-4 border-primary/50 bg-primary/5">
                      <h3 className="font-semibold mb-2 text-primary">Jämförelse mellan kommuner</h3>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>{selectedCommune}:</span>
                          <span className="font-semibold">{stats.current.total} förskolor</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Övriga kommuner:</span>
                          <span className="font-semibold">{stats.national.total - stats.current.total} förskolor</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="distribution" className="px-4 space-y-4 mt-0">
                  {/* Size distribution */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Förskolor per Storlek
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sizeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
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
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {sizeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Staff density distribution */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personaltäthet Fördelning
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={staffDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="range" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
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
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Summary stats */}
                  <Card className="p-4 bg-muted/30">
                    <h4 className="font-semibold text-sm mb-3">Sammanfattning av urval</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Datakvalitet (betyg):</span>
                        <span className="font-semibold">{((stats.current.withRating / stats.current.total) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Andel kommunala:</span>
                        <span className="font-semibold">{((stats.current.kommunal / stats.current.total) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Andel enskilda:</span>
                        <span className="font-semibold">{((stats.current.enskild / stats.current.total) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Andel av riket:</span>
                        <span className="font-semibold">{((stats.current.total / stats.national.total) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedStatisticsPanel;