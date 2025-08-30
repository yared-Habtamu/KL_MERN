import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Lottery from "../models/Lottery.js";
import Ticket from "../models/Ticket.js";

// Helper function to calculate trend percentage
const calculateTrend = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Helper function to get date ranges
const getDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  return { today, yesterday, sevenDaysAgo, fourteenDaysAgo };
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Helper function to determine activity type based on action
const getActivityType = (action) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('ticket') && actionLower.includes('sold')) {
    return 'ticket';
  }
  if (actionLower.includes('seller') || actionLower.includes('registered')) {
    return 'seller';
  }
  if (actionLower.includes('winner') || actionLower.includes('announced')) {
    return 'winner';
  }
  if (actionLower.includes('lottery') && actionLower.includes('ended')) {
    return 'lottery';
  }
  if (actionLower.includes('sms') || actionLower.includes('sent')) {
    return 'ticket';
  }
  
  return 'info';
};

export const getDashboardOverview = async (req, res) => {
  try {
    const { today, yesterday, sevenDaysAgo, fourteenDaysAgo } = getDateRanges();
    
    // 1. Total Collectors (all collectors in DB)
    const totalCollectors = await User.countDocuments({ role: "seller" });
    const collectorsSevenDaysAgo = await User.countDocuments({
      role: "seller",
      createdAt: { $gte: sevenDaysAgo }
    });
    const collectorsTrend = calculateTrend(totalCollectors, collectorsSevenDaysAgo);
    
    // 2. Total Agents (all agents in DB)
    const totalAgents = await User.countDocuments({ role: "agent" });
    const agentsSevenDaysAgo = await User.countDocuments({
      role: "agent",
      createdAt: { $gte: sevenDaysAgo }
    });
    const agentsTrend = calculateTrend(totalAgents, agentsSevenDaysAgo);
    
    // 3. Revenue from Agent Lotteries
    const agentLotteries = await Lottery.find({ type: "agent" }).populate('createdBy');
    let totalAgentRevenue = 0;
    let totalCommission = 0;
    
    for (const lottery of agentLotteries) {
      const ticketsSold = await Ticket.countDocuments({ lotteryId: lottery._id });
      const lotteryRevenue = ticketsSold * lottery.ticketPrice;
      totalAgentRevenue += lotteryRevenue;
      
      // Get agent commission rate
      if (lottery.createdBy && lottery.createdBy.role === "agent") {
        totalCommission += lotteryRevenue * (lottery.createdBy.commissionRate / 100);
      }
    }
    
    // 4. Active Lotteries (status = active)
    const activeLotteries = await Lottery.countDocuments({ status: "active" });
    const activeLotteriesSevenDaysAgo = await Lottery.countDocuments({
      status: "active",
      createdAt: { $lte: sevenDaysAgo }
    });
    const activeLotteriesTrend = calculateTrend(activeLotteries, activeLotteriesSevenDaysAgo);
    
    // 5. Total Sell (paid/confirmed tickets sold today)
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    // Get today's sales
    const todayTickets = await Ticket.find({
      paymentStatus: "paid",
      paymentConfirmedAt: { $gte: todayStart, $lte: todayEnd }
    }).populate('lotteryId');
    
    const totalSell = todayTickets.reduce((sum, ticket) => {
      return sum + (ticket.lotteryId?.ticketPrice || 0);
    }, 0);
    
    // Get yesterday's sales
    const yesterdayTickets = await Ticket.find({
      paymentStatus: "paid",
      paymentConfirmedAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
    }).populate('lotteryId');
    
    const yesterdaySell = yesterdayTickets.reduce((sum, ticket) => {
      return sum + (ticket.lotteryId?.ticketPrice || 0);
    }, 0);
    
    const totalSellTrend = calculateTrend(totalSell, yesterdaySell);
    
    // 6. Total Users (all registered customers)
    const totalUsers = await Customer.countDocuments();
    const usersSevenDaysAgo = await Customer.countDocuments({ 
      createdAt: { $lte: sevenDaysAgo } 
    });
    const totalUsersTrend = calculateTrend(totalUsers, usersSevenDaysAgo);
    
    // 7. Lotteries Ending Today (status = active, endDate = today)
    const todayDateString = today.toISOString().split('T')[0];
    const lotteriesEndingToday = await Lottery.find({
      status: "active",
      endDate: {
        $gte: new Date(todayDateString),
        $lt: new Date(new Date(todayDateString).getTime() + 24 * 60 * 60 * 1000)
      }
    }).select('_id title endDate');
    
    // 8. Growth Rate (tickets sold in last 7 days vs previous 7 days)
    const currentPeriodStart = new Date(sevenDaysAgo);
    currentPeriodStart.setHours(0, 0, 0, 0);
    const currentPeriodEnd = new Date(today);
    currentPeriodEnd.setHours(23, 59, 59, 999);
    
    const previousPeriodStart = new Date(fourteenDaysAgo);
    previousPeriodStart.setHours(0, 0, 0, 0);
    const previousPeriodEnd = new Date(sevenDaysAgo);
    previousPeriodEnd.setHours(23, 59, 59, 999);
    
    const currentPeriodTickets = await Ticket.countDocuments({
      paymentStatus: "paid",
      paymentConfirmedAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd }
    });
    
    const previousPeriodTickets = await Ticket.countDocuments({
      paymentStatus: "paid",
      paymentConfirmedAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    });
    
    const growthRate = calculateTrend(currentPeriodTickets, previousPeriodTickets);
    
    const response = {
      totalSellers: {
        count: totalCollectors,
        trend: Math.round(collectorsTrend * 100) / 100
      },
      totalAgents: {
        count: totalAgents,
        trend: Math.round(agentsTrend * 100) / 100
      },
      agentCommission: {
        amount: Math.round(totalCommission * 100) / 100,
        trend: 0 // TODO: Calculate trend
      },
      activeLotteries: {
        count: activeLotteries,
        trend: Math.round(activeLotteriesTrend * 100) / 100
      },
      totalSell: {
        amount: totalSell,
        trend: Math.round(totalSellTrend * 100) / 100
      },
      totalUsers: {
        count: totalUsers,
        trend: Math.round(totalUsersTrend * 100) / 100
      },
      lotteriesEndingToday: {
        count: lotteriesEndingToday.length,
        lotteries: lotteriesEndingToday.map(lottery => ({
          id: lottery._id.toString(),
          name: lottery.title,
          endDate: lottery.endDate.toISOString().split('T')[0]
        }))
      }, 
      growthRate: {
        rate: Math.round(growthRate * 100) / 100
      }
    };
     
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard overview',
      error: error.message 
    });
  }
};

export const getStaffByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const staff = await User.find(filter).select('name phone role createdAt status');
    res.json(staff.map(s => ({
      id: s._id,
      name: s.name,
      phone: s.phone,
      role: s.role,
      status: s.status || 'active',
      createdAt: s.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch staff', error: error.message });
  }
};

export const getSellerDashboardSummary = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Tickets sold today (last 24h)
    const ticketsSoldToday = await Ticket.countDocuments({
      soldBy: sellerId,
      soldAt: { $gte: last24h, $lt: now }
    });
    const ticketsSoldYesterday = await Ticket.countDocuments({
      soldBy: sellerId,
      soldAt: { $gte: prev24h, $lt: last24h }
    });
    const ticketsSoldTodayTrend = ticketsSoldYesterday === 0 ? 0 : ((ticketsSoldToday - ticketsSoldYesterday) / ticketsSoldYesterday) * 100;

    // Commission earned today (fixed per ticket)
    const todayTickets = await Ticket.find({
      soldBy: sellerId,
      soldAt: { $gte: last24h, $lt: now }
    }).populate('lotteryId', 'commissionPerTicket');
    const commissionEarnedToday = todayTickets.reduce((sum, t) => sum + (t.lotteryId?.commissionPerTicket || 0), 0);
    const yesterdayTickets = await Ticket.find({
      soldBy: sellerId,
      soldAt: { $gte: prev24h, $lt: last24h }
    }).populate('lotteryId', 'commissionPerTicket');
    const commissionEarnedYesterday = yesterdayTickets.reduce((sum, t) => sum + (t.lotteryId?.commissionPerTicket || 0), 0);
    const commissionEarnedTodayTrend = commissionEarnedYesterday === 0 ? 0 : ((commissionEarnedToday - commissionEarnedYesterday) / commissionEarnedYesterday) * 100;

    // Active lotteries (company lotteries only)
    const activeLotteriesCount = await Lottery.countDocuments({ status: 'active', type: 'company' });

    // Total tickets sold (all time)
    const totalTicketsSold = await Ticket.countDocuments({ soldBy: sellerId });

    res.json({
      ticketsSoldToday: { count: ticketsSoldToday, trend: ticketsSoldTodayTrend },
      commissionEarnedToday: { amount: commissionEarnedToday, trend: commissionEarnedTodayTrend },
      activeLotteries: { count: activeLotteriesCount },
      totalTicketsSold: { count: totalTicketsSold }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch seller dashboard summary', error: error.message });
  }
};

export const getSellerActiveLotteries = async (req, res) => {
  try {
    const lotteries = await Lottery.find({ status: 'active', type: 'company' });
    const result = await Promise.all(lotteries.map(async (lottery) => {
      const ticketsSold = await Ticket.countDocuments({ lotteryId: lottery._id });
      return {
        id: lottery._id,
        name: lottery.title,
        ticketRange: `1–${lottery.ticketCount}`,
        ticketsLeft: lottery.ticketCount - ticketsSold,
        commissionRate: lottery.commissionPerTicket
      };
    }));
    res.json({ lotteries: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active lotteries', error: error.message });
  }
};
