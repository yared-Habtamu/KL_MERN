import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ActivitySkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { X, CheckCircle } from 'lucide-react';
import { activityService, Activity } from '@/services/activityService';

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const getStatusColor = (severity: Activity['severity']) => {
  switch (severity) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

interface RecentActivityProps {
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export function RecentActivity({ isMobileOpen, onMobileToggle }: RecentActivityProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await activityService.getRecentActivities();
      setActivities(response.activities);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Only show toast on initial load, not on auto-refresh
      if (loading) {
        toast({
          title: "Error",
          description: "Failed to load recent activities. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActivities();

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(fetchActivities, 100000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [toast, loading]);

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={onMobileToggle} />

      {/* Fixed Activity Sidebar */}
      <aside className={`
        fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background border-l border-border transition-transform duration-300 ease-in-out overflow-hidden
        md:z-30 z-50
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <Card className="h-full border-0 rounded-none">
          <CardHeader className="pb-4 border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileToggle}
                className="h-8 w-8 md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-4 space-y-4">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 8 }).map((_, index) => (
                    <ActivitySkeleton key={`skeleton-${index}`} />
                  ))
                ) : activities.length > 0 ? (
                  // Real activities
                  activities.map((activity) => (
                    <div key={activity._id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 p-2 bg-muted rounded-full">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {activity.action}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-xs ml-2 ${getStatusColor(activity.severity)}`}
                          >
                            {activity.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {activity.details}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}