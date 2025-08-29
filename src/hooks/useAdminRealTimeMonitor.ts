import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminRealTimeMonitorProps {
  onDataChange?: () => void;
  isEnabled?: boolean;
}

export const useAdminRealTimeMonitor = ({ 
  onDataChange, 
  isEnabled = true 
}: AdminRealTimeMonitorProps = {}) => {

  const handleCriticalChange = useCallback((payload: any, tableName: string) => {
    console.log(`Admin Monitor: Critical change in ${tableName}:`, payload);
    
    // Show admin-specific notifications for critical changes
    if (payload.eventType === 'INSERT') {
      toast.success(`Ny data tillagd i ${tableName}`, {
        description: `${payload.eventType} operation utförd`,
        duration: 5000
      });
    } else if (payload.eventType === 'UPDATE') {
      toast.info(`Data uppdaterad i ${tableName}`, {
        description: `Rad ${payload.new?.id || 'unknown'} modifierad`,
        duration: 3000
      });
    } else if (payload.eventType === 'DELETE') {
      toast.error(`Data borttagen från ${tableName}`, {
        description: `Rad ${payload.old?.id || 'unknown'} raderad`,
        duration: 5000
      });
    }

    // Trigger data refresh if callback provided
    if (onDataChange) {
      setTimeout(onDataChange, 500); // Small delay to ensure DB consistency
    }
  }, [onDataChange]);

  useEffect(() => {
    if (!isEnabled) return;

    console.log('Admin Real-time Monitor: Starting subscriptions');

    // Monitor Förskolor table for coordinate updates and new entries
    const preschoolSubscription = supabase
      .channel('admin_preschool_monitor')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Förskolor' },
        (payload) => handleCriticalChange(payload, 'Förskolor')
      )
      .subscribe();

    // Monitor Google data updates
    const googleDataSubscription = supabase
      .channel('admin_google_monitor')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'preschool_google_data' },
        (payload) => handleCriticalChange(payload, 'Google Data')
      )
      .subscribe();

    // Monitor image updates
    const imageSubscription = supabase
      .channel('admin_image_monitor')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'preschool_images' },
        (payload) => handleCriticalChange(payload, 'Preschool Images')
      )
      .subscribe();

    // Monitor user activity tables for admin insights
    const favoritesSubscription = supabase
      .channel('admin_favorites_monitor')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_favorites' },
        (payload) => {
          console.log('Admin Monitor: User favorites activity:', payload);
          if (onDataChange) {
            setTimeout(onDataChange, 1000);
          }
        }
      )
      .subscribe();

    const searchHistorySubscription = supabase
      .channel('admin_search_monitor')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_search_history' },
        (payload) => {
          console.log('Admin Monitor: Search activity:', payload);
          if (onDataChange) {
            setTimeout(onDataChange, 1000);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Admin Real-time Monitor: Cleaning up subscriptions');
      supabase.removeChannel(preschoolSubscription);
      supabase.removeChannel(googleDataSubscription);
      supabase.removeChannel(imageSubscription);
      supabase.removeChannel(favoritesSubscription);
      supabase.removeChannel(searchHistorySubscription);
    };
  }, [isEnabled, handleCriticalChange]);

  return {
    // Could return monitoring stats or controls here if needed
    isMonitoring: isEnabled
  };
};