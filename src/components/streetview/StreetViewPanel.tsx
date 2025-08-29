import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Preschool } from '@/stores/mapStore';
import { Camera, ExternalLink, RefreshCw, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StreetViewPanelProps {
  preschool: Preschool;
  onClose?: () => void;
}

export const StreetViewPanel: React.FC<StreetViewPanelProps> = ({
  preschool,
  onClose
}) => {
  const [streetViewUrl, setStreetViewUrl] = useState<string>('');
  const [panoramaUrl, setPanoramaUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (preschool.latitud && preschool.longitud) {
      generateStreetView();
    }
  }, [preschool]);

  const generateStreetView = async () => {
    if (!preschool.latitud || !preschool.longitud) return;

    setLoading(true);
    setError('');
    
    try {
      // Check if we have existing street view data first
      const { data: existingData } = await supabase
        .from('preschool_google_data')
        .select('street_view_static_url, street_view_pano_id')
        .eq('preschool_id', preschool.id)
        .single();

      if (existingData?.street_view_static_url) {
        setStreetViewUrl(existingData.street_view_static_url);
        const googleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${preschool.latitud},${preschool.longitud}`;
        setPanoramaUrl(googleMapsUrl);
        setLoading(false);
        return;
      }

      // Generate new street view data
      const { data, error: functionError } = await supabase.functions.invoke('street-view-generator', {
        body: {
          lat: preschool.latitud,
          lng: preschool.longitud,
          size: '640x400',
          heading: 0,
          pitch: 0,
          fov: 90,
          preschoolId: preschool.id
        }
      });

      if (functionError) throw functionError;

      if (data?.success) {
        setStreetViewUrl(data.data.static_url);
        setPanoramaUrl(data.data.panorama_url);
      } else {
        setError('Kunde inte hämta gatuvy för denna plats');
      }
    } catch (error) {
      console.error('Error generating street view:', error);
      setError('Ett fel uppstod när gatuvy skulle hämtas');
    } finally {
      setLoading(false);
    }
  };

  const openStreetView = () => {
    if (panoramaUrl) {
      window.open(panoramaUrl, '_blank');
    } else {
      // Fallback to Google Maps street view
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${preschool.latitud},${preschool.longitud}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Gatuvy - {preschool.namn}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateStreetView}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Genererar gatuvy...</p>
          </div>
        </div>
      ) : error ? (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateStreetView}
              className="mt-2"
            >
              Försök igen
            </Button>
          </div>
        </div>
      ) : streetViewUrl ? (
        <div className="space-y-3">
          <div 
            className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
            onClick={openStreetView}
          >
            <img 
              src={streetViewUrl}
              alt={`Gatuvy av ${preschool.namn}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-lg px-3 py-2">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {preschool.adress}, {preschool.kommun}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              360° vy
            </Badge>
          </div>

          <Button
            onClick={openStreetView}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Öppna interaktiv vy
          </Button>
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ingen gatuvy tillgänglig</p>
          </div>
        </div>
      )}
    </Card>
  );
};