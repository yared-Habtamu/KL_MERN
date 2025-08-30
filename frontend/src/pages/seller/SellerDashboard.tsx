import { useEffect, useState } from 'react';
import { CardGrid } from '@/components/lotteries/CardGrid';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { getAuthHeaderConfig } from '@/services/authService';
import { Ticket, DollarSign, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');


export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/dashboard/seller/summary`, getAuthHeaderConfig());
        setSummary(res.data);
      } catch (err) {
        setError('Failed to load dashboard summary.');
        toast({
          title: 'Error',
          description: 'Failed to load dashboard summary. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [toast]);

  useEffect(() => {
    const fetchLotteries = async () => {
      setTableLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/dashboard/seller/active-lotteries`, getAuthHeaderConfig());
        setLotteries(res.data.lotteries);
      } catch (err) {
        setLotteries([]);
      } finally {
        setTableLoading(false);
      }
    };
    fetchLotteries();
  }, []);

  const cards = summary
    ? [
        {
          title: '🎟 Tickets Sold Today',
          value: summary.ticketsSoldToday.count.toString(),
          icon: Ticket,
          trend: {
            value: summary.ticketsSoldToday.trend,
            isPositive: summary.ticketsSoldToday.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
        {
          title: '💰 Commission Earned',
          value: `Br ${summary.commissionEarnedToday.amount.toLocaleString()}`,
          icon: DollarSign,
          trend: {
            value: summary.commissionEarnedToday.trend,
            isPositive: summary.commissionEarnedToday.trend >= 0,
          },
          trendLabel: 'vs a day ago',
        },
        {
          title: '🎯 Active Lotteries',
          value: summary.activeLotteries.count.toString(),
          icon: LayoutDashboard,
        },
        {
          title: '🗓 Total Tickets Sold',
          value: summary.totalTicketsSold.count.toString(),
          icon: ClipboardList,
        },
      ]
    : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-2 lg:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Seller Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl">
          Welcome back, {user?.name || user?.role || 'Seller'}! Here are your latest sales and lotteries.
        </p>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
      )}
      <CardGrid
        cards={cards}
        className="mb-6 lg:mb-8"
        loading={loading}
        skeletonCount={4}
      />
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Lotteries</h2>
        {tableLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : lotteries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active lotteries available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow">
              <thead>
                <tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                  <th className="p-3">Lottery</th>
                  <th className="p-3">Ticket Range</th>
                  <th className="p-3">Tickets Left</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {lotteries.map(lottery => (
                  <tr
                    key={lottery.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/dashboard/seller/lotteries/${lottery.id}`)}
                  >
                    <td className="p-3 font-semibold">{lottery.name}</td>
                    <td className="p-3">{lottery.ticketRange}</td>
                    <td className="p-3">{lottery.ticketsLeft}</td>
                    <td className="p-3">Br {lottery.commissionRate.toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/90"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/dashboard/seller/lotteries/${lottery.id}`);
                        }}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 