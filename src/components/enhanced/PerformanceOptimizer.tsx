import React, { memo, useMemo, useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

// Memoized component wrapper for expensive operations
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = memo(({ children }) => {
  return <>{children}</>;
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

// Hook for optimized data processing
export const useOptimizedData = () => {
  const { preschools, filteredPreschools, searchFilters } = useMapStore();

  const optimizedData = useMemo(() => {
    const start = performance.now();
    
    // Group preschools by kommun for faster filtering
    const preschoolsByKommun = preschools.reduce((acc, preschool) => {
      const kommun = preschool.kommun;
      if (!acc[kommun]) {
        acc[kommun] = [];
      }
      acc[kommun].push(preschool);
      return acc;
    }, {} as Record<string, typeof preschools>);

    // Pre-calculate statistics for better performance
    const statisticsCache = {
      totalPreschools: preschools.length,
      totalChildren: preschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0),
      kommuner: Object.keys(preschoolsByKommun).sort(),
      avgStaffDensity: preschools
        .filter(p => p.personaltäthet && p.personaltäthet > 0)
        .reduce((sum, p, _, arr) => sum + (p.personaltäthet || 0) / arr.length, 0)
    };

    const end = performance.now();
    console.log(`Data optimization took ${end - start} milliseconds`);

    return {
      preschoolsByKommun,
      statisticsCache,
      processingTime: end - start
    };
  }, [preschools]);

  const filteredData = useMemo(() => {
    if (!searchFilters || Object.keys(searchFilters).length === 0) {
      return filteredPreschools;
    }

    // Use pre-grouped data for faster filtering
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      const selectedKommun = searchFilters.kommuner[0];
      return optimizedData.preschoolsByKommun[selectedKommun] || [];
    }

    return filteredPreschools;
  }, [filteredPreschools, searchFilters, optimizedData.preschoolsByKommun]);

  return {
    optimizedData,
    filteredData,
    performanceMetrics: {
      totalPreschools: preschools.length,
      filteredCount: filteredData.length,
      processingTime: optimizedData.processingTime
    }
  };
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Virtualization helper for large lists
export const useVirtualization = (items: any[], itemHeight: number = 50, containerHeight: number = 400) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  return {
    visibleItems,
    setScrollTop,
    totalHeight: visibleItems.totalHeight
  };
};

export default PerformanceOptimizer;