import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface MapTransitionsProps {
  isMapVisible: boolean;
  children: React.ReactNode;
  onTransitionComplete?: () => void;
}

export const MapTransitions: React.FC<MapTransitionsProps> = ({
  isMapVisible,
  children,
  onTransitionComplete
}) => {
  useEffect(() => {
    if (isMapVisible) {
      const timer = setTimeout(() => {
        onTransitionComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMapVisible, onTransitionComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isMapVisible ? 1 : 0,
        scale: isMapVisible ? 1 : 0.95
      }}
      transition={{ 
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="relative w-full h-full"
    >
      {children}
      
      {/* Overlay for smooth transition effect */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isMapVisible ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/40 pointer-events-none"
        style={{ 
          backdropFilter: 'blur(2px)',
          background: 'linear-gradient(135deg, hsl(var(--background)/0.8) 0%, hsl(var(--background)/0.6) 50%, hsl(var(--background)/0.4) 100%)'
        }}
      />
    </motion.div>
  );
};