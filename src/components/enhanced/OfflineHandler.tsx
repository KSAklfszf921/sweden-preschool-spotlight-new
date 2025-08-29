import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
interface OfflineHandlerProps {
  children: React.ReactNode;
}
export const OfflineHandler: React.FC<OfflineHandlerProps> = ({
  children
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      toast({
        title: "Anslutning återställd",
        description: "Du är nu online igen",
        duration: 3000
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      toast({
        title: "Ingen internetanslutning",
        description: "Kontrollera din anslutning för att få de senaste uppdateringarna",
        variant: "destructive",
        duration: 5000
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const handleRetry = () => {
    window.location.reload();
  };
  return <>
      {showOfflineBanner && <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground border-destructive">
          <div className="p-3 flex items-center gap-3">
            <WifiOff className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Ingen internetanslutning</p>
              <p className="text-xs opacity-90">Vissa funktioner kanske inte fungerar</p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleRetry} className="h-8">
              <RefreshCw className="h-4 w-4 mr-1" />
              Försök igen
            </Button>
          </div>
        </Card>}
      
      {children}
      
      {/* Status indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        
      </div>
    </>;
};