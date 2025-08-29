import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Users, 
  GraduationCap, 
  Star, 
  Phone,
  Globe,
  Clock,
  Camera,
  MessageSquare,
  ExternalLink,
  Heart,
  Navigation,
  Calendar,
  User
} from 'lucide-react';
import { Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';

interface GoogleData {
  google_rating?: number;
  google_reviews_count?: number;
  contact_phone?: string;
  website_url?: string;
  opening_hours?: any;
  google_photos?: string[];
  reviews?: any[];
  street_view_pano_id?: string;
}

interface PreschoolDetailsModalProps {
  preschool: Preschool | null;
  isOpen: boolean;
  onClose: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export const PreschoolDetailsModal: React.FC<PreschoolDetailsModalProps> = ({
  preschool,
  isOpen,
  onClose,
  onFavorite,
  isFavorite = false
}) => {
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [streetViewUrl, setStreetViewUrl] = useState<string>('');

  useEffect(() => {
    if (preschool && isOpen) {
      fetchGoogleData();
    }
  }, [preschool, isOpen]);

  const fetchGoogleData = async () => {
    if (!preschool) return;
    
    setLoading(true);
    try {
      // First check if we have cached Google data
      const { data: existingData } = await supabase
        .from('preschool_google_data')
        .select('*')
        .eq('preschool_id', preschool.id)
        .single();

      if (existingData) {
        setGoogleData({
          ...existingData,
          reviews: Array.isArray(existingData.reviews) ? existingData.reviews : 
            (typeof existingData.reviews === 'string' ? JSON.parse(existingData.reviews || '[]') : [])
        });
        if (existingData.google_photos && existingData.google_photos.length > 0) {
          loadPhotoUrls(existingData.google_photos);
        }
        // Check if street view data exists (field might not be in types yet)
        const hasStreetView = (existingData as any).street_view_pano_id;
        if (hasStreetView) {
          generateStreetView();
        }
      } else {
        // Fetch new data from Google Places
        await enrichWithGoogleData();
      }
    } catch (error) {
      console.error('Error fetching Google data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichWithGoogleData = async () => {
    if (!preschool) return;

    try {
      const response = await supabase.functions.invoke('google-places-enricher', {
        body: {
          preschoolId: preschool.id,
          lat: preschool.latitud,
          lng: preschool.longitud,
          address: preschool.adress,
          name: preschool.namn
        }
      });

      if (response.data?.success) {
        // Refetch the updated data
        await fetchGoogleData();
      }
    } catch (error) {
      console.error('Error enriching with Google data:', error);
    }
  };

  const loadPhotoUrls = async (photoReferences: string[]) => {
    try {
      // Since preschool_images table might not be in types yet, use a workaround
      const { data: googleDataWithPhotos } = await supabase
        .from('preschool_google_data')
        .select('google_photos')
        .eq('preschool_id', preschool?.id)
        .single();

      if (googleDataWithPhotos?.google_photos && googleDataWithPhotos.google_photos.length > 0) {
        // Generate Google Photos URLs from references
        const photoUrls = googleDataWithPhotos.google_photos.slice(0, 3).map((ref: string) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=YOUR_API_KEY`
        );
        setPhotos(photoUrls);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const generateStreetView = async () => {
    if (!preschool) return;

    try {
      // Check for existing street view data first
      const { data: existingData } = await supabase
        .from('preschool_google_data')
        .select('street_view_static_url')
        .eq('preschool_id', preschool.id)
        .single();

      if (existingData?.street_view_static_url) {
        setStreetViewUrl(existingData.street_view_static_url);
        return;
      }

      // Generate new street view
      const response = await supabase.functions.invoke('street-view-generator', {
        body: {
          lat: preschool.latitud,
          lng: preschool.longitud,
          size: '600x400',
          preschoolId: preschool.id
        }
      });

      if (response.data?.success) {
        setStreetViewUrl(response.data.data.static_url);
      }
    } catch (error) {
      console.error('Error generating street view:', error);
    }
  };

  const renderStarRating = (rating: number, reviewCount: number = 0) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating) 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : i < rating 
                    ? 'text-yellow-400 fill-yellow-400/50'
                    : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({reviewCount} recensioner)</span>
      </div>
    );
  };

  const formatOpeningHours = (hours: any) => {
    if (!hours || !hours.weekday_text) return null;
    
    return hours.weekday_text.map((day: string, index: number) => (
      <div key={index} className="text-sm">
        {day}
      </div>
    ));
  };

  if (!preschool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-foreground">
                {preschool.namn}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {preschool.huvudman}
                </Badge>
                {googleData?.google_rating && googleData.google_rating > 4 && (
                  <Badge variant="default" className="text-xs">
                    Högbetyg
                  </Badge>
                )}
              </div>
            </div>
            {onFavorite && (
              <Button
                onClick={onFavorite}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} 
                />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="photos">Bilder</TabsTrigger>
            <TabsTrigger value="reviews">Recensioner</TabsTrigger>
            <TabsTrigger value="contact">Kontakt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Address and Rating */}
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{preschool.adress}</p>
                  <p className="text-sm text-muted-foreground">{preschool.kommun}</p>
                  {googleData?.google_rating && (
                    <div className="mt-2">
                      {renderStarRating(googleData.google_rating, googleData.google_reviews_count)}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${preschool.adress}, ${preschool.kommun}`)}`, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Vägbeskrivning
                </Button>
              </div>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-nature-lake" />
                  <div>
                    <p className="text-lg font-bold">{preschool.antal_barn || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Barn totalt</p>
                    {preschool.antal_barngrupper && (
                      <p className="text-xs text-muted-foreground">
                        {preschool.antal_barngrupper} grupper
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-nature-forest" />
                  <div>
                    <p className="text-lg font-bold">
                      {preschool.andel_med_förskollärarexamen ? `${preschool.andel_med_förskollärarexamen}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Lärarexamen</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-nature-meadow" />
                  <div>
                    <p className="text-lg font-bold">
                      {preschool.personaltäthet ? preschool.personaltäthet.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Personaltäthet</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Street View */}
            {streetViewUrl && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Gatuvy</h3>
                <img 
                  src={streetViewUrl} 
                  alt="Gatuvy av förskolan"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Laddar bilder...</p>
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <Card key={index} className="overflow-hidden">
                    <img 
                      src={photo} 
                      alt={`Bild ${index + 1} av ${preschool.namn}`}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Inga bilder tillgängliga</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Laddar recensioner...</p>
              </div>
            ) : googleData?.reviews && (Array.isArray(googleData.reviews) ? googleData.reviews : JSON.parse(googleData.reviews || '[]')).length > 0 ? (
              <div className="space-y-4">
                {(Array.isArray(googleData.reviews) ? googleData.reviews : JSON.parse(googleData.reviews || '[]')).map((review: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.author_name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.time * 1000).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{review.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Inga recensioner tillgängliga</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-4">
              {googleData?.contact_phone && (
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Telefon</p>
                      <a 
                        href={`tel:${googleData.contact_phone}`}
                        className="text-sm text-nordic-blue hover:underline"
                      >
                        {googleData.contact_phone}
                      </a>
                    </div>
                  </div>
                </Card>
              )}

              {googleData?.website_url && (
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Hemsida</p>
                      <a 
                        href={googleData.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-nordic-blue hover:underline flex items-center gap-1"
                      >
                        Besök hemsida
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </Card>
              )}

              {googleData?.opening_hours && (
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium mb-2">Öppettider</p>
                      <div className="space-y-1">
                        {formatOpeningHours(JSON.parse(googleData.opening_hours))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};