import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CardGrid } from '@/components/lotteries/CardGrid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/useAuth';
import { canDelete } from '@/auth/useAuth';
import {
  Users,
  UserPlus,
  TrendingUp,

  Building,
  DollarSign,
  Edit,
  Trash2,

} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { agentsService, AgentsDashboard, Agent, AgentsFilters } from '@/services/agents/agentsService';
import { AgentFilters } from '@/components/agents/AgentFilters';
import { Pagination } from '@/components/Pagination';
import { DeleteConfirmationModal } from '@/components/staff/DeleteConfirmationModal';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Add this helper for sort indicators
const getSortIndicator = (column: string, sortBy: string, sortOrder: string) => {
  if (sortBy !== column) return '';
  return sortOrder === 'asc' ? '▲' : '▼';
};

export function Agents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AgentsDashboard | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState<AgentsFilters>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'registeredAt',
    sortOrder: 'desc'
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    agent: Agent | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    agent: null,
    isLoading: false
  });
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await agentsService.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch agents dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load agents dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Fetch agents data
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setTableLoading(true);
        const data = await agentsService.getAgents(filters);
        setAgents(data.agents);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        toast({
          title: "Error",
          description: "Failed to load agents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTableLoading(false);
      }
    };

    fetchAgents();
  }, [filters, toast]);

  const handleFiltersChange = (newFilters: AgentsFilters) => {
    setFilters(newFilters);
  };



  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEdit = (agent: Agent) => {
    // TODO: Implement edit modal or navigate to edit page
    toast({
      title: "Edit Agent",
      description: `Edit functionality for ${agent.name} will be implemented soon.`,
    });
  };

  const handleDelete = (agent: Agent) => {
    setDeleteModal({
      isOpen: true,
      agent,
      isLoading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.agent) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      await agentsService.deleteAgent(deleteModal.agent.id);
      
      toast({
        title: "Success",
        description: `"${deleteModal.agent.name}" has been deleted successfully.`,
      });

      // Refresh the agents list
      const data = await agentsService.getAgents(filters);
      setAgents(data.agents);
      setPagination(data.pagination);
      
      setDeleteModal({ isOpen: false, agent: null, isLoading: false });
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent. Please try again.",
        variant: "destructive",
      });
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, agent: null, isLoading: false });
  };

  const handleSort = (column: string) => {
    setFilters(prev => {
      if (prev.sortBy === column) {
        // Toggle sort order
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 };
      } else {
        // Set new sort column, default to desc
        return { ...prev, sortBy: column, sortOrder: 'desc', page: 1 };
      }
    });
  };

  const dashboardCards = dashboardData ? [
    {
      title: 'Total Agents',
      value: dashboardData.totalAgents.count.toString(),
      icon: Users,
      trend: { 
        value: dashboardData.totalAgents.trend, 
        isPositive: dashboardData.totalAgents.trend >= 0 
      },
    },
    {
      title: 'Total Commission Paid',
      value: `$${dashboardData.totalCommissionPaid.amount.toLocaleString()}`,
      icon: DollarSign,
      trend: { 
        value: dashboardData.totalCommissionPaid.trend, 
        isPositive: dashboardData.totalCommissionPaid.trend >= 0 
      },
    },
    {
      title: 'Average Commission',
      value: `${dashboardData.averageCommission.rate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: { 
        value: 0, // No trend for average
        isPositive: true 
      },
    },
    {
      title: 'Tickets Sold Today (by agents only)',
      value: dashboardData.ticketsSoldTodayByAgents.count.toLocaleString(),
      icon: Building,
      trend: { 
        value: dashboardData.ticketsSoldTodayByAgents.trend, 
        isPositive: dashboardData.ticketsSoldTodayByAgents.trend >= 0 
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
            <Building className="h-6 w-6 text-primary-light dark:text-primary-dark" />
            Agents
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Manage lottery agents and their commissions</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            onClick={() => navigate(`/dashboard/${user?.role}/agents/register`)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Register Agent
          </Button>
        )}
      </div>

      <CardGrid 
        cards={dashboardCards} 
        loading={loading}
        skeletonCount={4}
      />

      {/* Filters */}
      <AgentFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {tableLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('name')}
                      >
                        Agent Name {getSortIndicator('name', filters.sortBy, filters.sortOrder)}
                      </TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('registeredAt')}
                      >
                        Registered At {getSortIndicator('registeredAt', filters.sortBy, filters.sortOrder)}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('totalTicketsSold')}
                      >
                        Total Tickets Sold {getSortIndicator('totalTicketsSold', filters.sortBy, filters.sortOrder)}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('totalCommission')}
                      >
                        Total Commission {getSortIndicator('totalCommission', filters.sortBy, filters.sortOrder)}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('commissionRate')}
                      >
                        Commission Rate {getSortIndicator('commissionRate', filters.sortBy, filters.sortOrder)}
                      </TableHead>
                      {user?.role === 'admin' && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id} className="border-b">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {agent.lotteriesCount} lotteries
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{agent.phone}</TableCell>
                        <TableCell>
                          {format(new Date(agent.registeredAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{agent.totalTicketsSold.toLocaleString()}</TableCell>
                        <TableCell>${agent.totalCommission.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {agent.commissionRate}%
                          </Badge>
                        </TableCell>
                        {user?.role === 'admin' && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEdit(agent)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete(user) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDelete(agent)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          itemName={deleteModal.agent?.name || ''}
          isLoading={deleteModal.isLoading}
          title="Delete Agent"
          description={`Are you sure you want to delete "${deleteModal.agent?.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
