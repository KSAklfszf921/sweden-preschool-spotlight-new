import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  showReviewCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewCount = 0,
  showReviewCount = true,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
      <span className={cn("font-medium", textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      {showReviewCount && reviewCount > 0 && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount} {reviewCount === 1 ? 'recension' : 'recensioner'})
        </span>
      )}
    </div>
  );
};