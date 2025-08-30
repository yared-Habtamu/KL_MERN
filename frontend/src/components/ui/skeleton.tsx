import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="group relative overflow-hidden transition-all duration-300 ease-in-out border border-border/50 bg-gradient-to-br from-card to-card/80 h-full w-full rounded-lg">
      <div className="relative p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
        <div className="relative z-10 flex items-start justify-between h-full">
          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0 pr-3">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-20" />
            
            {/* Value skeleton */}
            <div className="space-y-1 sm:space-y-2">
              <Skeleton className="h-8 w-16 sm:h-10 sm:w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          
          {/* Icon skeleton */}
          <div className="flex-shrink-0">
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg">
      {/* Icon skeleton */}
      <div className="flex-shrink-0">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        {/* Description skeleton */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        
        {/* Timestamp skeleton */}
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export { Skeleton, CardSkeleton, ActivitySkeleton };
