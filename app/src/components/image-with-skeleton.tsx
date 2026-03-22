import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className, 
  containerClassName,
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-inherit" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}
