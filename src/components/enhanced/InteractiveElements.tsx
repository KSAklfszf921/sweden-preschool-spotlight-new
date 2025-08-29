import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={onClick}
        variant={variant}
        size={size}
        disabled={disabled}
        className={cn(
          "transition-all duration-200 hover:shadow-glow",
          className
        )}
      >
        {children}
      </Button>
    </motion.div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className,
  intensity = 'subtle'
}) => {
  const intensityMap = {
    subtle: { y: [-2, 2, -2], duration: 4 },
    medium: { y: [-5, 5, -5], duration: 3 },
    strong: { y: [-10, 10, -10], duration: 2 }
  };

  const config = intensityMap[intensity];

  return (
    <motion.div
      animate={{
        y: config.y,
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface PulseElementProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const PulseElement: React.FC<PulseElementProps> = ({
  children,
  className,
  color = 'hsl(var(--primary))'
}) => {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}/0.2`,
          `0 0 0 10px ${color}/0`,
          `0 0 0 0 ${color}/0`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
};