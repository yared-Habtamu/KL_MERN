export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000/api";

export function setToken(token: string | null) {
  if (token) localStorage.setItem("kiya_token", token);
  else localStorage.removeItem("kiya_token");
}

export function getToken() {
  return localStorage.getItem("kiya_token");
}

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = text;
  }
  if (!res.ok) throw { status: res.status, body: json };
  return json;
}

export const auth = {
  register: (payload: {
    phone: string;
    password: string;
    name: string;
    cityAddress?: string;
    kebeleAddress?: string;
    role?: string;
  }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { phone: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  whoami: () => request("/user/profile", { method: "GET" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const wallet = {
  deposit: (amountOrForm: number | FormData) => {
    if (amountOrForm instanceof FormData) {
      // multipart/form-data: don't set Content-Type so fetch sets boundary
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${API_BASE}/wallet/deposit`, {
        method: "POST",
        body: amountOrForm,
        headers,
      }).then(async (res) => {
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          json = text;
        }
        if (!res.ok) throw { status: res.status, body: json };
        return json;
      });
    }
    return request("/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: amountOrForm }),
    });
  },
  get: () => request("/wallet", { method: "GET" }),
  transactions: () => request("/wallet/transactions", { method: "GET" }),
  withdraw: (payload: {
    amount: number;
    method: string;
    accountNumber?: string;
    accountName?: string;
  }) =>
    request("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  // admin helpers
  pending: () => request("/wallet/pending", { method: "GET" }),
  review: (id: string, action: "approve" | "reject") =>
    request(`/wallet/pending/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};

export const lotteries = {
  create: (payload: any) =>
    request("/lotteries", { method: "POST", body: JSON.stringify(payload) }),
  buy: (id: string, payload: any) =>
    request(`/lotteries/${id}/tickets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  // alias for agent manual sell flow
  sell: (id: string, payload: any) =>
    request(`/lotteries/${id}/tickets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  list: async () => {
    const all = await request("/lotteries", { method: "GET" });
    if (!Array.isArray(all)) return all;
    // normalize backend _id to id for frontend convenience
    return all.map((l: any) => ({ ...l, id: String(l.id || l._id) }));
  },
  get: (id: string) => request(`/lotteries/${id}`, { method: "GET" }),
  // winners API
  getWinners: (id: string) =>
    request(`/lotteries/${id}/winners`, { method: "GET" }),
  registerWinners: (
    id: string,
    winners: Array<{ name: string; phone: string }>,
  ) =>
    request(`/lotteries/${id}/winners`, {
      method: "POST",
      body: JSON.stringify({ winners }),
    }),
  // helper to get lotteries for a specific agent (client-side filter)
  forAgent: async (agentId?: string) => {
    const all = await (async () => {
      const list = await request("/lotteries", { method: "GET" });
      return Array.isArray(list)
        ? list.map((l: any) => ({ ...l, id: String(l.id || l._id) }))
        : list;
    })();
    if (!agentId) return all;
    return Array.isArray(all)
      ? all.filter((l: any) => String(l.agentId) === String(agentId))
      : [];
  },
};

export const agentApplications = {
  submit: (data: any) =>
    request(`/agent-applications`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: () => request(`/agent-applications`, { method: "GET" }),
};

export const users = {
  getProfile: (id?: string) =>
    // backend exposes minimal /user/profile for current user
    id
      ? request(`/users/${id}`, { method: "GET" })
      : request(`/user/profile`, { method: "GET" }),
  updateProfile: (payload: any) =>
    request(`/users/me`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const tickets = {
  list: async () => {
    const res = await request(`/tickets`, { method: "GET" });
    if (!Array.isArray(res)) return res;
    return res.map((t: any) => ({
      ...t,
      id: String(t.id || t._id),
      lotteryId: String(t.lotteryId),
      purchaseDate: t.purchasedAt || t.purchaseDate || t.createdAt,
      amount: Number(t.price ?? t.amount ?? 0),
      ticketNumber:
        t.ticketNumber != null
          ? t.ticketNumber
          : Array.isArray(t.selections) && t.selections.length === 1
            ? t.selections[0]
            : null,
    }));
  },
  myTickets: async () => {
    const res = await request(`/tickets/user/me`, { method: "GET" });
    if (!Array.isArray(res)) return res;
    return res.map((t: any) => ({
      ...t,
      id: String(t.id || t._id),
      lotteryId: String(t.lotteryId),
      purchaseDate: t.purchasedAt || t.purchaseDate || t.createdAt,
      amount: Number(t.price ?? t.amount ?? 0),
      ticketNumber:
        t.ticketNumber != null
          ? t.ticketNumber
          : Array.isArray(t.selections) && t.selections.length === 1
            ? t.selections[0]
            : null,
    }));
  },
  forLottery: async (lotteryId: string) => {
    const res = await request(`/tickets/lottery/${lotteryId}`, {
      method: "GET",
    });
    if (!Array.isArray(res)) return res;
    return res.map((t: any) => ({
      ...t,
      id: String(t.id || t._id),
      lotteryId: String(t.lotteryId),
      purchaseDate: t.purchasedAt || t.purchaseDate || t.createdAt,
      amount: Number(t.price ?? t.amount ?? 0),
      ticketNumber:
        t.ticketNumber != null
          ? t.ticketNumber
          : Array.isArray(t.selections) && t.selections.length === 1
            ? t.selections[0]
            : null,
    }));
  },
};

export const notifications = {
  list: () => request(`/notifications`, { method: "GET" }),
};

export const stats = {
  summary: () => request(`/stats/summary`, { method: "GET" }),
};
