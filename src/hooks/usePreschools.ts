import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore, type Preschool } from '@/stores/mapStore';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useBackgroundGoogleEnrichment } from './useBackgroundGoogleEnrichment';

export const usePreschools = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPreschools, setLoading } = useMapStore();
  const { startBackgroundEnrichment } = useBackgroundGoogleEnrichment();
  
  // Enable real-time updates
  useRealTimeUpdates();

  const fetchPreschools = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);

      // Fetch ALL preschools with correct column casing
      const { data: preschoolsData, error: preschoolsError } = await supabase
        .from('Förskolor')
        .select(`
          id,
          "Namn",
          "Kommun", 
          "Adress",
          "Latitud",
          "Longitud",
          "Antal barn",
          "Huvudman",
          "Personaltäthet",
          "Andel med förskollärarexamen",
          "Antal barngrupper",
          preschool_google_data (
            google_rating,
            google_reviews_count,
            reviews,
            contact_phone,
            website_url,
            opening_hours
          )
        `);

      if (preschoolsError) throw preschoolsError;

      // Transform preschools - keep NULL coordinates as null, don't convert to 0
      const transformedPreschools: Preschool[] = (preschoolsData || []).map(preschool => ({
        id: preschool.id,
        namn: preschool.Namn,
        kommun: preschool.Kommun,
        adress: preschool.Adress || '',
        // Keep NULL coordinates as null instead of converting to 0
        latitud: preschool.Latitud !== null ? preschool.Latitud : null,
        longitud: preschool.Longitud !== null ? preschool.Longitud : null,
        antal_barn: preschool["Antal barn"],
        huvudman: preschool.Huvudman,
        personaltäthet: preschool.Personaltäthet,
        andel_med_förskollärarexamen: preschool["Andel med förskollärarexamen"],
        antal_barngrupper: preschool["Antal barngrupper"],
        google_rating: preschool.preschool_google_data?.[0]?.google_rating,
        google_reviews_count: preschool.preschool_google_data?.[0]?.google_reviews_count,
        google_reviews: preschool.preschool_google_data?.[0]?.reviews,
        contact_phone: preschool.preschool_google_data?.[0]?.contact_phone,
        website_url: preschool.preschool_google_data?.[0]?.website_url,
        opening_hours: preschool.preschool_google_data?.[0]?.opening_hours,
      }));

      // Find preschools that actually need geocoding (NULL or 0 coordinates)
      const missingCoords = transformedPreschools.filter(p => 
        p.latitud === null || p.longitud === null || p.latitud === 0 || p.longitud === 0
      );
      
      if (missingCoords.length > 0) {
        console.log(`Found ${missingCoords.length} preschools needing geocoding. Triggering background processing...`);
        
        // Prepare data for geocoding service with proper format
        const preschoolsForGeocoding = missingCoords.map(p => ({
          id: p.id,
          Namn: p.namn,
          Adress: p.adress,
          Kommun: p.kommun,
          Latitud: p.latitud,
          Longitud: p.longitud
        }));
        
        // Trigger geocoding in background with smaller batches
        supabase.functions.invoke('geocoding-service', {
          body: { preschools: preschoolsForGeocoding.slice(0, 25) } // Smaller batches for reliability
        }).then(response => {
          console.log('Geocoding service response:', response);
        }).catch(error => {
          console.error('Geocoding service error:', error);
        });
      }

      setPreschools(transformedPreschools);
      console.log(`Loaded ${transformedPreschools.length} preschools`);

      // Start discrete background Google data enrichment
      startBackgroundEnrichment();

    } catch (err) {
      console.error('Error fetching preschools:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreschools();
  }, []);

  return {
    isLoading,
    error,
    refetch: fetchPreschools
  };
};