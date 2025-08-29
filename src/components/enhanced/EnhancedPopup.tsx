import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Users, Star, TrendingUp, Award, Camera, Eye, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ClickOutside } from '@/components/ui/click-outside';
import { Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedPopupProps {
  preschool: Preschool;
  onClose: () => void;
  onViewDetails: () => void;
  nationalAverage?: {
    avgChildren: number;
    avgStaff: number;
    avgTeacherExam: number;
    avgRating: number;
  };
}

export const EnhancedPopup: React.FC<EnhancedPopupProps> = ({
  preschool,
  onClose,
  onViewDetails,
  nationalAverage
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);
  const [streetViewError, setStreetViewError] = useState<string | null>(null);
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imageCache = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    fetchImages();
    fetchStreetView();
  }, [preschool.id]);

  const fetchImages = async () => {
    try {
      // Check cache first
      const cachedImages = imageCache.current.get(preschool.id);
      if (cachedImages) {
        setImages(cachedImages);
        return;
      }

      // First, try to fetch existing images from database
      const { data: imageData, error } = await supabase
        .from('preschool_images')
        .select('image_url')
        .eq('preschool_id', preschool.id)
        .eq('image_type', 'google_places')
        .limit(2)
        .order('created_at');

      if (!error && imageData && imageData.length > 0) {
        const imageUrls = imageData.map(img => img.image_url);
        imageCache.current.set(preschool.id, imageUrls);
        setImages(imageUrls);
        return;
      }

      // If no images found in database, try to fetch from Google Places
      if (preschool.latitud && preschool.longitud) {
        try {
          const { data: enrichResult, error: enrichError } = await supabase.functions.invoke('google-places-enricher', {
            body: {
              preschoolId: preschool.id,
              lat: preschool.latitud,
              lng: preschool.longitud,
              address: preschool.adress,
              name: preschool.namn
            }
          });

          if (!enrichError && enrichResult?.success) {
            // After enrichment, try fetching images again
            const { data: newImageData } = await supabase
              .from('preschool_images')
              .select('image_url')
              .eq('preschool_id', preschool.id)
              .eq('image_type', 'google_places')
              .limit(2)
              .order('created_at');

            if (newImageData && newImageData.length > 0) {
              const imageUrls = newImageData.map(img => img.image_url);
              imageCache.current.set(preschool.id, imageUrls);
              setImages(imageUrls);
            }
          }
        } catch (enrichError) {
          console.error('Google Places enricher error:', enrichError);
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchStreetView = async () => {
    if (!preschool.latitud || !preschool.longitud) return;
    
    setIsLoadingStreetView(true);
    setStreetViewError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('street-view-generator', {
        body: {
          lat: preschool.latitud,
          lng: preschool.longitud,
          size: '400x200'
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.static_url) {
        setStreetViewUrl(data.data.static_url);
      } else {
        throw new Error('No street view available');
      }
    } catch (error) {
      console.error('Street view error:', error);
      setStreetViewError('Gatuvy ej tillgänglig');
      
      // Retry logic
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchStreetView();
        }, 1000);
      }
    } finally {
      setIsLoadingStreetView(false);
    }
  };

  const getComparisonBadge = (value: number, average: number, isHigherBetter: boolean = true) => {
    const diff = value - average;
    const percentDiff = (diff / average) * 100;
    
    if (Math.abs(percentDiff) < 5) return null;
    
    const isPositive = isHigherBetter ? diff > 0 : diff < 0;
    
    return (
      <Badge 
        variant={isPositive ? "default" : "secondary"} 
        className="text-xs ml-1"
      >
        {isPositive ? "↑" : "↓"} {Math.abs(percentDiff).toFixed(0)}%
      </Badge>
    );
  };

  return (
    <ClickOutside onClickOutside={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {preschool.namn}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {preschool.huvudman === 'Enskild' ? 'Fristående' : preschool.huvudman}
                  </Badge>
                  {preschool.google_rating && preschool.google_rating >= 4.5 && (
                    <Badge variant="default" className="text-xs">
                      Toppenbetyg
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Google Rating */}
            {preschool.google_rating && (
              <div className="mt-3">
                <StarRating 
                  rating={preschool.google_rating} 
                  reviewCount={preschool.google_reviews_count || 0}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Street View Header */}
            {streetViewUrl && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={streetViewUrl}
                  alt={`Gatuvy för ${preschool.namn}`}
                  className="w-full h-24 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${preschool.latitud},${preschool.longitud}`, '_blank')}
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
                    <Eye className="w-3 h-3 mr-1" />
                    Gatuvy
                  </Badge>
                </div>
              </div>
            )}

            {/* Street View Loading/Error */}
            {isLoadingStreetView && (
              <div className="h-24 bg-muted rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Laddar gatuvy...
                </div>
              </div>
            )}

            {streetViewError && !streetViewUrl && !isLoadingStreetView && (
              <div className="h-16 bg-muted rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {streetViewError}
                </div>
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{preschool.adress}</p>
                <p className="text-xs text-muted-foreground">{preschool.kommun}</p>
              </div>
            </div>
          
          {/* Images Preview */}
          {images.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bilder</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${preschool.namn} bild ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                    loading="lazy"
                    onClick={onViewDetails}
                  />
                ))}
              </div>
            </div>
          )}
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Children Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{preschool.antal_barn || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Barn</p>
                  {nationalAverage && preschool.antal_barn && 
                    getComparisonBadge(preschool.antal_barn, nationalAverage.avgChildren)}
                </div>
              </div>

              {/* Staff Density */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {preschool.personaltäthet ? preschool.personaltäthet.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Personal</p>
                  {nationalAverage && preschool.personaltäthet && 
                    getComparisonBadge(preschool.personaltäthet, nationalAverage.avgStaff, false)}
                </div>
              </div>

              {/* Teacher Qualification */}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {preschool.andel_med_förskollärarexamen ? `${preschool.andel_med_förskollärarexamen}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Lärarexamen</p>
                  {nationalAverage && preschool.andel_med_förskollärarexamen && 
                    getComparisonBadge(preschool.andel_med_förskollärarexamen, nationalAverage.avgTeacherExam)}
                </div>
              </div>

              {/* Groups */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{preschool.antal_barngrupper}</p>
                  <p className="text-xs text-muted-foreground">Grupper</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={onViewDetails}
                className="flex-1"
                variant="default"
                size="sm"
              >
                Mer detaljer
              </Button>
              <Button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${preschool.adress}, ${preschool.kommun}`)}`, '_blank')}
                variant="outline"
                size="sm"
              >
                Vägbeskrivning
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </ClickOutside>
  );
};