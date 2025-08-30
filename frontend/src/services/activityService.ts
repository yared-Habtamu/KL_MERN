import { getToken } from './authService';

export interface Activity {
  _id: string;
  action: string;
  details: string;
  severity: 'success' | 'info';
  createdAt: string;
}

export interface RecentActivitiesResponse {
  activities: Activity[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export const activityService = {
  async getRecentActivities(): Promise<RecentActivitiesResponse> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/activities/recent`, {
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
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  },
}; 