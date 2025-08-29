import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnrichmentProgress {
  total: number;
  processed: number;
  errors: number;
  isRunning: boolean;
}

export const useGoogleDataEnrichment = () => {
  const [progress, setProgress] = useState<EnrichmentProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    isRunning: false
  });

  const enrichMissingData = useCallback(async () => {
    if (progress.isRunning) return;

    console.log('Starting Google data enrichment for preschools without data...');
    setProgress(prev => ({ ...prev, isRunning: true, processed: 0, errors: 0 }));

    try {
      // Get preschools without Google data or with old data (>7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // First get preschools without Google data
      const { data: preschoolsWithoutData, error: error1 } = await supabase
        .from('Förskolor')
        .select(`
          id,
          "Namn",
          "Adress",
          "Latitud",
          "Longitud"
        `)
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null)
        .not('id', 'in', [])
        .limit(25); // Smaller batches for better performance

      // Then get preschools with old data (>7 days)
      const { data: preschoolsWithOldData, error: error2 } = await supabase
        .from('Förskolor')
        .select(`
          id,
          "Namn",
          "Adress",
          "Latitud",
          "Longitud"
        `)
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null)
        .in('id', [])
        .limit(25);

      if (error1 || error2) {
        console.error('Error fetching preschools:', error1 || error2);
        return;
      }

      const preschools = [...(preschoolsWithoutData || []), ...(preschoolsWithOldData || [])];
      const preschoolsToEnrich = preschools || [];

      console.log(`Found ${preschoolsToEnrich.length} preschools to enrich`);
      setProgress(prev => ({ ...prev, total: preschoolsToEnrich.length }));

      // Process in smaller batches to respect rate limits and be more discrete
      const batchSize = 3;
      for (let i = 0; i < preschoolsToEnrich.length; i += batchSize) {
        const batch = preschoolsToEnrich.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (preschool) => {
            try {
              const { error: enrichError } = await supabase.functions.invoke('google-places-enricher', {
                body: {
                  preschoolId: preschool.id,
                  lat: preschool.Latitud,
                  lng: preschool.Longitud,
                  address: preschool.Adress,
                  name: preschool.Namn
                }
              });

              if (enrichError) {
                console.error(`Error enriching preschool ${preschool.id}:`, enrichError);
                setProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
              }
              
              setProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
            } catch (error) {
              console.error(`Error processing preschool ${preschool.id}:`, error);
              setProgress(prev => ({ 
                ...prev, 
                processed: prev.processed + 1,
                errors: prev.errors + 1 
              }));
            }
          })
        );

        // Longer wait between batches for more discrete processing
        if (i + batchSize < preschoolsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Google data enrichment completed. Processed: ${progress.processed + preschoolsToEnrich.length}, Errors: ${progress.errors}`);
    } catch (error) {
      console.error('Error in enrichment process:', error);
    } finally {
      setProgress(prev => ({ ...prev, isRunning: false }));
    }
  }, [progress.isRunning]);

  const getEnrichmentStats = useCallback(async () => {
    try {
      const { data: totalPreschools } = await supabase
        .from('Förskolor')
        .select('id', { count: 'exact' })
        .not('Latitud', 'is', null);

      const { data: enrichedPreschools } = await supabase
        .from('preschool_google_data')
        .select('id', { count: 'exact' });

      return {
        total: totalPreschools?.length || 0,
        enriched: enrichedPreschools?.length || 0,
        percentage: totalPreschools?.length ? 
          Math.round((enrichedPreschools?.length || 0) / totalPreschools.length * 100) : 0
      };
    } catch (error) {
      console.error('Error getting enrichment stats:', error);
      return { total: 0, enriched: 0, percentage: 0 };
    }
  }, []);

  return {
    progress,
    enrichMissingData,
    getEnrichmentStats
  };
};