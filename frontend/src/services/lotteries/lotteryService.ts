import { getToken } from '@/services/authService';

export interface LotteriesDashboard {
  activeLotteries: {
    count: number;
    trend: number;
  };
  pendingDraws: {
    count: number;
    trend: number;
  };
  thisWeek: {
    count: number;
    trend: number;
  };
  totalParticipants: {
    count: number;
    trend: number;
  };
  completedLotteries: {
    count: number;
    trend: number;
  };
}

export interface Lottery {
  id: string;
  title: string;
  creator: string;
  type: 'company' | 'agent';
  status: 'active' | 'ended';
  ticketsSold: number;
  ticketPrice: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface LotteriesResponse {
  lotteries: Lottery[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface LotteriesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  creator?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LotteryDetail extends Lottery {
  description?: string;
  prizes?: Array<{ rank: number; title: string; imageUrl?: string }>;
  // Add any other fields returned by your backend for a single lottery
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const lotteryService = {
  async getDashboard(): Promise<LotteriesDashboard> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/lotteries/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lotteries dashboard: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async getLotteries(filters: LotteriesFilters = {}): Promise<LotteriesResponse> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query string
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/lotteries?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lotteries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async getLotteryById(id: string): Promise<LotteryDetail> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/lotteries/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch lottery: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async updateLottery(id: string, updateData: Partial<LotteryDetail>): Promise<LotteryDetail> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/lotteries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update lottery: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.lottery;
  },

  async deleteLottery(id: string): Promise<void> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/lotteries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete lottery: ${response.status} ${response.statusText}`);
    }
  },

  async getSoldTickets(lotteryId: string): Promise<number[]> {
    const token = getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/lotteries/${lotteryId}/sold-tickets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch sold tickets');
    const data = await response.json();
    return data.soldNumbers;
  },

  async sellTicket(lotteryId: string, ticketNumber: number, customerName: string, customerPhone: string): Promise<number[]> {
    const token = getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/lotteries/${lotteryId}/sell-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lotteryId, ticketNumber, customerName, customerPhone })
    });
    if (response.status === 409) {
      const data = await response.json();
      throw new Error(data.message || 'Ticket already sold');
    }
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to sell ticket');
    }
    const data = await response.json();
    return data.soldNumbers;
  },
}; 