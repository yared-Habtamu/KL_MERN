import { DivideIcon as LucideIcon } from 'lucide-react';
import { InfoCard } from '@/components/InfoCard';
import { CardSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardData {
  title: string;
  value: string | number;
  icon: typeof LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  trendLabel?: string;
}

interface CardGridProps {
  cards: CardData[];
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
}



export function CardGrid({ cards, className, loading = false, skeletonCount = 6 }: CardGridProps) {
  // Ensure exactly 6 cards are displayed
  const displayCards = cards.slice(0, 6);

  if (loading) {
    return (
      <div className={cn(
        'grid w-full gap-3 sm:gap-4 lg:gap-6',
        // Mobile: 2 columns (3 rows)
        'grid-cols-2',
        // Tablet: 3 columns (2 rows)
        'sm:grid-cols-3',
        // Desktop: 6 columns (1 row) for larger screens
        'xl:grid-cols-3',
        // Large desktop: maintain 6 columns with better spacing
        '2xl:grid-cols-3',
        className
      )}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`skeleton-${index}`} className="w-full">
            <CardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      'grid w-full gap-3 sm:gap-4 lg:gap-6',
      // Mobile: 2 columns (3 rows)
      'grid-cols-2',
      // Tablet: 3 columns (2 rows)
      'sm:grid-cols-3',
      // Desktop: 6 columns (1 row) for larger screens
      'xl:grid-cols-3',
      // Large desktop: maintain 6 columns with better spacing
      '2xl:grid-cols-3',
      className
    )}>
      {displayCards.map((card, index) => (
        <div
          key={`${card.title}-${index}`}
          className="w-full"
        >
          <InfoCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendLabel={card.trendLabel}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
}