import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Ticket, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/api";

interface UserSummary {
  role?: "client" | "agent";
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: ("client" | "agent")[];
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    path: "/",
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: <Wallet size={20} />,
    path: "/wallet",
  },
  {
    id: "tickets",
    label: "My Tickets",
    icon: <Ticket size={20} />,
    path: "/my-tickets",
    roles: ["client"],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <BarChart3 size={20} />,
    path: "/agent-dashboard",
    roles: ["agent"],
  },
];

export const BottomNavigationBar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me: any = await auth.whoami();
        setCurrentUser(me.user || me);
      } catch (e) {
        setCurrentUser(null);
      }
    })();
  }, []);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles || !currentUser?.role)
      return !item.roles || item.roles.length === 0 || !!currentUser?.role;
    return item.roles.includes(currentUser.role as any);
  });

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-kiya-surface border-t border-gray-700 safe-area z-50">
      <div className="flex">
        {filteredNavItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
              isActive(item.path)
                ? "text-kiya-teal"
                : "text-kiya-text-secondary hover:text-kiya-text"
            }`}
          >
            <div className="mb-1">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
// // Base URL for API requests
// const API_BASE =
//   (import.meta as any).env?.VITE_API_BASE || '/api'; // Use '/api' as a fallback if VITE_API_BASE is not defined

// // Type for query parameters
// type QueryParams = Record<string, any>;

// /**
//  * Builds a query string from an object of parameters.
//  * Undefined or null values are excluded.
//  * @param params - An object of query parameters.
//  * @returns A formatted query string (e.g., "?key=value&other=thing").
//  */
// function buildQs(params?: QueryParams): string {
//   if (!params) return '';
//   const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
//   if (entries.length === 0) return '';
//   return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
// }

// /**
//  * Central API client used by frontend pages.
//  * - Base URL from import.meta.env.VITE_API_BASE || '/api'
//  * - Reads token from localStorage key 'token' (or 'kiya_token' from the old version)
//  * - Supports JSON and FormData bodies (auto-handles Content-Type)
//  * @param path - The API endpoint path.
//  * @param opts - Request options for fetch.
//  * @returns A promise that resolves with the parsed JSON response.
//  */
// async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
//   // Prioritize 'token' from the new code, fallback to 'kiya_token' from the old code
//   const token = localStorage.getItem('token') || localStorage.getItem('kiya_token');
//   const headers: Record<string, string> = Object.assign({}, (opts.headers as Record<string, string>) || {});
//   const isForm = opts.body instanceof FormData;

//   if (!isForm && !headers['Content-Type']) {
//     headers['Content-Type'] = 'application/json';
//   }
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   // Use 'include' for credentials to handle cookies/sessions if needed, or 'same-origin'
//   // For token-based auth, credentials might not be strictly necessary on the client-side fetch if the token is managed in headers.
//   // However, if the backend relies on cookies for some operations (e.g., initial auth or refresh tokens), 'include' is important.
//   // Given the original snippet's use of 'credentials: "include"', we'll keep it.
//   const fetchOpts = {
//     ...opts,
//     headers,
//     credentials: 'include' as RequestCredentials, // Explicitly cast if needed by TS config
//   };


//   const res = await fetch(`${API_BASE}${path}`, fetchOpts);

//   // Handle No Content response
//   if (res.status === 204) {
//     return undefined as unknown as T;
//   }

//   const text = await res.text();
//   let data = null;
//   try {
//     // Attempt to parse JSON only if there's text content
//     data = text ? JSON.parse(text) : null;
//   } catch (e) {
//     // If parsing fails (e.g., plain text error message), return the raw text
//     data = text;
//   }

//   if (!res.ok) {
//     // Construct a more informative error
//     const msg = (data && (typeof data === 'object' ? data.message || data.error : data)) || res.statusText || 'Request failed';
//     const err: any = new Error(msg);
//     err.status = res.status;
//     err.body = data; // Include the parsed data (or raw text) in the error body
//     throw err;
//   }

//   return data as T;
// }

// // --- Authentication ---
// // Exporting individual auth functions as per the new snippet's style
// // These will replace the 'auth' object from the first snippet.

// /**
//  * Register a new user.
//  * @param payload - User registration details.
//  * @returns User data and token.
//  */
// export async function register(payload: { phone: string; password: string; name: string; email?: string; role?: string }) {
//   return request('/auth/register', {
//     method: 'POST',
//     body: JSON.stringify(payload),
//   });
// }

// /**
//  * Authenticate a user and return a token.
//  * @param credentials - User login credentials (email or phone).
//  * @returns User data and token.
//  */
// export async function login(credentials: { phone?: string; password?: string; email?: string }) {
//   // The API expects either phone or email, and password
//   return request('/auth/login', {
//     method: 'POST',
//     body: JSON.stringify(credentials),
//   });
// }

// /**
//  * Get the current authenticated user's profile.
//  * @returns User profile data or null if unauthenticated.
//  */
// export async function whoami() {
//   try {
//     const user = await request('/auth/me', { method: 'GET' });
//     // The API might return null for 204 No Content, or an empty response.
//     // If whoami returns null, it means the user is not authenticated.
//     return user || null;
//   } catch (e: any) {
//     // If the request fails (e.g., 401 Unauthorized), treat it as not logged in.
//     // This makes the UI logic simpler for handling logged-in vs. logged-out states.
//     if (e.status === 401) {
//       return null;
//     }
//     // Re-throw other errors
//     throw e;
//   }
// }

// /**
//  * Update the current user's profile.
//  * Supports File uploads for avatar via FormData.
//  * @param payload - Profile update details.
//  * @returns Updated user profile data.
//  */
// export async function updateProfile(payload: Partial<{ name: string; email: string; avatar?: File | string; password?: string; phone?: string }>) {
//   // if avatar is a File use FormData
//   if (payload.avatar instanceof File) {
//     const fd = new FormData();
//     if (payload.name) fd.append('name', payload.name);
//     if (payload.email) fd.append('email', payload.email);
//     if (payload.phone) fd.append('phone', payload.phone);
//     if (payload.password) fd.append('password', payload.password);
//     fd.append('avatar', payload.avatar);
//     return request('/auth/me', { method: 'PUT', body: fd });
//   }
//   // Otherwise, send as JSON
//   return request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
// }

// /**
//  * Request to become an agent.
//  * @param payload - Application details for becoming an agent.
//  * @returns A success message or confirmation.
//  */
// export async function becomeAgent(payload?: any) {
//   return request('/auth/become-agent', { method: 'POST', body: JSON.stringify(payload || {}) });
// }

// // --- Wallet & Transactions ---
// /**
//  * Get the current user's wallet summary (balance).
//  * @returns Wallet details.
//  */
// export async function getWallet() {
//   return request('/wallet', { method: 'GET' });
// }

// /**
//  * Deposit funds into the wallet.
//  * @param amount - The amount to deposit.
//  * @param source - The source of the deposit (optional).
//  * @returns Deposit confirmation.
//  */
// export async function deposit(amount: number, source?: string) {
//   return request('/wallet/deposit', {
//     method: 'POST',
//     body: JSON.stringify({ amount, source }),
//   });
// }

// /**
//  * Initiate a withdrawal request from the wallet.
//  * @param payload - Withdrawal details.
//  * @returns Withdrawal confirmation.
//  */
// export async function withdraw(payload: {
//   amount: number;
//   method: string;
//   accountNumber?: string;
//   accountName?: string;
// }) {
//   return request('/wallet/withdraw', {
//     method: 'POST',
//     body: JSON.stringify(payload),
//   });
// }

// /**
//  * Get a list of wallet transactions for the current user.
//  * @param params - Pagination or filtering parameters.
//  * @returns List of transactions.
//  */
// export async function getTransactions(params?: { page?: number; perPage?: number }) {
//   return request(`/wallet/transactions${buildQs(params)}`, { method: 'GET' });
// }

// // --- Lotteries ---
// /**
//  * Get a list of lotteries.
//  * @param params - Filtering and pagination parameters.
//  * @returns List of lotteries.
//  */
// export async function getLotteries(params?: { page?: number; perPage?: number; status?: string; search?: string }) {
//   return request(`/lotteries${buildQs(params)}`, { method: 'GET' });
// }

// /**
//  * Get details of a specific lottery.
//  * @param id - The ID of the lottery.
//  * @returns Lottery details.
//  */
// export async function getLottery(id: string) {
//   return request(`/lotteries/${id}`, { method: 'GET' });
// }

// /**
//  * Create a new lottery. Supports FormData for file uploads.
//  * @param payload - Lottery data.
//  * @returns Created lottery details.
//  */
// export async function createLottery(payload: any) {
//   if (payload instanceof FormData) return request(`/lotteries`, { method: 'POST', body: payload });
//   return request(`/lotteries`, { method: 'POST', body: JSON.stringify(payload) });
// }

// /**
//  * Update an existing lottery. Supports FormData for file uploads.
//  * @param id - The ID of the lottery to update.
//  * @param payload - Updated lottery data.
//  * @returns Updated lottery details.
//  */
// export async function updateLottery(id: string, payload: any) {
//   if (payload instanceof FormData) return request(`/lotteries/${id}`, { method: 'PUT', body: payload });
//   return request(`/lotteries/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
// }

// /**
//  * Delete a lottery.
//  * @param id - The ID of the lottery to delete.
//  */
// export async function deleteLottery(id: string) {
//   return request(`/lotteries/${id}`, { method: 'DELETE' });
// }

// // --- Tickets ---
// /**
//  * Buy a ticket for a lottery.
//  * @param payload - Ticket purchase details.
//  * @returns Ticket details.
//  */
// export async function buyTicket(payload: { lotteryId: string; numbers: string[] | string; quantity?: number; paymentMethod?: string; metadata?: any }) {
//   return request('/tickets', { method: 'POST', body: JSON.stringify(payload) });
// }

// /**
//  * Get tickets associated with a specific lottery.
//  * @param lotteryId - The ID of the lottery.
//  * @param params - Filtering and pagination parameters.
//  * @returns List of tickets for the lottery.
//  */
// export async function getLotteryTickets(lotteryId: string, params?: QueryParams) {
//   return request(`/lotteries/${lotteryId}/tickets${buildQs(params)}`, { method: 'GET' });
// }

// /**
//  * Get a list of the current user's tickets.
//  * @param params - Filtering and pagination parameters.
//  * @returns List of user's tickets.
//  */
// export async function getMyTickets(params?: { lotteryId?: string; status?: string; page?: number; perPage?: number }) {
//   return request(`/tickets/my${buildQs(params)}`, { method: 'GET' });
// }

// /**
//  * Get details of a specific ticket.
//  * @param id - The ID of the ticket.
//  * @returns Ticket details.
//  */
// export async function getTicket(id: string) {
//   return request(`/tickets/${id}`, { method: 'GET' });
// }

// /**
//  * Put a ticket up for sale or handle ticket transfer.
//  * @param id - The ID of the ticket.
//  * @param payload - Sale details (price, note).
//  */
// export async function sellTicket(id: string, payload: { price: number; note?: string }) {
//   return request(`/tickets/${id}/sell`, { method: 'POST', body: JSON.stringify(payload) });
// }

// /**
//  * Get a list of tickets currently for sale.
//  * @param params - Filtering and pagination parameters.
//  * @returns List of tickets for sale.
//  */
// export async function listTicketsForSale(params?: { page?: number; perPage?: number; lotteryId?: string }) {
//   return request(`/tickets/sales${buildQs(params)}`, { method: 'GET' });
// }

// // --- Users ---
// /**
//  * Get a user's profile. If no ID is provided, fetches the current user's profile.
//  * @param id - The ID of the user to fetch (optional).
//  * @returns User profile data.
//  */
// export async function getProfile(id?: string) {
//   return request(id ? `/users/${id}` : `/users/me`, { method: 'GET' });
// }
// // Note: updateProfile is already handled under auth.updateProfile for the current user.

// // --- Notifications ---
// /**
//  * Get a list of notifications for the current user.
//  * @param params - Pagination parameters.
//  * @returns List of notifications.
//  */
// export async function getNotifications(params?: { page?: number; perPage?: number }) {
//   return request(`/notifications${buildQs(params)}`, { method: 'GET' });
// }

// // --- Stats ---
// /**
//  * Get the statistics summary.
//  * @returns Stats summary data.
//  */
// export async function getStatsSummary() {
//   return request(`/stats/summary`, { method: 'GET' });
// }

// // --- Agent / Dashboard ---
// /**
//  * Get agent-specific dashboard statistics.
//  * @returns Agent dashboard data.
//  */
// export async function getAgentDashboard() {
//   return request('/agents/dashboard', { method: 'GET' });
// }

// /**
//  * Get a list of lotteries created by the agent.
//  * @param params - Pagination parameters.
//  * @returns List of agent's lotteries.
//  */
// export async function getAgentLotteries(params?: { page?: number; perPage?: number }) {
//   return request(`/agents/lotteries${buildQs(params)}`, { method: 'GET' });
// }

// // --- Utility Functions ---
// /**
//  * Sets the authentication token in localStorage.
//  * Also sets 'kiya_token' for backward compatibility.
//  * @param token - The token string, or null to remove.
//  */
// export function setToken(token: string | null) {
//   if (token) {
//     localStorage.setItem('token', token);
//     // For backward compatibility, also set 'kiya_token' if it's the first time setting 'token'
//     if (!localStorage.getItem('kiya_token')) {
//       localStorage.setItem('kiya_token', token);
//     }
//   } else {
//     localStorage.removeItem('token');
//     localStorage.removeItem('kiya_token');
//   }
// }

// /**
//  * Retrieves the authentication token from localStorage.
//  * Prioritizes 'token', falls back to 'kiya_token'.
//  * @returns The token string, or null if not found.
//  */
// export function getToken(): string | null {
//   return localStorage.getItem('token') || localStorage.getItem('kiya_token');
// }

// /**
//  * Clears the authentication token from localStorage.
//  */
// export function logout() {
//   setToken(null);
//   // Optionally, redirect the user to the login page or clear other state.
//   // window.location.href = '/login'; // Example redirect
// }

// // Exporting the base constant as well
// export { API_BASE };