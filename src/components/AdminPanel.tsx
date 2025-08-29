import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Activity, 
  MapPin, 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  HardDrive,
  Users,
  Images,
  Star,
  Wrench,
  BarChart3,
  Clock,
  FileText,
  Map,
  Globe,
  Play,
  Square,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminRealTimeMonitor } from '@/hooks/useAdminRealTimeMonitor';
import { useAdminCoordinateStats } from '@/hooks/useAdminCoordinateStats';
import { CoordinateBatchProcessor } from '@/components/CoordinateBatchProcessor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminStats {
  database: {
    totalPreschools: number;
    missingCoordinates: number;
    withGoogleData: number;
    withImages: number;
    coordinatesCoverage: number;
    googleDataCoverage: number;
    imagesCoverage: number;
    userFavorites?: number;
    searchHistory?: number;
    googleDataEntries?: number;
    imagesCount?: number;
  };
  storage?: {
    totalSize: number;
    totalSizeFormatted: string;
    buckets: Array<{
      name: string;
      fileCount: number;
      size: number;
      sizeFormatted: string;
    }>;
  };
  activity?: {
    recentLogs: any[];
  };
  systemHealth: {
    databaseOnline: boolean;
    lastUpdated: string;
  };
}

interface GeoCodingResult {
  id: string;
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  status: 'success' | 'failed' | 'error';
  error?: string;
  updated: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingBatchSize, setGeocodingBatchSize] = useState(10);
  const [geocodingDryRun, setGeocodingDryRun] = useState(true);
  const [geocodingResults, setGeocodingResults] = useState<GeoCodingResult[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { preschools } = useMapStore();
  const { toast } = useToast();
  const { stats: coordinateStats, isLoading: coordinateStatsLoading, refresh: refreshStats } = useAdminCoordinateStats();

  const missingCoords = preschools.filter(p => 
    p.latitud === null || p.longitud === null || p.latitud === 0 || p.longitud === 0
  );

  const loadAdminStats = async () => {
    setStatsLoading(true);
    try {
      // Use the admin-stats edge function for comprehensive statistics
      const { data, error } = await supabase.functions.invoke('admin-stats');
      
      if (error) throw error;
      
      if (data && data.database) {
        setAdminStats({
          database: {
            totalPreschools: data.database.totalPreschools,
            missingCoordinates: data.database.missingCoordinates,
            withGoogleData: data.database.withGoogleData,
            withImages: data.database.withImages,
            coordinatesCoverage: data.database.coordinatesCoverage,
            googleDataCoverage: data.database.googleDataCoverage,
            imagesCoverage: data.database.imagesCoverage,
            userFavorites: data.database.userFavorites,
            searchHistory: data.database.searchHistory,
            googleDataEntries: data.database.googleDataEntries,
            imagesCount: data.database.imagesCount
          },
          storage: data.storage,
          activity: data.activity,
          systemHealth: {
            databaseOnline: data.systemHealth.databaseOnline,
            lastUpdated: data.systemHealth.lastUpdated,
          }
        });
      }

    } catch (error) {
      console.error('Failed to load admin stats:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda administrativa statistik via admin-stats funktion",
        variant: "destructive"
      });
      
      // Fallback to local queries if edge function fails
      try {
        const { data: totalData, count: totalCount } = await supabase
          .from('Förskolor')
          .select('id', { count: 'exact', head: true });

        const { count: missingCount } = await supabase
          .from('Förskolor')
          .select('id', { count: 'exact', head: true })
          .or('Latitud.is.null,Longitud.is.null,Latitud.eq.0,Longitud.eq.0');

        const { count: googleCount } = await supabase
          .from('preschool_google_data')
          .select('id', { count: 'exact', head: true });

        const { count: imagesCount } = await supabase
          .from('preschool_images')
          .select('id', { count: 'exact', head: true });

        const total = totalCount || 0;
        const missing = missingCount || 0;
        const withGoogle = googleCount || 0;
        const withImages = imagesCount || 0;

        setAdminStats({
          database: {
            totalPreschools: total,
            missingCoordinates: missing,
            withGoogleData: withGoogle,
            withImages: withImages,
            coordinatesCoverage: total > 0 ? ((total - missing) / total) * 100 : 0,
            googleDataCoverage: total > 0 ? (withGoogle / total) * 100 : 0,
            imagesCoverage: total > 0 ? (withImages / total) * 100 : 0,
          },
          systemHealth: {
            databaseOnline: true,
            lastUpdated: new Date().toISOString(),
          }
        });
      } catch (fallbackError) {
        console.error('Fallback stats loading also failed:', fallbackError);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // Enable real-time monitoring for admin data changes
  useAdminRealTimeMonitor({
    onDataChange: loadAdminStats,
    isEnabled: isOpen
  });
  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const { data, error } = await supabase.from('Förskolor').select('count').limit(1);
      if (error) throw error;
      setApiStatus('online');
    } catch (error) {
      console.error('API Status check failed:', error);
      setApiStatus('offline');
    }
  };

  const startGeocodingProcess = async () => {
    if (isGeocoding) return;

    setIsGeocoding(true);
    setGeocodingProgress(0);
    setGeocodingResults([]);

    try {
      const response = await supabase.functions.invoke('fix-missing-geocoding', {
        body: {
          batchSize: geocodingBatchSize,
          dryRun: geocodingDryRun
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      setGeocodingResults(result.results || []);
      setGeocodingProgress(100);

      toast({
        title: geocodingDryRun ? "Test slutförd" : "Geocoding slutförd",
        description: `Bearbetade ${result.processed} förskolor. ${result.success} lyckades, ${result.errors} misslyckades.`,
        variant: result.success > 0 ? "default" : "destructive"
      });

      // Reload stats after successful geocoding
      if (!geocodingDryRun && result.success > 0) {
        await loadAdminStats();
      }

    } catch (error) {
      console.error('Geocoding failed:', error);
      toast({
        title: "Geocoding misslyckades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const stopGeocodingProcess = () => {
    setIsGeocoding(false);
    setGeocodingProgress(0);
  };

  const clearResults = () => {
    setGeocodingResults([]);
    setGeocodingProgress(0);
  };

  const runAdvancedGeocoding = async () => {
    if (!missingCoords.length) {
      toast({
        title: "Inga förskolor att bearbeta",
        description: "Alla förskolor har redan koordinater",
      });
      return;
    }

    setIsGeocoding(true);
    setGeocodingResults([]);

    try {
      const response = await supabase.functions.invoke('geocoding-service', {
        body: {
          preschools: missingCoords.slice(0, geocodingBatchSize).map(p => ({
            id: p.id,
            Namn: p.namn,
            Adress: p.adress,
            Kommun: p.kommun,
            Latitud: p.latitud,
            Longitud: p.longitud
          }))
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      setGeocodingResults(result.results || []);
      
      toast({
        title: "Avancerad geocoding slutförd",
        description: `${result.successful}/${result.processed} förskolor geocodade framgångsrikt`,
        variant: result.successful > 0 ? "default" : "destructive"
      });

      // Reload stats
      await loadAdminStats();

    } catch (error) {
      console.error('Advanced geocoding failed:', error);
      toast({
        title: "Avancerad geocoding misslyckades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkApiStatus();
      loadAdminStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 glass-nav"
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="absolute top-4 left-4 right-4 bottom-4 max-w-6xl mx-auto"
        >
          <Card className="h-full glass-card border-0 shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-border/20">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-heading font-bold">Admin Panel</h2>
                <Badge variant={apiStatus === 'online' ? 'default' : 'destructive'}>
                  {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Kontrollerar...'}
                </Badge>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover-scale"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 p-6">
              <Tabs defaultValue="overview" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Översikt
                  </TabsTrigger>
                  <TabsTrigger value="geocoding">
                    <MapPin className="w-4 h-4 mr-2" />
                    Koordinater
                  </TabsTrigger>
                  <TabsTrigger value="system">
                    <Server className="w-4 h-4 mr-2" />
                    System
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statsLoading ? (
                      <div className="col-span-full flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 font-heading">Laddar statistik...</span>
                      </div>
                    ) : adminStats ? (
                      <>
                        <Card className="p-6 card-hover">
                          <div className="flex items-center gap-3 mb-4">
                            <Database className="h-8 w-8 text-primary" />
                            <h3 className="font-heading font-semibold text-lg">Databas</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Totalt förskolor:</span>
                              <Badge variant="secondary">{adminStats.database.totalPreschools.toLocaleString()}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Saknar koordinater:</span>
                              <Badge variant={adminStats.database.missingCoordinates > 0 ? "destructive" : "default"}>
                                {adminStats.database.missingCoordinates.toLocaleString()}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Koordinattäckning:</span>
                              <Badge variant="default">{adminStats.database.coordinatesCoverage.toFixed(1)}%</Badge>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-6 card-hover">
                          <div className="flex items-center gap-3 mb-4">
                            <Star className="h-8 w-8 text-yellow-500" />
                            <h3 className="font-heading font-semibold text-lg">Google Data</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Med Google data:</span>
                              <Badge variant="secondary">{adminStats.database.withGoogleData.toLocaleString()}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Datatäckning:</span>
                              <Badge variant="default">{adminStats.database.googleDataCoverage.toFixed(1)}%</Badge>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-6 card-hover">
                          <div className="flex items-center gap-3 mb-4">
                            <Images className="h-8 w-8 text-green-500" />
                            <h3 className="font-heading font-semibold text-lg">Bilder</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Med bilder:</span>
                              <Badge variant="secondary">{adminStats.database.withImages.toLocaleString()}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bildtäckning:</span>
                              <Badge variant="default">{adminStats.database.imagesCoverage.toFixed(1)}%</Badge>
                            </div>
                            {adminStats.database.imagesCount && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Totalt bilder:</span>
                                <Badge variant="outline">{adminStats.database.imagesCount.toLocaleString()}</Badge>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* User Activity Cards */}
                        {adminStats.database.userFavorites !== undefined && (
                          <Card className="p-6 card-hover">
                            <div className="flex items-center gap-3 mb-4">
                              <Users className="h-8 w-8 text-blue-500" />
                              <h3 className="font-heading font-semibold text-lg">Användaraktivitet</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Favoriter:</span>
                                <Badge variant="secondary">{adminStats.database.userFavorites.toLocaleString()}</Badge>
                              </div>
                              {adminStats.database.searchHistory !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sökhistorik:</span>
                                  <Badge variant="secondary">{adminStats.database.searchHistory.toLocaleString()}</Badge>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}

                        {/* Storage Information */}
                        {adminStats.storage && (
                          <Card className="p-6 card-hover">
                            <div className="flex items-center gap-3 mb-4">
                              <HardDrive className="h-8 w-8 text-purple-500" />
                              <h3 className="font-heading font-semibold text-lg">Lagring</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total storlek:</span>
                                <Badge variant="secondary">{adminStats.storage.totalSizeFormatted}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Buckets:</span>
                                <Badge variant="outline">{adminStats.storage.buckets.length}</Badge>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Recent Activity */}
                        {adminStats.activity && adminStats.activity.recentLogs.length > 0 && (
                          <Card className="p-6 card-hover col-span-full">
                            <div className="flex items-center gap-3 mb-4">
                              <Activity className="h-8 w-8 text-orange-500" />
                              <h3 className="font-heading font-semibold text-lg">Senaste aktivitet</h3>
                            </div>
                            <ScrollArea className="h-40">
                              <div className="space-y-2">
                                {adminStats.activity.recentLogs.slice(0, 5).map((log: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/30">
                                    <span className="text-sm text-muted-foreground truncate">{log.message}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(log.created_at).toLocaleTimeString()}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </Card>
                        )}
                      </>
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        Kunde inte ladda statistik
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="geocoding" className="mt-6">
                  <div className="space-y-6">
                    {/* Enhanced Coordinate Statistics */}
                    <Card className="glass-popup">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-heading font-semibold">Koordinat-statistik</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshStats}
                            disabled={coordinateStatsLoading}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className={`h-4 w-4 ${coordinateStatsLoading ? 'animate-spin' : ''}`} />
                            Uppdatera
                          </Button>
                        </div>
                        
                        {coordinateStatsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Laddar koordinatstatistik...</span>
                          </div>
                        ) : coordinateStats ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-background/50 rounded-lg">
                                <div className="text-2xl font-bold">{coordinateStats.total}</div>
                                <p className="text-xs text-muted-foreground">Totalt förskolor</p>
                              </div>
                              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{coordinateStats.withCoordinates}</div>
                                <p className="text-xs text-muted-foreground">Med koordinater</p>
                              </div>
                              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{coordinateStats.missingCoordinates}</div>
                                <p className="text-xs text-muted-foreground">Saknar koordinater</p>
                              </div>
                              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                  {Math.round((coordinateStats.withCoordinates / coordinateStats.total) * 100)}%
                                </div>
                                <p className="text-xs text-muted-foreground">Täckning</p>
                              </div>
                            </div>

                            {/* Top kommuner with missing coordinates */}
                            {Object.entries(coordinateStats.byKommun).filter(([_, stats]) => stats.missing > 0).length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium">Kommuner med saknade koordinater:</h4>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {Object.entries(coordinateStats.byKommun)
                                    .filter(([_, stats]) => stats.missing > 0)
                                    .sort((a, b) => b[1].missing - a[1].missing)
                                    .slice(0, 10)
                                    .map(([kommun, stats]) => (
                                      <div key={kommun} className="flex justify-between items-center text-sm p-2 bg-background/30 rounded">
                                        <span className="truncate font-medium">{kommun}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600 font-semibold">{stats.missing}</span>
                                          <span className="text-muted-foreground">av {stats.total}</span>
                                          <Badge variant="outline">{stats.percentage}%</Badge>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Kunde inte ladda koordinatstatistik
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Batch Processor */}
                    <CoordinateBatchProcessor 
                      missingCoordinatesCount={missingCoords.length}
                      onComplete={() => {
                        loadAdminStats();
                        refreshStats();
                        toast({
                          title: "Koordinater uppdaterade",
                          description: "Förskoledata har uppdaterats med nya koordinater."
                        });
                      }}
                    />

                    {/* Legacy Geocoding Controls */}
                    <Card className="glass-popup">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-heading font-semibold mb-2">Äldre geocoding-verktyg</h3>
                            <p className="text-muted-foreground">
                              Fallback-verktyg för manuell geocoding-hantering
                            </p>
                          </div>
                          <Badge variant={missingCoords.length > 0 ? "destructive" : "default"}>
                            {missingCoords.length} saknar koordinater
                          </Badge>
                        </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="batch-size" className="font-heading font-medium">Antal per omgång</Label>
                            <Select 
                              value={geocodingBatchSize.toString()} 
                              onValueChange={(value) => setGeocodingBatchSize(Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 förskolor</SelectItem>
                                <SelectItem value="10">10 förskolor</SelectItem>
                                <SelectItem value="20">20 förskolor</SelectItem>
                                <SelectItem value="50">50 förskolor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="dry-run"
                              checked={geocodingDryRun}
                              onCheckedChange={setGeocodingDryRun}
                            />
                            <Label htmlFor="dry-run" className="font-heading font-medium">
                              Test-läge (sparar inte)
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={startGeocodingProcess}
                              disabled={isGeocoding || missingCoords.length === 0}
                              className="flex-1 hover-scale"
                              variant={geocodingDryRun ? "outline" : "default"}
                            >
                              {isGeocoding ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Kör...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  {geocodingDryRun ? "Testa" : "Kör"} Geocoding
                                </>
                              )}
                            </Button>

                            {isGeocoding && (
                              <Button
                                onClick={stopGeocodingProcess}
                                variant="destructive"
                                size="sm"
                                className="hover-scale"
                              >
                                <Square className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <Button
                            onClick={runAdvancedGeocoding}
                            disabled={isGeocoding || missingCoords.length === 0}
                            variant="secondary"
                            className="w-full hover-scale"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Avancerad Geocoding
                          </Button>
                        </div>
                      </div>

                      {geocodingProgress > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-heading font-medium">Framsteg</span>
                            <span>{geocodingProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={geocodingProgress} className="h-2" />
                        </div>
                      )}

                      {geocodingResults.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-heading font-medium">Resultat ({geocodingResults.length})</h4>
                            <Button
                              onClick={clearResults}
                              variant="ghost"
                              size="sm"
                              className="hover-scale"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rensa
                            </Button>
                          </div>
                          
                          <ScrollArea className="h-64 rounded-lg border">
                            <div className="p-4 space-y-2">
                              {geocodingResults.map((result, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {result.status === 'success' ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <div>
                                      <div className="font-heading font-medium text-sm">{result.name}</div>
                                      {result.coordinates && (
                                        <div className="text-xs text-muted-foreground">
                                          {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                                        </div>
                                      )}
                                      {result.error && (
                                        <div className="text-xs text-red-500">{result.error}</div>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                                    {result.updated ? 'Sparad' : result.status === 'success' ? 'Test' : 'Fel'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                     </div>
                   </Card>
                   </div>
                 </TabsContent>

                <TabsContent value="system" className="mt-6">
                  <div className="grid gap-6">
                    <Card className="p-6 card-hover">
                      <div className="flex items-center gap-3 mb-4">
                        <Activity className="h-6 w-6 text-primary" />
                        <h3 className="font-heading font-semibold text-lg">Systemhälsa</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Databas:</span>
                          <Badge variant={apiStatus === 'online' ? 'default' : 'destructive'}>
                            {apiStatus === 'online' ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                        {adminStats && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Senast uppdaterad:</span>
                            <span className="text-sm">
                              {new Date(adminStats.systemHealth.lastUpdated).toLocaleString('sv-SE')}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="p-6 card-hover">
                      <div className="flex items-center gap-3 mb-4">
                        <Wrench className="h-6 w-6 text-primary" />
                        <h3 className="font-heading font-semibold text-lg">Verktyg</h3>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={loadAdminStats}
                          disabled={statsLoading}
                          variant="outline"
                          className="hover-scale"
                        >
                          {statsLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Uppdatera statistik
                        </Button>
                        <Button
                          onClick={checkApiStatus}
                          variant="outline"
                          className="hover-scale"
                        >
                          <Server className="w-4 h-4 mr-2" />
                          Kontrollera API
                        </Button>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};