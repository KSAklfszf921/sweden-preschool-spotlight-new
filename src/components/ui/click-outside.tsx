import React, { useEffect, useRef } from 'react';

interface ClickOutsideProps {
  onClickOutside: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ClickOutside: React.FC<ClickOutsideProps> = ({
  onClickOutside,
  children,
  className = '',
  disabled = false
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    // Add event listener with capture phase to ensure it runs before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClickOutside, disabled]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};