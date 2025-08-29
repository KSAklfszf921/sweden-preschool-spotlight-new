import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore } from '@/stores/mapStore';
import { toast } from 'sonner';

export const useRealTimeUpdates = () => {
  const { preschools, setPreschools, updatePreschool, setLoading } = useMapStore();

  const handleInsert = useCallback((payload: any) => {
    const newPreschool = {
      id: payload.new.id,
      namn: payload.new.Namn,
      kommun: payload.new.Kommun,
      adress: payload.new.Adress || '',
      latitud: payload.new.Latitud || 0,
      longitud: payload.new.Longitud || 0,
      antal_barn: payload.new["Antal barn"],
      huvudman: payload.new.Huvudman,
      personaltäthet: payload.new.Personaltäthet,
      andel_med_förskollärarexamen: payload.new["Andel med förskollärarexamen"],
      antal_barngrupper: payload.new["Antal barngrupper"],
    };

    setPreschools([...preschools, newPreschool]);
    toast.success(`Ny förskola tillagd: ${newPreschool.namn}`);
  }, [preschools, setPreschools]);

  const handleUpdate = useCallback((payload: any) => {
    const updatedPreschool = {
      id: payload.new.id,
      namn: payload.new.Namn,
      kommun: payload.new.Kommun,
      adress: payload.new.Adress || '',
      latitud: payload.new.Latitud || 0,
      longitud: payload.new.Longitud || 0,
      antal_barn: payload.new["Antal barn"],
      huvudman: payload.new.Huvudman,
      personaltäthet: payload.new.Personaltäthet,
      andel_med_förskollärarexamen: payload.new["Andel med förskollärarexamen"],
      antal_barngrupper: payload.new["Antal barngrupper"],
    };

    // Check if coordinates were added/updated
    const oldCoords = { lat: payload.old?.Latitud, lng: payload.old?.Longitud };
    const newCoords = { lat: payload.new.Latitud, lng: payload.new.Longitud };
    
    if ((oldCoords.lat === null || oldCoords.lat === 0) && newCoords.lat !== null && newCoords.lat !== 0) {
      toast.success(`Koordinater tillagda för ${updatedPreschool.namn}!`);
    } else if (oldCoords.lat !== newCoords.lat || oldCoords.lng !== newCoords.lng) {
      toast.info(`Koordinater uppdaterade för ${updatedPreschool.namn}`);
    } else {
      toast.info(`Förskola uppdaterad: ${updatedPreschool.namn}`);
    }

    updatePreschool(updatedPreschool);
  }, [updatePreschool]);

  const handleDelete = useCallback((payload: any) => {
    const deletedId = payload.old.id;
    const remainingPreschools = preschools.filter(p => p.id !== deletedId);
    setPreschools(remainingPreschools);
    toast.error(`Förskola borttagen: ${payload.old.Namn}`);
  }, [preschools, setPreschools]);

  useEffect(() => {
    // Subscribe to preschool changes
    const preschoolSubscription = supabase
      .channel('preschool_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'Förskolor' }, 
        handleInsert
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'Förskolor' }, 
        handleUpdate
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'Förskolor' }, 
        handleDelete
      )
      .subscribe();

    // Subscribe to Google data changes
    const googleDataSubscription = supabase
      .channel('google_data_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'preschool_google_data' },
        (payload) => {
          console.log('Google data update received:', payload);
          // Silently update the affected preschool's Google data in state
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const preschoolId = payload.new?.preschool_id;
            if (preschoolId) {
              // Find and update the specific preschool in the store
              const currentPreschools = useMapStore.getState().preschools;
              const updatedPreschools = currentPreschools.map(p => {
                if (p.id === preschoolId) {
                  return {
                    ...p,
                    google_rating: payload.new?.google_rating,
                    google_reviews_count: payload.new?.google_reviews_count,
                    google_reviews: payload.new?.reviews,
                    contact_phone: payload.new?.contact_phone,
                    website_url: payload.new?.website_url,
                    opening_hours: payload.new?.opening_hours,
                  };
                }
                return p;
              });
              setPreschools(updatedPreschools);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to image changes
    const imageSubscription = supabase
      .channel('image_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'preschool_images' },
        (payload) => {
          console.log('Image update received:', payload);
          toast.info('Nya bilder tillgängliga');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(preschoolSubscription);
      supabase.removeChannel(googleDataSubscription);
      supabase.removeChannel(imageSubscription);
    };
  }, [handleInsert, handleUpdate, handleDelete]);

  return {
    // Connection status could be exposed here if needed
  };
};