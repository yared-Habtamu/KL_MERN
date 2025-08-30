import User from "../models/User.js";
import Lottery from "../models/Lottery.js";
import Ticket from "../models/Ticket.js";
import ActivityLog from "../models/ActivityActivity.js";
import bcrypt from "bcryptjs";

// Helper function to calculate trend percentage
const calculateTrend = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Helper function to get date ranges
const getDateRanges = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  return { today, yesterday, sevenDaysAgo, fourteenDaysAgo };
};

// Helper function to log activities
const logActivity = async (action, details, severity = 'info') => {
  try {
    await ActivityLog.create({
      action,
      details,
      severity,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Get agents dashboard data
export const getAgentsDashboard = async (req, res) => {
  try {
    const { today, sevenDaysAgo, fourteenDaysAgo } = getDateRanges();
    
    // 1. Total Agents (all agents in DB)
    const totalAgents = await User.countDocuments({ role: "agent" });
    const agentsSevenDaysAgo = await User.countDocuments({
      role: "agent",
      createdAt: { $lte: sevenDaysAgo }
    });
    const totalAgentsTrend = calculateTrend(totalAgents, agentsSevenDaysAgo);
    
    // 2. Total Commission Paid (sum of all commissions disbursed to agents)
    const agentLotteries = await Lottery.find({ type: "agent" }).populate('createdBy');
    let totalCommissionPaid = 0;
    let totalCommissionPaidSevenDaysAgo = 0;
    
    for (const lottery of agentLotteries) {
      const ticketsSold = await Ticket.countDocuments({ 
        lotteryId: lottery._id,
        paymentStatus: 'paid'
      });
      const lotteryRevenue = ticketsSold * lottery.ticketPrice;
      
      if (lottery.createdBy && lottery.createdBy.role === "agent") {
        const commission = lotteryRevenue * (lottery.createdBy.commissionRate / 100);
        totalCommissionPaid += commission;
        
        // Check if lottery was created before 7 days ago for trend calculation
        if (lottery.createdAt < sevenDaysAgo) {
          totalCommissionPaidSevenDaysAgo += commission;
        }
      }
    }
    
    const totalCommissionPaidTrend = calculateTrend(totalCommissionPaid, totalCommissionPaidSevenDaysAgo);
    
    // 3. Average Commission (average commission per agent)
    const agentsWithCommission = await User.find({ role: "agent" });
    let totalCommissionRate = 0;
    let activeAgentsCount = 0;
    
    for (const agent of agentsWithCommission) {
      const agentLotteries = await Lottery.find({ 
        createdBy: agent._id,
        type: "agent"
      });
      
      if (agentLotteries.length > 0) {
        totalCommissionRate += agent.commissionRate || 0;
        activeAgentsCount++;
      }
    }
    
    const averageCommission = activeAgentsCount > 0 ? totalCommissionRate / activeAgentsCount : 0;
    
    // 4. Tickets Sold Today by Agents Only
    // Find all agent staff IDs
    const agentStaff = await User.find({ role: "agent" }, { _id: 1 });
    const agentIds = agentStaff.map(agent => agent._id);

    // Tickets sold today by agents
    const ticketsSoldTodayByAgents = await Ticket.countDocuments({
      paymentStatus: 'paid',
      soldAt: { $gte: today },
      soldBy: { $in: agentIds }
    });

    // Tickets sold by agents exactly 7 days ago (same time window)
    const todayMinus7 = new Date(today);
    todayMinus7.setDate(todayMinus7.getDate() - 7);
    const todayMinus6 = new Date(today);
    todayMinus6.setDate(todayMinus6.getDate() - 6);
    // todayMinus7 is 7 days ago at 00:00, todayMinus6 is 6 days ago at 00:00
    // So the window is [todayMinus7, todayMinus6)
    const ticketsSold7DaysAgoByAgents = await Ticket.countDocuments({
      paymentStatus: 'paid',
      soldAt: { $gte: todayMinus7, $lt: todayMinus6 },
      soldBy: { $in: agentIds }
    });

    const ticketsSoldTodayTrend = calculateTrend(ticketsSoldTodayByAgents, ticketsSold7DaysAgoByAgents);

    res.json({
      totalAgents: {
        count: totalAgents,
        trend: totalAgentsTrend
      },
      totalCommissionPaid: {
        amount: totalCommissionPaid,
        trend: totalCommissionPaidTrend
      },
      averageCommission: {
        rate: averageCommission,
        activeAgents: activeAgentsCount
      },
      ticketsSoldTodayByAgents: {
        count: ticketsSoldTodayByAgents,
        trend: ticketsSoldTodayTrend
      }
    });
  } catch (error) {
    console.error('Error fetching agents dashboard:', error);
    res.status(500).json({ 
      message: 'Failed to fetch agents dashboard data',
      error: error.message 
    });
  }
};

// Get all agents with filters, sorting, and pagination
export const getAgents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { role: "agent" };

    // Search by name or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get agents with pagination and sorting
    const agents = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get detailed stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // Get agent's lotteries
        const agentLotteries = await Lottery.find({ 
          createdBy: agent._id,
          type: "agent"
        });

        // Calculate total tickets sold and commission
        let totalTicketsSold = 0;
        let totalCommission = 0;

        for (const lottery of agentLotteries) {
          const ticketsSold = await Ticket.countDocuments({
            lotteryId: lottery._id,
            paymentStatus: 'paid'
          });
          const lotteryRevenue = ticketsSold * lottery.ticketPrice;
          totalTicketsSold += ticketsSold;
          totalCommission += lotteryRevenue * (agent.commissionRate / 100);
        }

        return {
          id: agent._id,
          name: agent.name,
          phone: agent.phone,
          commissionRate: agent.commissionRate,
          registeredAt: agent.createdAt,
          totalTicketsSold,
          totalCommission,
          lotteriesCount: agentLotteries.length
        };
      })
    );

    res.json({
      agents: agentsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
};

// Get agent by ID
export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await User.findById(id);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({
        message: 'Agent not found'
      });
    }

    // Get agent's lotteries
    const agentLotteries = await Lottery.find({ 
      createdBy: agent._id,
      type: "agent"
    });

    // Calculate detailed stats
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalCommission = 0;

    for (const lottery of agentLotteries) {
      const ticketsSold = await Ticket.countDocuments({
        lotteryId: lottery._id,
        paymentStatus: 'paid'
      });
      const lotteryRevenue = ticketsSold * lottery.ticketPrice;
      totalTicketsSold += ticketsSold;
      totalRevenue += lotteryRevenue;
      totalCommission += lotteryRevenue * (agent.commissionRate / 100);
    }

    const agentData = {
      id: agent._id,
      name: agent.name,
      phone: agent.phone,
      commissionRate: agent.commissionRate,
      registeredAt: agent.createdAt,
      totalTicketsSold,
      totalRevenue,
      totalCommission,
      lotteriesCount: agentLotteries.length,
      lotteries: agentLotteries.map(lottery => ({
        id: lottery._id,
        title: lottery.title,
        status: lottery.status,
        ticketsSold: 0, // Will be calculated if needed
        revenue: 0, // Will be calculated if needed
        createdAt: lottery.createdAt
      }))
    };

    res.json(agentData);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      message: 'Failed to fetch agent',
      error: error.message
    });
  }
};

// Update agent
export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, commissionRate } = req.body;

    // Check if agent exists
    const agent = await User.findById(id);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({
        message: 'Agent not found'
      });
    }

    // Validate commission rate
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        message: 'Commission rate must be between 0 and 100'
      });
    }

    // Update agent
    const updatedAgent = await User.findByIdAndUpdate(
      id,
      { name, phone, commissionRate },
      { new: true, runValidators: true }
    );

    // Log activity
    await logActivity(
      'Agent Updated',
      `Agent "${updatedAgent.name}" updated by ${req.user.name || req.user.role}`,
      'info'
    );

    res.json({
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      message: 'Failed to update agent',
      error: error.message
    });
  }
};

// Delete agent
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if agent exists
    const agent = await User.findById(id);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({
        message: 'Agent not found'
      });
    }

    // Check if agent has active lotteries
    const activeLotteries = await Lottery.countDocuments({
      createdBy: agent._id,
      status: 'active'
    });

    if (activeLotteries > 0) {
      return res.status(400).json({
        message: 'Cannot delete agent with active lotteries'
      });
    }

    // Delete agent
    await User.findByIdAndDelete(id);

    // Log activity
    await logActivity(
      'Agent Deleted',
      `Agent "${agent.name}" deleted by ${req.user.name || req.user.role}`,
      'info'
    );

    res.json({
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({
      message: 'Failed to delete agent',
      error: error.message
    });
  }
};

// Create a new agent
export const createAgent = async (req, res) => {
  try {
    const { name, phone, password, commissionRate } = req.body;
    // Only admin or manager can create agents
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (!name || !phone || !password || commissionRate === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Check if phone already exists
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const agent = await User.create({
      name,
      phone,
      passwordHash,
      commissionRate,
      role: 'agent',
    });
    // Log activity
    await logActivity(
      'Agent Created',
      `Agent "${agent.name}" created by ${req.user.name || req.user.role}`,
      'info'
    );
    // Return agent info (exclude passwordHash)
    const { passwordHash: _, ...agentData } = agent.toObject();
    res.status(201).json({ agent: agentData });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ message: 'Failed to create agent', error: error.message });
  }
}; 