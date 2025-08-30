import { Card, CardContent } from '@/components/ui/card';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  title: string;
  value: string | number;
  icon: typeof LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  trendLabel?: string;
  className?: string;
}

function formatTrend(trend: number) {
  return (Math.round(trend * 10) / 10).toFixed(1);
}

export function InfoCard({ title, value, icon: Icon, trend, trendLabel, className }: InfoCardProps) {
  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-300 ease-in-out',
      'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1',
      'border border-border/50 hover:border-border',
      'bg-gradient-to-br from-card to-card/80',
      'h-full w-full',
      className
    )}>
      <CardContent className="relative p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex items-start justify-between h-full">
          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0 pr-3">
            {/* Title */}
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight line-clamp-2">
              {title}
            </p>
            
            {/* Value */}
            <div className="space-y-1 sm:space-y-2">
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground leading-none tracking-tight">
                {value}
              </p>
              
              {/* Trend */}
              {trend && (
                <div className="flex items-center space-x-1">
                  <span
                    className={cn(
                      'text-xs font-semibold leading-none',
                      trend.isPositive 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {trend.isPositive ? '+' : '-'}{formatTrend(Math.abs(trend.value))}%
                  </span>
                  <span className="text-xs text-muted-foreground leading-none">
                  {trendLabel || "vs last week"}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Icon with responsive sizing */}
          <div className="flex-shrink-0">
            <div className={cn(
              'p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl transition-all duration-300',
              'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
              'group-hover:from-purple-100 group-hover:to-purple-200 dark:group-hover:from-purple-900 dark:group-hover:to-purple-800',
              'group-hover:scale-110 group-hover:rotate-3'
            )}>
              <Icon className={cn(
                'text-purple-600 dark:text-purple-400 transition-all duration-300',
                // Base size for mobile (< 768px)
                'h-5 w-5',
                // Reduced size for larger screens (≥ 768px) - 25% smaller
                'md:h-4 md:w-4',
                // Slightly larger for very large screens
                'xl:h-5 xl:w-5'
              )} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}