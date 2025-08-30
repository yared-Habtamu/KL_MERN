export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: "client" | "agent";
  balance: number;
  language: "en" | "am" | "or"; // English, Amharic, Afaan Oromo
  avatar?: string;
}

export interface Prize {
  id: string;
  rank: number;
  name: string;
  image?: string;
  description?: string;
}

export interface Lottery {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  status: "active" | "upcoming" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  drawDate: string;
  prizes: Prize[];
  createdAt: string;
  revenue: number;
  commission: number;
}

export interface Ticket {
  id: string;
  lotteryId: string;
  ticketNumber: number;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  purchaseDate: string;
  status: "active" | "won" | "lost";
  prizeRank?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "ticket_purchase"
    | "prize_payout"
    | "commission";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  date: string;
  reference?: string;
}

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    fullName: "Abebe Kebede",
    phone: "+251911234567",
    role: "client",
    balance: 250.0,
    language: "am",
  },
  {
    id: "2",
    fullName: "Yared hab",
    phone: "+251912345678",
    role: "agent",
    balance: 5420.0,
    language: "or",
  },
  {
    id: "3",
    fullName: "Samuel Tesfaye",
    phone: "+251913456789",
    role: "client",
    balance: 125.5,
    language: "en",
  },
];

// Mock current user (for demo purposes)
export const mockCurrentUser: User = mockUsers[0];

// Mock prizes
export const mockPrizes: Prize[] = [
  {
    id: "1",
    rank: 1,
    name: "iPhone 15 Pro",
    description: "256GB Space Black",
  },
  {
    id: "2",
    rank: 2,
    name: "Samsung Galaxy Watch",
    description: "46mm Bluetooth",
  },
  {
    id: "3",
    rank: 3,
    name: "AirPods Pro",
    description: "2nd Generation",
  },
];

// Mock lotteries
export const mockLotteries: Lottery[] = [
  {
    id: "1",
    title: "Tech Gadgets Mega Draw",
    description:
      "Win the latest tech gadgets including iPhone 15 Pro, Samsung Galaxy Watch, and AirPods Pro. Limited tickets available!",
    agentId: "2",
    agentName: "Fatima Hassan",
    ticketPrice: 25.0,
    totalTickets: 100,
    soldTickets: 67,
    status: "active",
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-01-30T23:59:59Z",
    drawDate: "2024-02-01T15:00:00Z",
    prizes: mockPrizes,
    createdAt: "2024-01-10T10:00:00Z",
    revenue: 1675.0,
    commission: 167.5,
  },
  {
    id: "2",
    title: "Cash Prize Weekly",
    description:
      "Weekly cash prizes for lucky winners. Easy to play, guaranteed winners every week.",
    agentId: "2",
    agentName: "Fatima Hassan",
    ticketPrice: 10.0,
    totalTickets: 200,
    soldTickets: 156,
    status: "active",
    startDate: "2024-01-20T00:00:00Z",
    endDate: "2024-01-27T23:59:59Z",
    drawDate: "2024-01-28T20:00:00Z",
    prizes: [
      { id: "4", rank: 1, name: "5,000 ETB Cash", description: "First Prize" },
      { id: "5", rank: 2, name: "2,000 ETB Cash", description: "Second Prize" },
      { id: "6", rank: 3, name: "1,000 ETB Cash", description: "Third Prize" },
    ],
    createdAt: "2024-01-18T08:00:00Z",
    revenue: 1560.0,
    commission: 156.0,
  },
  {
    id: "3",
    title: "New Year Special",
    description:
      "Celebrate the new year with amazing prizes. Multiple winners guaranteed!",
    agentId: "2",
    agentName: "Fatima Hassan",
    ticketPrice: 50.0,
    totalTickets: 50,
    soldTickets: 50,
    status: "completed",
    startDate: "2023-12-25T00:00:00Z",
    endDate: "2024-01-01T23:59:59Z",
    drawDate: "2024-01-02T18:00:00Z",
    prizes: [
      { id: "7", rank: 1, name: "MacBook Air", description: "M2 Chip 256GB" },
      { id: "8", rank: 2, name: "iPad Air", description: "64GB Wi-Fi" },
    ],
    createdAt: "2023-12-20T12:00:00Z",
    revenue: 2500.0,
    commission: 250.0,
  },
];

// Mock tickets
export const mockTickets: Ticket[] = [
  {
    id: "1",
    lotteryId: "1",
    ticketNumber: 42,
    ownerId: "1",
    ownerName: "Abebe Kebede",
    ownerPhone: "+251911234567",
    purchaseDate: "2024-01-16T14:30:00Z",
    status: "active",
  },
  {
    id: "2",
    lotteryId: "1",
    ticketNumber: 77,
    ownerId: "1",
    ownerName: "Abebe Kebede",
    ownerPhone: "+251911234567",
    purchaseDate: "2024-01-18T09:15:00Z",
    status: "active",
  },
  {
    id: "3",
    lotteryId: "2",
    ticketNumber: 133,
    ownerId: "1",
    ownerName: "Abebe Kebede",
    ownerPhone: "+251911234567",
    purchaseDate: "2024-01-21T16:45:00Z",
    status: "active",
  },
  {
    id: "4",
    lotteryId: "3",
    ticketNumber: 7,
    ownerId: "1",
    ownerName: "Abebe Kebede",
    ownerPhone: "+251911234567",
    purchaseDate: "2023-12-28T11:20:00Z",
    status: "won",
    prizeRank: 2,
  },
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    userId: "1",
    type: "deposit",
    amount: 500.0,
    description: "Mobile Money Deposit",
    status: "completed",
    date: "2024-01-15T10:30:00Z",
    reference: "DEP001234",
  },
  {
    id: "2",
    userId: "1",
    type: "ticket_purchase",
    amount: -25.0,
    description: "Tech Gadgets Mega Draw - Ticket #42",
    status: "completed",
    date: "2024-01-16T14:30:00Z",
    reference: "TKT001234",
  },
  {
    id: "3",
    userId: "1",
    type: "ticket_purchase",
    amount: -25.0,
    description: "Tech Gadgets Mega Draw - Ticket #77",
    status: "completed",
    date: "2024-01-18T09:15:00Z",
    reference: "TKT001235",
  },
  {
    id: "4",
    userId: "1",
    type: "ticket_purchase",
    amount: -10.0,
    description: "Cash Prize Weekly - Ticket #133",
    status: "completed",
    date: "2024-01-21T16:45:00Z",
    reference: "TKT001236",
  },
  {
    id: "5",
    userId: "1",
    type: "prize_payout",
    amount: 800.0,
    description: "New Year Special - 2nd Prize Winner",
    status: "completed",
    date: "2024-01-03T12:00:00Z",
    reference: "PRZ001234",
  },
];

// Utility functions for working with mock data
export const getUserTickets = (userId: string): Ticket[] => {
  return mockTickets.filter((ticket) => ticket.ownerId === userId);
};

export const getUserTransactions = (userId: string): Transaction[] => {
  return mockTransactions.filter(
    (transaction) => transaction.userId === userId,
  );
};

export const getLotteryById = (lotteryId: string): Lottery | undefined => {
  return mockLotteries.find((lottery) => lottery.id === lotteryId);
};

export const getActiveLotteries = (): Lottery[] => {
  return mockLotteries.filter((lottery) => lottery.status === "active");
};

export const getAgentLotteries = (agentId: string): Lottery[] => {
  return mockLotteries.filter((lottery) => lottery.agentId === agentId);
};

export const generateTicketAvailability = (
  totalTickets: number,
  soldTickets: number,
): boolean[] => {
  // Return an array where true = SOLD, false = available
  const soldMap = new Array(totalTickets).fill(false);

  // Randomly mark some tickets as sold
  const soldIndices = new Set<number>();
  while (soldIndices.size < Math.min(soldTickets, totalTickets)) {
    const randomIndex = Math.floor(Math.random() * totalTickets);
    soldIndices.add(randomIndex);
  }

  soldIndices.forEach((index) => {
    soldMap[index] = true;
  });

  return soldMap;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} ETB`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
