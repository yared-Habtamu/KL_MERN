import { getToken } from './authService';

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  statusColor: 'green' | 'yellow' | 'red';
  warningCount: number;
  latestWarning: {
    action: string;
    details: string;
    createdAt: string;
  } | null;
  recentWarnings: Array<{
    action: string;
    details: string;
    createdAt: string;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const systemStatusService = {
  async getStatus(): Promise<SystemStatus> {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/system-status/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}; 