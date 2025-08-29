import { useState, useEffect, useCallback } from 'react';

interface ProgressiveAnimationConfig {
  totalItems: number;
  batchSize: number;
  delayBetweenBatches: number;
  itemDelay: number;
}

export const useProgressiveAnimation = (config: ProgressiveAnimationConfig) => {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const { totalItems, batchSize, delayBetweenBatches, itemDelay } = config;
  const totalBatches = Math.ceil(totalItems / batchSize);

  const startAnimation = useCallback(() => {
    if (currentBatch >= totalBatches) {
      setIsComplete(true);
      return;
    }

    const startIndex = currentBatch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, totalItems);

    // Add items in current batch with staggered delay
    for (let i = startIndex; i < endIndex; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(i));
      }, (i - startIndex) * itemDelay);
    }

    // Move to next batch
    setTimeout(() => {
      setCurrentBatch(prev => prev + 1);
    }, batchSize * itemDelay + delayBetweenBatches);
  }, [currentBatch, totalBatches, batchSize, itemDelay, delayBetweenBatches, totalItems]);

  useEffect(() => {
    if (currentBatch < totalBatches && !isComplete) {
      startAnimation();
    }
  }, [currentBatch, startAnimation, totalBatches, isComplete]);

  const reset = useCallback(() => {
    setCurrentBatch(0);
    setVisibleItems(new Set());
    setIsComplete(false);
  }, []);

  return {
    visibleItems,
    isComplete,
    progress: Math.min((visibleItems.size / totalItems) * 100, 100),
    reset,
    start: () => setCurrentBatch(0)
  };
};