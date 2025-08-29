import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, PieChart, TrendingUp, Users, Building, 
  GraduationCap, Star, ChevronDown, ChevronUp, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMapStore } from '@/stores/mapStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface DynamicStatisticsPanelProps {
  className?: string;
}

export const DynamicStatisticsPanel: React.FC<DynamicStatisticsPanelProps> = ({ className }) => {
  const { filteredPreschools, searchFilters } = useMapStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate statistics based on current filters
  const statistics = useMemo(() => {
    const validPreschools = filteredPreschools.filter(p => p.latitud && p.longitud);
    
    const totalPreschools = validPreschools.length;
    const totalChildren = validPreschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0);
    
    const kommunalCount = validPreschools.filter(p => p.huvudman === 'Kommunal').length;
    const enskildCount = validPreschools.filter(p => p.huvudman === 'Enskild').length;
    
    const avgTeacherEducation = validPreschools
      .filter(p => p.andel_med_förskollärarexamen)
      .reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / 
      validPreschools.filter(p => p.andel_med_förskollärarexamen).length || 0;
    
    const avgStaffDensity = validPreschools
      .filter(p => p.personaltäthet)
      .reduce((sum, p) => sum + (p.personaltäthet || 0), 0) / 
      validPreschools.filter(p => p.personaltäthet).length || 0;
    
    const avgRating = validPreschools
      .filter(p => p.google_rating)
      .reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
      validPreschools.filter(p => p.google_rating).length || 0;
    
    const ratedCount = validPreschools.filter(p => p.google_rating).length;

    return {
      totalPreschools,
      totalChildren,
      kommunalCount,
      enskildCount,
      avgTeacherEducation,
      avgStaffDensity,
      avgRating,
      ratedCount,
      preschools: validPreschools
    };
  }, [filteredPreschools]);

  // Get context-aware title
  const getContextTitle = () => {
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      const kommunText = searchFilters.kommuner.length === 1 
        ? searchFilters.kommuner[0]
        : `${searchFilters.kommuner.length} kommuner`;
      return `Statistik för ${kommunText}`;
    }
    if (searchFilters.nearbyMode) {
      return 'Statistik för närområdet';
    }
    if (searchFilters.query) {
      return `Statistik för "${searchFilters.query}"`;
    }
    return 'Statistik för alla förskolor';
  };

  // Prepare chart data
  const typeDistributionData = [
    { name: 'Kommunal', value: statistics.kommunalCount, color: 'hsl(210, 85%, 60%)' },
    { name: 'Fristående', value: statistics.enskildCount, color: 'hsl(25, 85%, 60%)' }
  ];

  const qualityDistributionData = useMemo(() => {
    const ranges = [
      { name: '90-100%', min: 90, max: 100, count: 0 },
      { name: '80-89%', min: 80, max: 89, count: 0 },
      { name: '70-79%', min: 70, max: 79, count: 0 },
      { name: '60-69%', min: 60, max: 69, count: 0 },
      { name: '<60%', min: 0, max: 59, count: 0 }
    ];

    statistics.preschools.forEach(p => {
      if (p.andel_med_förskollärarexamen) {
        const range = ranges.find(r => 
          p.andel_med_förskollärarexamen >= r.min && p.andel_med_förskollärarexamen <= r.max
        );
        if (range) range.count++;
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [statistics.preschools]);

  // Minimized view
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute bottom-4 left-4 z-30 ${className}`}
      >
        <Card className="glass-card border-0 shadow-lg hover-lift-subtle cursor-pointer"
              onClick={() => setIsExpanded(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  {getContextTitle()}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {statistics.totalPreschools} förskolor • {statistics.totalChildren} barn
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute bottom-4 left-4 z-30 w-96 max-h-[calc(100vh-2rem)] ${className}`}
    >
      <Card className="glass-card border-0 shadow-lg h-full flex flex-col">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading font-semibold text-foreground">
                {getContextTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Översikt och jämförelser
              </p>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Översikt</TabsTrigger>
              <TabsTrigger value="quality">Kvalitet</TabsTrigger>
              <TabsTrigger value="distribution">Fördelning</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Key metrics cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gradient-to-br from-bubble-kommunal/10 to-bubble-kommunal/5 border-bubble-kommunal/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-bubble-kommunal" />
                        <div>
                          <p className="text-xs text-muted-foreground">Förskolor</p>
                          <p className="text-lg font-bold text-bubble-kommunal">{statistics.totalPreschools}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-bubble-enskild/10 to-bubble-enskild/5 border-bubble-enskild/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-bubble-enskild" />
                        <div>
                          <p className="text-xs text-muted-foreground">Barn totalt</p>
                          <p className="text-lg font-bold text-bubble-enskild">{statistics.totalChildren}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {statistics.avgRating > 0 && (
                    <Card className="bg-gradient-to-br from-bubble-high-rating/10 to-bubble-high-rating/5 border-bubble-high-rating/20">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-bubble-high-rating" />
                          <div>
                            <p className="text-xs text-muted-foreground">Snittbetyg</p>
                            <p className="text-lg font-bold text-bubble-high-rating">
                              {statistics.avgRating.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {statistics.avgTeacherEducation > 0 && (
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Förskollärare</p>
                            <p className="text-lg font-bold text-primary">
                              {Math.round(statistics.avgTeacherEducation)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Quick stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kommunal vs Fristående</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs bg-bubble-kommunal/10 text-bubble-kommunal border-bubble-kommunal/20">
                        {statistics.kommunalCount} kommunal
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-bubble-enskild/10 text-bubble-enskild border-bubble-enskild/20">
                        {statistics.enskildCount} fristående
                      </Badge>
                    </div>
                  </div>

                  {statistics.avgStaffDensity > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Snitt personaltäthet</span>
                      <span className="text-sm font-medium">
                        {statistics.avgStaffDensity.toFixed(1)} barn/personal
                      </span>
                    </div>
                  )}

                  {statistics.ratedCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Förskolor med betyg</span>
                      <span className="text-sm font-medium">
                        {statistics.ratedCount} av {statistics.totalPreschools}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4 mt-0">
                {qualityDistributionData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Fördelning förskollärare med examen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={qualityDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(130, 70%, 60%)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Quality insights */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Kvalitetsinsikter</h4>
                  
                  {statistics.avgTeacherEducation >= 80 && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-bubble-high-rating/10 border border-bubble-high-rating/20">
                      <TrendingUp className="h-4 w-4 text-bubble-high-rating mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-bubble-high-rating">Hög kvalitet</p>
                        <p className="text-xs text-muted-foreground">
                          Området har en hög andel förskollärare med examen ({Math.round(statistics.avgTeacherEducation)}%).
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {statistics.avgRating >= 4.5 && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                      <Star className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-700">Högt betyg</p>
                        <p className="text-xs text-muted-foreground">
                          Förskolor i området har utmärkta betyg ({statistics.avgRating.toFixed(1)}/5).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4 mt-0">
                {typeDistributionData.some(d => d.value > 0) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Kommunal vs Fristående</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <RechartsPieChart data={typeDistributionData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                            {typeDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </RechartsPieChart>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {typeDistributionData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {entry.name} ({entry.value})
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};