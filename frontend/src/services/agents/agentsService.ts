import { getToken } from '../authService';

export interface Agent {
  id: string;
  name: string;
  phone: string;
  commissionRate: number;
  registeredAt: string;
  totalTicketsSold: number;
  totalCommission: number;
  lotteriesCount: number;
}

export interface AgentDetail extends Agent {
  totalRevenue: number;
  lotteries: Array<{
    id: string;
    title: string;
    status: string;
    ticketsSold: number;
    revenue: number;
    createdAt: string;
  }>;
}

export interface AgentsDashboard {
  totalAgents: {
    count: number;
    trend: number;
  };
  totalCommissionPaid: {
    amount: number;
    trend: number;
  };
  averageCommission: {
    rate: number;
    activeAgents: number;
  };
  ticketsSoldTodayByAgents: {
    count: number;
    trend: number;
  };
}

export interface AgentsFilters {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AgentsResponse {
  agents: Agent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const agentsService = {
  // Get agents dashboard data
  async getDashboard(): Promise<AgentsDashboard> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/agents/dashboard`, {
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
      console.error('Error fetching agents dashboard:', error);
      throw error;
    }
  },

  // Get all agents with filters and pagination
  async getAgents(filters: AgentsFilters): Promise<AgentsResponse> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`${API_BASE_URL}/agents?${params}`, {
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
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  // Get agent by ID
  async getAgentById(id: string): Promise<AgentDetail> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
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
      console.error('Error fetching agent:', error);
      throw error;
    }
  },

  // Update agent
  async updateAgent(id: string, agentData: Partial<Agent>): Promise<Agent> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  },

  // Delete agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  },

  // Create agent
  async createAgent(agentData: { name: string; phone: string; password: string; commissionRate: number }): Promise<any> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(agentData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },
}; 