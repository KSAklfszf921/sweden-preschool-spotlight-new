import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBackgroundGoogleEnrichment = () => {
  const isRunningRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const enrichPreschoolsSilently = useCallback(async () => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    
    try {
      // Get existing preschool IDs with Google data
      const { data: existingGoogleData } = await supabase
        .from('preschool_google_data')
        .select('preschool_id');

      const existingIds = existingGoogleData?.map(item => item.preschool_id) || [];

      // Get a small batch of preschools without Google data
      const { data: preschoolsWithoutData } = await supabase
        .from('Förskolor')
        .select('id, "Namn", "Adress", "Latitud", "Longitud"')
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null)
        .not('id', 'in', existingIds.length > 0 ? existingIds : ['00000000-0000-0000-0000-000000000000'])
        .limit(5); // Very small batches for discrete processing

      if (preschoolsWithoutData && preschoolsWithoutData.length > 0) {
        // Process one preschool at a time to be as discrete as possible
        for (const preschool of preschoolsWithoutData) {
          try {
            await supabase.functions.invoke('google-places-enricher', {
              body: {
                preschoolId: preschool.id,
                lat: preschool.Latitud,
                lng: preschool.Longitud,
                address: preschool.Adress,
                name: preschool.Namn
              }
            });
            
            // Wait between each request to be respectful to APIs
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            console.error(`Silent enrichment error for ${preschool.id}:`, error);
            // Continue with next preschool even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Background enrichment error:', error);
    } finally {
      isRunningRef.current = false;
      
      // Schedule next run in 5 minutes
      timeoutRef.current = setTimeout(() => {
        enrichPreschoolsSilently();
      }, 5 * 60 * 1000);
    }
  }, []);

  const startBackgroundEnrichment = useCallback(() => {
    // Start enrichment after 30 seconds to let the initial load complete
    timeoutRef.current = setTimeout(() => {
      enrichPreschoolsSilently();
    }, 30000);
  }, [enrichPreschoolsSilently]);

  const stopBackgroundEnrichment = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopBackgroundEnrichment();
    };
  }, [stopBackgroundEnrichment]);

  return {
    startBackgroundEnrichment,
    stopBackgroundEnrichment,
    isRunning: isRunningRef.current
  };
};