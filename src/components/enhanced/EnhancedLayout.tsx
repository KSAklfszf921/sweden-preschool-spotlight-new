import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  className?: string;
  showAnimation?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  className,
  showAnimation = true
}) => {
  if (!showAnimation) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative", className)}
    >
      <motion.div variants={itemVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
};

export const EnhancedPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 80,
        damping: 20
      }}
      className={cn(
        "glass-effect rounded-xl border border-border/20 shadow-nordic",
        "hover:shadow-glow transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
};