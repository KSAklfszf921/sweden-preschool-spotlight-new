import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMapStore } from '@/stores/mapStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, Users, GraduationCap, Star, Phone, Globe, Camera, Navigation, Plus, Route, Eye, Clock, MessageSquare, ExternalLink, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from '@/components/ui/star-rating';
import { DirectionsPanel } from '@/components/directions/DirectionsPanel';
import { StreetViewPanel } from '@/components/streetview/StreetViewPanel';
import { ClickOutside } from '@/components/ui/click-outside';
interface GoogleData {
  google_rating?: number;
  google_reviews_count?: number;
  google_photos?: string[];
  website_url?: string;
  contact_phone?: string;
  formatted_address?: string;
  opening_hours?: any;
  reviews?: any[];
  street_view_pano_id?: string;
}
export const PreschoolDetails: React.FC = () => {
  const {
    selectedPreschool,
    setSelectedPreschool
  } = useMapStore();
  const {
    addToComparison,
    removeFromComparison,
    isInComparison
  } = useComparisonStore();
  const [showDirections, setShowDirections] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | undefined>();
  const [images, setImages] = useState<string[]>([]);
  const [streetViewUrl, setStreetViewUrl] = useState<string>('');
  useEffect(() => {
    if (selectedPreschool) {
      fetchGoogleData();
      fetchStoredImages();
      generateStreetView();
    }
  }, [selectedPreschool]);
  const fetchGoogleData = async () => {
    if (!selectedPreschool) return;
    setIsLoadingGoogle(true);
    try {
      // First, check if we have cached Google data
      const {
        data: cachedData
      } = await supabase.from('preschool_google_data').select('*').eq('preschool_id', selectedPreschool.id).single();
      if (cachedData && cachedData.last_updated) {
        const lastUpdated = new Date(cachedData.last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        // Use cached data if it's less than 24 hours old
        if (hoursDiff < 24) {
          setGoogleData({
            google_rating: cachedData.google_rating,
            google_reviews_count: cachedData.google_reviews_count,
            google_photos: cachedData.google_photos || [],
            website_url: cachedData.website_url,
            contact_phone: cachedData.contact_phone,
            formatted_address: cachedData.formatted_address,
            opening_hours: cachedData.opening_hours,
            reviews: Array.isArray(cachedData.reviews) ? cachedData.reviews : typeof cachedData.reviews === 'string' ? JSON.parse(cachedData.reviews || '[]') : [],
            street_view_pano_id: cachedData.street_view_pano_id
          });

          // Load photo URLs
          if (cachedData.google_photos && cachedData.google_photos.length > 0) {
            loadPhotoUrls(cachedData.google_photos);
          }
          setIsLoadingGoogle(false);
          return;
        }
      }

      // Fetch fresh data from Google Places enricher
      const {
        data,
        error
      } = await supabase.functions.invoke('google-places-enricher', {
        body: {
          preschoolId: selectedPreschool.id,
          lat: selectedPreschool.latitud,
          lng: selectedPreschool.longitud,
          address: selectedPreschool.adress,
          name: selectedPreschool.namn
        }
      });
      if (error) throw error;
      if (data?.success) {
        // Refetch cached data after enrichment
        const {
          data: refreshedData
        } = await supabase.from('preschool_google_data').select('*').eq('preschool_id', selectedPreschool.id).single();
        if (refreshedData) {
          setGoogleData({
            ...refreshedData,
            google_photos: Array.isArray(refreshedData.google_photos) ? refreshedData.google_photos : [],
            reviews: Array.isArray(refreshedData.reviews) ? refreshedData.reviews : typeof refreshedData.reviews === 'string' ? JSON.parse(refreshedData.reviews || '[]') : []
          });
          if (refreshedData.google_photos && refreshedData.google_photos.length > 0) {
            loadPhotoUrls(refreshedData.google_photos);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Google data:', error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };
  const fetchStoredImages = async () => {
    if (!selectedPreschool) return;
    try {
      const {
        data: imageData,
        error
      } = await supabase.from('preschool_images').select('image_url, image_type').eq('preschool_id', selectedPreschool.id).eq('image_type', 'google_places').order('created_at');
      if (error) {
        console.error('Error fetching stored images:', error);
        return;
      }
      if (imageData && imageData.length > 0) {
        setImages(imageData.map(img => img.image_url));
      }
    } catch (error) {
      console.error('Error fetching stored images:', error);
    }
  };
  const loadPhotoUrls = async (photoReferences: string[]) => {
    try {
      const photoUrls = await Promise.all(photoReferences.slice(0, 3).map(async ref => {
        const {
          data
        } = await supabase.functions.invoke('google-places', {
          body: {
            action: 'getPhoto',
            photoReference: ref,
            maxWidth: 400
          }
        });
        return data?.data?.photoUrl;
      }));
      setPhotos(photoUrls.filter(Boolean));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };
  const generateStreetView = async () => {
    if (!selectedPreschool) return;
    try {
      const response = await supabase.functions.invoke('street-view-generator', {
        body: {
          lat: selectedPreschool.latitud,
          lng: selectedPreschool.longitud,
          size: '600x400'
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
    return <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : i < rating ? 'text-yellow-400 fill-yellow-400/50' : 'text-muted-foreground'}`} />)}
        </div>
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({reviewCount} recensioner)</span>
      </div>;
  };
  const formatOpeningHours = (hours: any) => {
    if (!hours || !hours.weekday_text) return null;
    return hours.weekday_text.map((day: string, index: number) => <div key={index} className="text-sm">
        {day}
      </div>);
  };
  const openDirections = () => {
    if (selectedPreschool) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPreschool.latitud},${selectedPreschool.longitud}`;
      window.open(url, '_blank');
    }
  };
  const handleComparisonToggle = () => {
    if (!selectedPreschool) return;
    if (isInComparison(selectedPreschool.id)) {
      removeFromComparison(selectedPreschool.id);
    } else {
      addToComparison(selectedPreschool);
    }
  };
  if (!selectedPreschool) return null;

  // Use stored images if available, otherwise fall back to photos
  const displayImages = images.length > 0 ? images : photos;
  return <AnimatePresence>
      <ClickOutside onClickOutside={() => setSelectedPreschool(null)}>
        <motion.div initial={{
        opacity: 0,
        x: 300
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: 300
      }} transition={{
        duration: 0.3
      }} className="fixed right-4 top-4 bottom-4 w-96 z-50">
        <Card className="h-full bg-card/95 backdrop-blur-sm border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border py-[15px]">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {selectedPreschool.namn}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedPreschool.adress}, {selectedPreschool.kommun}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPreschool(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Google Rating */}
            {googleData?.google_rating && <div className="mt-3">
                {renderStarRating(googleData.google_rating, googleData.google_reviews_count)}
                {googleData.google_rating >= 4.5 && <Badge variant="default" className="ml-2 text-xs">
                    Högbetyg
                  </Badge>}
              </div>}
          </div>

          {/* Content - Tabbed Interface */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Översikt</TabsTrigger>
                <TabsTrigger value="photos">Bilder</TabsTrigger>
                <TabsTrigger value="reviews">Recensioner</TabsTrigger>
                <TabsTrigger value="contact">Kontakt</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6 space-y-4 py-0 px-[10px]">
                {/* Street View at top */}
                {streetViewUrl && (
                  <Card className="p-0 overflow-hidden">
                    <img src={streetViewUrl} alt="Gatuvy av förskolan" className="w-full h-48 object-cover" />
                  </Card>
                )}

                {/* Key Metrics in two columns */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{selectedPreschool.antal_barn || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Antal barn</p>
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="text-center">
                      <div className="mx-auto mb-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedPreschool.antal_barngrupper || 'N/A'}</span>
                      </div>
                      <p className="text-lg font-bold">{selectedPreschool.antal_barngrupper || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Grupper</p>
                    </div>
                  </Card>

                  {selectedPreschool.antal_barn && selectedPreschool.antal_barngrupper && (
                    <Card className="p-3">
                      <div className="text-center">
                        <div className="mx-auto mb-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">∅</span>
                        </div>
                        <p className="text-lg font-bold">{Math.round(selectedPreschool.antal_barn / selectedPreschool.antal_barngrupper)}</p>
                        <p className="text-xs text-muted-foreground">Barngruppsstorlek</p>
                      </div>
                    </Card>
                  )}

                  {selectedPreschool.personaltäthet && (
                    <Card className="p-3">
                      <div className="text-center">
                        <Star className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold">{selectedPreschool.personaltäthet.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Personaltäthet</p>
                      </div>
                    </Card>
                  )}

                  {selectedPreschool.andel_med_förskollärarexamen && (
                    <Card className="p-3 col-span-2">
                      <div className="text-center">
                        <GraduationCap className="h-4 w-4 text-primary mx-auto mb-2" />
                        <p className="text-lg font-bold">{Math.round(selectedPreschool.andel_med_förskollärarexamen)}%</p>
                        <p className="text-xs text-muted-foreground">Andel förskollärare</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Basic Info */}
                <Card className="p-3">
                  <h3 className="font-semibold mb-2 text-sm">Information</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Huvudman:</span>
                    <Badge variant="secondary" className="text-xs">{selectedPreschool.huvudman}</Badge>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="p-6">
                {isLoadingGoogle ? <div className="text-center py-8">
                    <p className="text-muted-foreground">Laddar bilder...</p>
                  </div> : displayImages.length > 0 ? <div className="grid grid-cols-1 gap-4">
                    {displayImages.map((imageUrl, index) => <Card key={index} className="overflow-hidden">
                        <img src={imageUrl} alt={`Bild ${index + 1} av ${selectedPreschool.namn}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                      </Card>)}
                  </div> : <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Inga bilder tillgängliga</p>
                  </div>}
              </TabsContent>

              <TabsContent value="reviews" className="p-6">
                {isLoadingGoogle ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Laddar recensioner...</p>
                  </div>
                ) : googleData?.reviews && (Array.isArray(googleData.reviews) ? googleData.reviews : JSON.parse(googleData.reviews || '[]')).length > 0 ? (
                  <div className="space-y-4">
                    {/* Average rating summary */}
                    {googleData.google_rating && (
                      <Card className="p-4 bg-yellow-50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {renderStarRating(googleData.google_rating, googleData.google_reviews_count)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Baserat på {googleData.google_reviews_count || 0} recensioner
                          </p>
                        </div>
                      </Card>
                    )}
                    
                    {/* Individual reviews */}
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

              <TabsContent value="contact" className="p-6">
                <div className="space-y-4">
                  {googleData?.contact_phone && <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Telefon</p>
                          <a href={`tel:${googleData.contact_phone}`} className="text-sm text-primary hover:underline">
                            {googleData.contact_phone}
                          </a>
                        </div>
                      </div>
                    </Card>}

                  {googleData?.website_url && <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Hemsida</p>
                          <a href={googleData.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Besök hemsida
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </Card>}

                  {googleData?.opening_hours && <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium mb-2">Öppettider</p>
                          <div className="space-y-1">
                            {formatOpeningHours(JSON.parse(googleData.opening_hours))}
                          </div>
                        </div>
                      </div>
                    </Card>}

                  {/* Loading state */}
                  {isLoadingGoogle && <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm">Hämtar kontaktinformation...</span>
                    </div>}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-border space-y-2 px-[20px] py-[5px]">
            <Button onClick={handleComparisonToggle} variant={isInComparison(selectedPreschool.id) ? "destructive" : "secondary"} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {isInComparison(selectedPreschool.id) ? 'Ta bort från jämförelse' : 'Lägg till jämförelse'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowDirections(!showDirections)} variant="outline" size="sm">
                <Route className="w-4 h-4 mr-2" />
                Restid
              </Button>
              <Button onClick={() => setShowStreetView(!showStreetView)} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Gatuvy
              </Button>
            </div>
            
          </div>
        </Card>
        </motion.div>
      </ClickOutside>

      {/* Additional Panels */}
      {showDirections && <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} exit={{
      opacity: 0,
      y: 20
    }} className="fixed right-4 bottom-4 w-96 z-40">
          <DirectionsPanel preschool={selectedPreschool} userLocation={userLocation} onClose={() => setShowDirections(false)} />
        </motion.div>}

      {showStreetView && <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} exit={{
      opacity: 0,
      y: 20
    }} className="fixed left-4 bottom-4 w-96 z-40">
          <StreetViewPanel preschool={selectedPreschool} onClose={() => setShowStreetView(false)} />
        </motion.div>}

    </AnimatePresence>;
};