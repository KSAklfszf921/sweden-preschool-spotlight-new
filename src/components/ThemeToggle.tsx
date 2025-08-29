import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getNextTheme = () => {
    switch (theme) {
      case 'light': return 'dark';
      case 'dark': return 'system';
      case 'system': return 'light';
      default: return 'light';
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light': return 'Ljust tema';
      case 'dark': return 'Mörkt tema';
      case 'system': return 'Systemtema';
      default: return 'Ljust tema';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(getNextTheme())}
      className="relative text-muted-foreground hover:text-foreground transition-colors"
      title={getLabel()}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.div>
    </Button>
  );
};