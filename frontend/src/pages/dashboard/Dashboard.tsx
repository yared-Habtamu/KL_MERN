import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardGrid } from '@/components/lotteries/CardGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Ticket,
  DollarSign,
  Trophy,
  UserPlus,
  TrendingUp,
  Plus,

  Building,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { dashboardService, DashboardOverview } from '@/services/reports/dashboardService';
import { SystemStatusCard } from '@/components/SystemStatus';

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getOverview();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const dashboardCards = dashboardData ? [
    {
      title: 'Total Sellers',
      value: dashboardData.totalSellers?.count?.toLocaleString() ?? '0',
      icon: UserPlus,
      trend: { value: dashboardData.totalSellers?.trend ?? 0, isPositive: (dashboardData.totalSellers?.trend ?? 0) >= 0 },
      trendLabel: 'vs last week',
    },
    {
      title: 'Total Agents',
      value: dashboardData.totalAgents?.count?.toLocaleString() ?? '0',
      icon: Building,
      trend: { value: dashboardData.totalAgents?.trend ?? 0, isPositive: (dashboardData.totalAgents?.trend ?? 0) >= 0 },
      trendLabel: 'vs last week',
    },
    {
      title: 'Agent Commission',
      value: `$${dashboardData.agentCommission?.amount?.toLocaleString() ?? '0'}`,
      icon: DollarSign,
      trend: { value: dashboardData.agentCommission?.trend ?? 0, isPositive: (dashboardData.agentCommission?.trend ?? 0) >= 0 },
      trendLabel: 'vs last week',
    },
    {
      title: 'Active Lotteries',
      value: dashboardData.activeLotteries?.count?.toString() ?? '0',
      icon: Ticket,
      trend: { value: dashboardData.activeLotteries?.trend ?? 0, isPositive: (dashboardData.activeLotteries?.trend ?? 0) >= 0 },
      trendLabel: 'vs last week',
    },
    {
      title: 'Total Revenue',
      value: `$${dashboardData.totalSell?.amount?.toLocaleString() ?? '0'}`,
      icon: TrendingUp,
      trend: { value: dashboardData.totalSell?.trend ?? 0, isPositive: (dashboardData.totalSell?.trend ?? 0) >= 0 },
      trendLabel: 'vs last week',
    },
    {
      title: 'Lotteries Ended Today',
      value: dashboardData.lotteriesEndedToday?.count?.toString() ?? '0',
      icon: Trophy,
      extra: dashboardData.lotteriesEndedToday?.lotteries?.length
        ? dashboardData.lotteriesEndedToday.lotteries.map(l => l.title).join(', ')
        : 'No lotteries ended today',
    },
    {
      title: 'Total Users',
      value: dashboardData.totalUsers?.count?.toLocaleString() ?? '0',
      icon: Users,
      trend: { value: dashboardData.totalUsers?.trend ?? 0, isPositive: (dashboardData.totalUsers?.trend ?? 0) >= 0 },
    },
    {
      title: 'Growth Rate',
      value: `${dashboardData.growthRate?.rate?.toFixed(1) ?? '0.0'}%`,
      icon: TrendingUp,
      trend: { value: dashboardData.growthRate?.rate ?? 0, isPositive: (dashboardData.growthRate?.rate ?? 0) >= 0 },
    },
  ] : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="space-y-2 lg:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl">
          Welcome back, {user?.name || user?.role || 'Staff'}! Here's what's happening with your lottery system today.
        </p>
      </div>

      {/* Dashboard Cards Grid - Exactly 6 cards */}
      <CardGrid 
        cards={dashboardCards} 
        className="mb-6 lg:mb-8" 
        loading={loading}
        skeletonCount={6}
      />

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <>
            {/* Quick Actions Card */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 hover:bg-muted/50"
              onClick={() => navigate('/dashboard/admin/lotteries/create')}
            >
              <div className="text-left">
                <div className="font-medium">Create New Lottery</div>
                <div className="text-sm text-muted-foreground">Set up a new lottery draw</div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 hover:bg-muted/50"
              onClick={() => navigate('/dashboard/admin/staff/add')}
            >
              <div className="text-left">
                <div className="font-medium">Add Staff</div>
                <div className="text-sm text-muted-foreground">Register a new staff member</div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-4 hover:bg-muted/50"
              onClick={() => navigate('/dashboard/admin/agents/register')}
            >
              <div className="text-left">
                <div className="font-medium">Register Agent</div>
                <div className="text-sm text-muted-foreground">Add a new agent to the system</div>
              </div>
            </Button>
          </CardContent>
        </Card>
          </>
        )}

        {/* System Status Card - Show for admin and manager */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <SystemStatusCard />
        )}
      </div>
    </div>
  );
}