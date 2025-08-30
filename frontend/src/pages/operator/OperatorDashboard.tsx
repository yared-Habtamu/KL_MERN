import { useState, useEffect } from 'react';
import { MailCheck, Send, Trophy, TrendingUp } from 'lucide-react';
import { CardGrid } from '../../components/lotteries/CardGrid';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');


export default function OperatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/lotteries/operator/dashboard-stats`, getAuthHeaderConfig());
        setStats(res.data);
      } catch (err: any) {
        setError('Failed to load dashboard stats.');
        toast({
          title: 'Error',
          description: 'Failed to load dashboard stats. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  const operatorCards = stats
    ? [
        {
          title: '🕗 Pending SMS',
          value: stats.pendingSms.count.toString(),
          icon: MailCheck,
          trend: {
            value: stats.pendingSms.trend, // Use formatTrend when displaying
            isPositive: stats.pendingSms.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
        {
          title: '✅ SMS Sent Today',
          value: stats.smsSentToday.count.toString(),
          icon: Send,
          trend: {
            value: stats.smsSentToday.trend, // Use formatTrend when displaying
            isPositive: stats.smsSentToday.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
        {
          title: '🏆 Pending Winners SMS',
          value: stats.pendingWinnerSms.count.toString(),
          icon: Trophy,
          trend: {
            value: stats.pendingWinnerSms.trend, // Use formatTrend when displaying
            isPositive: stats.pendingWinnerSms.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
        {
          title: '🏅 Winner SMS Sent Today',
          value: stats.winnerSmsSentToday.count.toString(),
          icon: TrendingUp,
          trend: {
            value: stats.winnerSmsSentToday.trend, // Use formatTrend when displaying
            isPositive: stats.winnerSmsSentToday.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
      ]
    : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-2 lg:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Operator Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl">
          Welcome back, {user?.name || user?.role || 'Operator'}! Here are your latest ticket and lottery updates.
        </p>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
      )}
      <CardGrid
        cards={operatorCards}
        className="mb-6 lg:mb-8"
        loading={loading}
        skeletonCount={4}
      />
    </div>
  );
} 