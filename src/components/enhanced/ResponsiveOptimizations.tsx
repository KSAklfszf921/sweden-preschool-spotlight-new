import React from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveOptimizationsProps {
  children: React.ReactNode;
}

export const ResponsiveOptimizations: React.FC<ResponsiveOptimizationsProps> = ({ children }) => {
  const isMobile = useIsMobile();

  const mobileVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  const desktopVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <motion.div
      variants={isMobile ? mobileVariants : desktopVariants}
      initial="initial"
      animate="animate"
      className={`
        ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}
        transition-all duration-300
      `}
    >
      {children}
    </motion.div>
  );
};

export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile 
        ? 'container-mobile px-3 max-w-full' 
        : 'container mx-auto px-6 max-w-7xl'
      }
      ${className}
    `}>
      {children}
    </div>
  );
};