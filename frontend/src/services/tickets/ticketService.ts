import { getToken } from '../authService';

export interface Ticket {
  _id: string;
  ticketNumber: number;
  lotteryId: { _id: string; title: string };
  customer: { _id: string; name: string; phone: string };
  soldBy: { _id: string; name: string; role: string };
  soldAt: string;
  status: string;
  smsSent: boolean;
  smsSentAt?: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const ticketService = {
  async getTickets({ page = 1, search = '', status = 'all', smsStatus = 'all' }: {
    page?: number;
    search?: string;
    status?: string;
    smsStatus?: string;
  }): Promise<TicketsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      search,
      status,
      smsStatus,
      limit: '25',
    });
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/lotteries/tickets?${params}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async getTicketsDashboard(): Promise<{
    totalTickets: number;
    activeTickets: number;
    totalRevenue: number;
    ticketsSoldToday: number;
    avgTicketValue: number;
  }> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/lotteries/tickets/dashboard`, { headers });
    if (!res.ok) throw new Error('Failed to fetch tickets dashboard');
    return res.json();
  },

  async getTicketsByLotteryId(lotteryId: string): Promise<Ticket[]> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/lotteries/tickets?search=&status=all&smsStatus=all&lotteryId=${lotteryId}&limit=1000`, { headers });
    if (!res.ok) throw new Error('Failed to fetch tickets for lottery');
    const data = await res.json();
    return data.tickets || [];
  },

  async deleteTicket(id: string): Promise<void> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/lotteries/tickets/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to delete ticket');
    }
  },
}; 