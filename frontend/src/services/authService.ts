import axios from 'axios';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    phonenumber: string;
    role: string;
    [key: string]: any;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) throw new Error('VITE_API_URL is not set in the environment');

export async function loginUser(phonenumber: string, password: string): Promise<{ data: LoginResponse; status: number }> {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { phonenumber, password });
    return { data: res.data, status: res.status };
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.message) {
      const error: any = new Error(err.response.data.message);
      error.status = err.response.status;
      throw error;
    }
    const error: any = new Error('Login failed');
    error.status = 0;
    throw error;
  }
};

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getAuthHeaderConfig() {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}