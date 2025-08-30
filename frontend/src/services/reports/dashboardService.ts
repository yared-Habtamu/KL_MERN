import { getToken } from '../authService';

export interface DashboardOverview {
  totalSellers: {
    count: number;
    trend: number;
  };
  totalAgents: {
    count: number;
    trend: number;
  };
  agentCommission: {
    amount: number;
    trend: number;
  };
  activeLotteries: {
    count: number;
    trend: number;
  };
  totalSell: {
    amount: number;
    trend: number;
  };
  totalUsers: {
    count: number;
    trend: number;
  };
  lotteriesEndedToday: {
    count: number;
    lotteries: Array<{
      id: string;
      title: string;
    }>;
  };
  growthRate: {
    rate: number;
  };
}

export interface Activity {
  id: string;
  type: 'seller' | 'ticket' | 'lottery' | 'winner' | 'info';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'info';
  user: string;
  role: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
};