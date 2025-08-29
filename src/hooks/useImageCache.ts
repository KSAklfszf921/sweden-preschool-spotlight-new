import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  data: string[];
  timestamp: number;
  expiry: number;
}

export const useImageCache = () => {
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  const getImages = useCallback(async (preschoolId: string): Promise<string[]> => {
    const now = Date.now();
    const cached = cache.current.get(preschoolId);
    
    // Return cached data if valid
    if (cached && now < cached.expiry) {
      return cached.data;
    }

    setIsLoading(true);
    try {
      const { data: imageData, error } = await supabase
        .from('preschool_images')
        .select('image_url')
        .eq('preschool_id', preschoolId)
        .eq('image_type', 'google_places')
        .order('created_at');

      if (error) {
        console.error('Error fetching images:', error);
        return [];
      }

      const imageUrls = imageData?.map(img => img.image_url) || [];
      
      // Cache the result
      cache.current.set(preschoolId, {
        data: imageUrls,
        timestamp: now,
        expiry: now + CACHE_DURATION
      });

      return imageUrls;
    } catch (error) {
      console.error('Error in image cache:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const preloadImages = useCallback(async (preschoolIds: string[]) => {
    const promises = preschoolIds.map(id => getImages(id));
    await Promise.allSettled(promises);
  }, [getImages]);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    getImages,
    preloadImages,
    clearCache,
    isLoading
  };
};