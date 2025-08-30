import { Ticket } from 'lucide-react';

export function AvailableLotteries() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold text-foreground">
          <Ticket className="h-6 w-6 text-primary-light dark:text-primary-dark" />
          Available Lotteries
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          View and sell tickets for lotteries in your branch. Each lottery card will be a button to a detail page.
        </p>
      </div>
      {/* TODO: List lottery cards here */}
    </div>
  );
} 