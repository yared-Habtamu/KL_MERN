import { useState, useEffect } from 'react';
import { CardGrid } from '@/components/lotteries/CardGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Ticket,
  Clock,
  Users,

  Play,

  Plus,
  Calendar,


  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { lotteryService, LotteriesDashboard, Lottery, LotteriesFilters } from '@/services/lotteries/lotteryService';
import { LotteryFilters } from '@/components/lotteries/LotteryFilters';
import { Pagination } from '@/components/Pagination';
import { DeleteConfirmationModal } from '@/components/staff/DeleteConfirmationModal';

import { canDelete, useAuth } from '@/auth/useAuth';

export function Lotteries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<LotteriesDashboard | null>(null);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState<LotteriesFilters>({
    page: 1,
    limit: 10,
    status: '', // '' means all, 'active', 'ended'
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    lottery: Lottery | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    lottery: null,
    isLoading: false
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await lotteryService.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch lotteries dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load lotteries dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Fetch lotteries data
  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        setTableLoading(true);
        const data = await lotteryService.getLotteries(filters);
        console.log('Lotteries data:', data.lotteries); // Debug log
        setLotteries(data.lotteries);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch lotteries:', error);
        toast({
          title: "Error",
          description: "Failed to load lotteries. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTableLoading(false);
      }
    };

    fetchLotteries();
  }, [filters, toast]);

  const handleFiltersChange = (newFilters: LotteriesFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRowClick = (lottery: Lottery) => {
    // Navigate to lottery details
    if (!user) return;
    navigate(`/dashboard/${user.role}/lotteries/${lottery.id}`);
  };

  const handleEdit = (e: React.MouseEvent, lottery: Lottery) => {
    e.stopPropagation();
    if (!user) return;
    navigate(`/dashboard/${user.role}/lotteries/${lottery.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent, lottery: Lottery) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      lottery,
      isLoading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.lottery) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      await lotteryService.deleteLottery(deleteModal.lottery.id);
      
      toast({
        title: "Success",
        description: `"${deleteModal.lottery.title}" has been deleted successfully.`,
      });

      // Refresh the lotteries list
      const data = await lotteryService.getLotteries(filters);
      setLotteries(data.lotteries);
      setPagination(data.pagination);
      
      setDeleteModal({ isOpen: false, lottery: null, isLoading: false });
    } catch (error) {
      console.error('Failed to delete lottery:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lottery. Please try again.",
        variant: "destructive",
      });
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, lottery: null, isLoading: false });
  };

  const dashboardCards = dashboardData ? [
  {
    title: 'Active Lotteries',
      value: dashboardData.activeLotteries.count.toString(),
    icon: Ticket,
      trend: { 
        value: dashboardData.activeLotteries.trend, 
        isPositive: dashboardData.activeLotteries.trend >= 0 
      },
  },
  {
    title: 'Pending Draws',
      value: dashboardData.pendingDraws.count.toString(),
    icon: Clock,
      trend: { 
        value: dashboardData.pendingDraws.trend, 
        isPositive: dashboardData.pendingDraws.trend >= 0 
      },
    },
    {
      title: 'This Week',
      value: dashboardData.thisWeek.count.toString(),
      icon: Calendar,
      trend: { 
        value: dashboardData.thisWeek.trend, 
        isPositive: dashboardData.thisWeek.trend >= 0 
      },
  },
  {
    title: 'Total Participants',
      value: dashboardData.totalParticipants.count.toLocaleString(),
    icon: Users,
      trend: { 
        value: dashboardData.totalParticipants.trend, 
        isPositive: dashboardData.totalParticipants.trend >= 0 
      },
  },
  {
      title: 'Completed Lotteries',
      value: dashboardData.completedLotteries.count.toString(),
    icon: Play,
      trend: { 
        value: dashboardData.completedLotteries.trend, 
        isPositive: dashboardData.completedLotteries.trend >= 0 
      },
  },
  ] : [];

  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
          <h1 className="flex items-center justify-center sm:justify-start gap-2 text-2xl sm:text-3xl font-bold text-foreground">
            <Ticket className="h-6 w-6 text-primary-light dark:text-primary-dark" />
            Lotteries
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Manage all lottery games and draws</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button 
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto" 
            onClick={() => navigate(`/dashboard/${user.role}/lotteries/create`)}
          >
          <Plus className="mr-2 h-4 w-4" />
          Create Lottery
        </Button>
        )}
      </div>

      <CardGrid 
        cards={dashboardCards} 
        loading={loading}
        skeletonCount={5}
      />

      {/* Filters */}
      <LotteryFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>All Lotteries</CardTitle>
        </CardHeader>
        <CardContent>
          {tableLoading ? (
            <TableSkeleton />
          ) : (
            <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Creator</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Tickets Sold</th>
                      <th className="text-left py-3 px-4">Ticket Price</th>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                  <th className="text-left py-3 px-4">Actions</th>
                      )}
                </tr>
              </thead>
              <tbody>
                {lotteries.map((lottery) => (
                      <tr 
                        key={lottery.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(lottery)}
                      >
                        <td className="py-3 px-4 font-medium">{lottery.title}</td>
                        <td className="py-3 px-4">{lottery.creator}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={lottery.type === 'company' ? 'default' : 'secondary'}
                            className={
                              lottery.type === 'company'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            }
                          >
                            {lottery.type}
                          </Badge>
                        </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={lottery.status === 'active' ? 'default' : 'secondary'}
                        className={
                          lottery.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }
                      >
                        {lottery.status}
                      </Badge>
                    </td>
                        <td className="py-3 px-4">{lottery.ticketsSold.toLocaleString()}</td>
                        <td className="py-3 px-4">${lottery.ticketPrice.toLocaleString()}</td>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={e => handleEdit(e, lottery)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        >
                          Edit
                        </Button>
                        {user?.role === 'admin' && canDelete(user) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={e => handleDelete(e, lottery)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                        )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {canDelete(user) && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={deleteModal.lottery?.title || ''}
          isLoading={deleteModal.isLoading}
        />
      )}
    </div>
  );
}