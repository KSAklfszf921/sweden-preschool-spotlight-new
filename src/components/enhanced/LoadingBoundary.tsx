import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultLoadingSkeleton = ({ className }: { className?: string }) => (
  <Card className={`p-4 ${className}`}>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  </Card>
);

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({ 
  children, 
  fallback, 
  className 
}) => {
  return (
    <Suspense fallback={fallback || <DefaultLoadingSkeleton className={className} />}>
      {children}
    </Suspense>
  );
};

export const withLoadingBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <LoadingBoundary fallback={fallback}>
      <Component {...props} />
    </LoadingBoundary>
  );
};