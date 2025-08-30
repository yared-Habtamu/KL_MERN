import { CardGrid } from '@/components/lotteries/CardGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


import {
  Ticket as TicketIcon,
  ClipboardList,
  DollarSign,



  Download,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useState, useEffect } from 'react';
import { ticketService, Ticket } from '@/services/tickets/ticketService';
import { Pagination } from '@/components/Pagination';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketFilters } from '@/components/tickets/TicketFilters';

export function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25,
  });
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    status: 'all',
    smsStatus: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [widgetData, setWidgetData] = useState({
    totalTickets: 0,
    activeTickets: 0,
    totalRevenue: 0,
    ticketsSoldToday: 0,
    avgTicketValue: 0,
  });
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; ticket: Ticket | null; loading: boolean; error: string | null }>({ open: false, ticket: null, loading: false, error: null });

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const data = await ticketService.getTickets(filters);
        setTickets(data.tickets);
        setPagination(data.pagination);
      } catch (e) {
        // handle error
        console.error("Error fetching tickets:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [filters]);

  useEffect(() => {
    const fetchWidgets = async () => {
      setWidgetLoading(true);
      try {
        const data = await ticketService.getTicketsDashboard();
        setWidgetData(data);
      } catch (e) {
        // handle error
      } finally {
        setWidgetLoading(false);
      }
    };
    fetchWidgets();
  }, []);

  // Widget data (mock for now, can be calculated from tickets or fetched from backend)
  // ... implement widget calculations here ...


  const handlePageChange = (page: number) => {
    setFilters(f => ({ ...f, page }));
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setDeleteModal({ open: true, ticket, loading: false, error: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.ticket) return;
    setDeleteModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      await ticketService.deleteTicket(deleteModal.ticket._id);
      setDeleteModal({ open: false, ticket: null, loading: false, error: null });
      // Refresh tickets
      setFilters(f => ({ ...f }));
    } catch (e: any) {
      setDeleteModal(prev => ({ ...prev, loading: false, error: e.message || 'Failed to delete ticket.' }));
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ open: false, ticket: null, loading: false, error: null });
  };

  const ticketsCards = [
    {
      title: 'Total Tickets Sold',
      value: widgetData.totalTickets.toLocaleString(),
      icon: ClipboardList,
      trend: undefined,
    },
    {
      title: 'Active Tickets',
      value: widgetData.activeTickets.toLocaleString(),
      icon: TicketIcon,
      trend: undefined,
    },
    {
      title: 'Total Revenue',
      value: `$${widgetData.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: undefined,
    },
    {
      title: 'Tickets Sold Today',
      value: widgetData.ticketsSoldToday.toLocaleString(),
      icon: Calendar,
      trend: undefined,
    },
    {
      title: 'Avg Ticket Value',
      value: `$${widgetData.avgTicketValue.toFixed(2)}`,
      icon: DollarSign,
      trend: undefined,
    },
  ];

  // Skeletons for widgets
  const WidgetSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );

  // Skeleton for table
  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {Array.from({ length: 9 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-[100px]" />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
          <h1 className="flex items-center justify-center sm:justify-start gap-2 text-2xl sm:text-3xl font-bold text-foreground">
            <ClipboardList className="h-6 w-6 text-primary-light dark:text-primary-dark" />
            Tickets
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">View and manage all lottery tickets</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Widgets section */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        widgetLoading ? <WidgetSkeletons /> : <CardGrid cards={ticketsCards} />
      )}

      {/* Filters section */}
      <TicketFilters
        filters={filters}
        onFiltersChange={newFilters =>
          setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1 // or prev.page if you want to keep the current page
          }))
        }
      />

      {/* Tickets Table */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="space-y-4">
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Ticket Number</th>
                    <th className="text-left py-3 px-4">Lottery</th>
                    <th className="text-left py-3 px-4">Customer Name</th>
                    <th className="text-left py-3 px-4">Phone Number</th>
                    <th className="text-left py-3 px-4">Sold By</th>
                    <th className="text-left py-3 px-4">Sold Date</th>
                    <th className="text-left py-3 px-4">Ticket Status</th>
                    <th className="text-left py-3 px-4">SMS Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} className="border-b">
                      <td className="py-3 px-4 font-mono text-sm">{ticket.ticketNumber}</td>
                      <td className="py-3 px-4">{ticket.lotteryId?.title}</td>
                      <td className="py-3 px-4">{ticket.customer?.name}</td>
                      <td className="py-3 px-4">{ticket.customer?.phone}</td>
                      <td className="py-3 px-4">{ticket.soldBy?.name}</td>
                      <td className="py-3 px-4 text-sm">{ticket.soldAt ? new Date(ticket.soldAt).toLocaleString() : ''}</td>
                      <td className="py-3 px-4">{ticket.status}</td>
                      <td className="py-3 px-4">{ticket.smsSent ? 'Sent' : 'Pending'}</td>
                      <td className="py-3 px-4">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <>
                            <Button size="sm" variant="outline">Resend SMS</Button>
                            {user?.role === 'admin' && ticket.lotteryId && (
                              (() => {
                                const status = (ticket.lotteryId as any).status;
                                const winners = Array.isArray((ticket.lotteryId as any).winningTicketNumber) && (ticket.lotteryId as any).winningTicketNumber.length > 0;
                                if (status === 'active' || (status === 'ended' && !winners)) {
                                  return (
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleDeleteClick(ticket)}>
                                      Delete
                                    </Button>
                                  );
                                }
                                return null;
                              })()
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={handleCloseDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete ticket #{deleteModal.ticket?.ticketNumber}? This action cannot be undone.
            {deleteModal.error && <div className="text-red-600 text-sm mt-2">{deleteModal.error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteModal} disabled={deleteModal.loading}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete} disabled={deleteModal.loading}>
              {deleteModal.loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}