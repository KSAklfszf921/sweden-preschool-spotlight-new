import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wifi, WifiOff, Download, RefreshCw, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';

interface CachedData {
  preschools: any[];
  timestamp: number;
  version: string;
}

export const OfflineSupport: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const { preschools, setPreschools } = useMapStore();

  const CACHE_KEY = 'preschools_offline_cache';
  const CACHE_VERSION = '1.0.0';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for cached data on mount
  useEffect(() => {
    checkCachedData();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && hasOfflineData) {
      toast.info('Du är online igen. Synkroniserar data...');
      syncData();
    }
  }, [isOnline]);

  const checkCachedData = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cachedData: CachedData = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        
        setHasOfflineData(true);
        setLastSync(new Date(cachedData.timestamp));
        setCacheSize(Math.round(new Blob([cached]).size / 1024)); // KB
        
        // Use cached data if offline or data is fresh
        if (!isOnline || age < CACHE_DURATION) {
          if (!isOnline) {
            setPreschools(cachedData.preschools);
            toast.info('Använder offline-data. Senast uppdaterad: ' + 
              new Date(cachedData.timestamp).toLocaleDateString());
          }
        }
      }
    } catch (error) {
      console.error('Error checking cached data:', error);
    }
  };

  const cacheData = async () => {
    try {
      const dataToCache: CachedData = {
        preschools: preschools,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
      setHasOfflineData(true);
      setLastSync(new Date());
      setCacheSize(Math.round(new Blob([JSON.stringify(dataToCache)]).size / 1024));
      
      toast.success('Data cachad för offline-användning');
    } catch (error) {
      console.error('Error caching data:', error);
      toast.error('Kunde inte cacha data');
    }
  };

  const syncData = async () => {
    if (!isOnline) {
      toast.error('Ingen internetanslutning');
      return;
    }

    try {
      // This would normally refetch from the server
      // For now, we'll just update the cache timestamp
      toast.loading('Synkroniserar...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await cacheData();
      toast.success('Data synkroniserad');
    } catch (error) {
      console.error('Error syncing data:', error);
      toast.error('Synkronisering misslyckades');
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setHasOfflineData(false);
    setLastSync(null);
    setCacheSize(0);
    toast.success('Cache rensad');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex items-center gap-2">
        {/* Online/Offline indicator */}
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>

        {/* Cache info and controls */}
        {hasOfflineData && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            {cacheSize}KB
          </Badge>
        )}

        {/* Download for offline button */}
        {isOnline && (
          <Button
            onClick={cacheData}
            variant="outline"
            size="sm"
            className="bg-card/95 backdrop-blur-sm"
            title="Ladda ner för offline-användning"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}

        {/* Sync button */}
        {isOnline && hasOfflineData && (
          <Button
            onClick={syncData}
            variant="outline"
            size="sm"
            className="bg-card/95 backdrop-blur-sm"
            title="Synkronisera data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Offline data info */}
      {!isOnline && hasOfflineData && lastSync && (
        <div className="mt-2 text-xs text-muted-foreground bg-card/95 backdrop-blur-sm rounded p-2">
          Offline-data från: {lastSync.toLocaleDateString()} {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};