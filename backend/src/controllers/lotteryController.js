import Lottery from "../models/Lottery.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import ActivityLog from "../models/ActivityActivity.js";
import Joi from 'joi';
import { requireOperator, requireAdminOrManager } from '../middleware/roles.js';
import { checkLotteryStatus, incrementTicketsSold, endLotteryIfSoldOut } from '../utils/lotteryUtils.js';

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

// Helper to get winning ticket numbers for a lottery
const getWinningNumbersForLottery = async (lotteryId) => {
  const lottery = await Lottery.findById(lotteryId).select('winningTicketNumber');
  return lottery?.winningTicketNumber || [];
};

// Joi schema for selling a ticket
const sellTicketSchema = Joi.object({
  lotteryId: Joi.string().required(),
  ticketNumber: Joi.number().integer().min(1).required(),
  customerName: Joi.string().max(100).required(),
  customerPhone: Joi.string().required()
});

export const createLottery = async (req, res) => {
  try {
    const {
      title,
      description,
      ticketCount,
      ticketPrice,
      commissionPerTicket,
      numberOfWinners,
      prizes
    } = req.body;

    console.log('User data from token:', req.user);
    console.log('Request body:', req.body);

    // Validate required fields
    if (!title || !ticketPrice) {
      return res.status(400).json({
        message: 'Title and ticket price are required'
      });
    }

    // Validate character limits
    if (title.length > 100) {
      return res.status(400).json({
        message: 'Title must be 100 characters or less'
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        message: 'Description must be 500 characters or less'
      });
    }

    // Validate ticket price
    if (ticketPrice <= 0) {
      return res.status(400).json({
        message: 'Ticket price must be greater than 0'
      });
    }

    // Validate numberOfWinners
    if (typeof numberOfWinners !== 'number' || numberOfWinners <= 0) {
      return res.status(400).json({ message: 'Number of winners must be a positive number' });
    }
    if (numberOfWinners > ticketCount) {
      return res.status(400).json({ message: 'Number of winners cannot exceed ticket count' });
    }
    if (!Array.isArray(prizes) || prizes.length !== numberOfWinners) {
      return res.status(400).json({ message: 'Prizes array must match number of winners' });
    }
    for (let i = 0; i < prizes.length; i++) {
      if (!prizes[i].title) {
        return res.status(400).json({ message: `Prize #${i+1} must have a title` });
      }
      // image is now optional
    }
    // Auto-assign rank
    const prizesWithRank = prizes.map((prize, idx) => ({
      rank: idx + 1,
      title: prize.title,
      ...(prize.imageUrl ? { imageUrl: prize.imageUrl } : {})
    }));

    // Determine lottery type based on user role
    const isAgent = req.user.role === 'agent';
    const lotteryType = isAgent ? 'agent' : 'company';
    
    console.log('Lottery type determination:', { userRole: req.user.role, isAgent, lotteryType });

    // Create lottery object
    const lotteryData = {
      title: title.trim(),
      description: description?.trim() || '',
      ticketCount: ticketCount || 0,
      ticketPrice,
      commissionPerTicket: commissionPerTicket || 0,
      type: lotteryType,
      createdBy: req.user.id, // Current user creating the lottery
      prizes: prizesWithRank,
      numberOfWinners
    };
    
    console.log('Final lottery data:', lotteryData);

    // Create the lottery
    const lottery = new Lottery(lotteryData);
    await lottery.save();

    // Log activity
    await logActivity(
      'Lottery Created', 
      `New lottery "${lottery.title}" created by ${req.user.name || req.user.role}`,
      'success'
    );

    res.status(201).json({
      message: 'Lottery created successfully',
      lottery: {
        ...lottery.toObject(),
        prizes: undefined // do not return prizes in create response
      }
    });

  } catch (error) {
    console.error('Create lottery error:', error);
    res.status(500).json({
      message: 'Failed to create lottery',
      error: error.message
    });
  }
};

export const getAllLotteries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object: active first, then ended, then by createdAt desc
    // status: 'active' < 'ended' (alphabetically), so we use custom sort
    const sort = {
      status: 1, // active first, then ended
      createdAt: -1 // newest first within each status
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Lottery.countDocuments(filter);

    // Get lotteries with pagination, sorting, and population
    const lotteries = await Lottery.find(filter)
      .populate('createdBy', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get ticket counts for each lottery
    const lotteriesWithTickets = await Promise.all(
      lotteries.map(async (lottery) => {
        const ticketsSold = await Ticket.countDocuments({
          lotteryId: lottery._id,
          paymentStatus: 'paid'
        });

        return {
          id: lottery._id,
          title: lottery.title,
          creator: lottery.createdBy?.name || 'Unknown',
          type: lottery.type,
          status: lottery.status,
          ticketsSold,
          ticketPrice: lottery.ticketPrice,
          startDate: lottery.startDate,
          endDate: lottery.endDate,
          createdAt: lottery.createdAt
        };
      })
    );

    res.json({
      lotteries: lotteriesWithTickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get lotteries error:', error);
    res.status(500).json({
      message: 'Failed to fetch lotteries',
      error: error.message
    });
  }
};

export const getLotteriesDashboard = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Helper function to calculate trend percentage
    const calculateTrend = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // 1. Active Lotteries (status: "active")
    const activeLotteries = await Lottery.countDocuments({ status: "active" });
    const activeLotteriesSevenDaysAgo = await Lottery.countDocuments({
      status: "active",
      createdAt: { $lte: sevenDaysAgo }
    });
    const activeLotteriesTrend = calculateTrend(activeLotteries, activeLotteriesSevenDaysAgo);

    // 2. Pending Draws (ending today or overdue)
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const pendingDraws = await Lottery.countDocuments({
      status: "active",
      $or: [
        // Ending today
        {
          endDate: { $gte: todayStart, $lte: todayEnd }
        },
        // Overdue (endDate passed but still active)
        {
          endDate: { $lt: todayStart }
        }
      ]
    });

    const pendingDrawsSevenDaysAgo = await Lottery.countDocuments({
      status: "active",
      $or: [
        {
          endDate: { 
            $gte: new Date(sevenDaysAgo.setHours(0, 0, 0, 0)), 
            $lte: new Date(sevenDaysAgo.setHours(23, 59, 59, 999)) 
          }
        },
        {
          endDate: { $lt: new Date(sevenDaysAgo.setHours(0, 0, 0, 0)) }
        }
      ]
    });
    const pendingDrawsTrend = calculateTrend(pendingDraws, pendingDrawsSevenDaysAgo);

    // 3. This Week (lotteries created in last 7 days)
    const thisWeekLotteries = await Lottery.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const previousWeekLotteries = await Lottery.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });
    const thisWeekTrend = calculateTrend(thisWeekLotteries, previousWeekLotteries);

    // 4. Total Participants (all customers)
    const totalParticipants = await Customer.countDocuments();
    const participantsSevenDaysAgo = await Customer.countDocuments({
      createdAt: { $lte: sevenDaysAgo }
    });
    const totalParticipantsTrend = calculateTrend(totalParticipants, participantsSevenDaysAgo);

    // 5. Completed Lotteries (status: "ended")
    const completedLotteries = await Lottery.countDocuments({ status: "ended" });
    const completedLotteriesSevenDaysAgo = await Lottery.countDocuments({
      status: "ended",
      createdAt: { $lte: sevenDaysAgo }
    });
    const completedLotteriesTrend = calculateTrend(completedLotteries, completedLotteriesSevenDaysAgo);

    // 6. Lotteries Ended Today
    const endedTodayLotteries = await Lottery.find({
      status: 'ended',
      endedAt: { $gte: todayStart, $lte: todayEnd }
    }, { _id: 1, title: 1 });
    const endedTodayCount = endedTodayLotteries.length;

    const response = {
      activeLotteries: {
        count: activeLotteries,
        trend: Math.round(activeLotteriesTrend * 100) / 100
      },
      pendingDraws: {
        count: pendingDraws,
        trend: Math.round(pendingDrawsTrend * 100) / 100
      },
      thisWeek: {
        count: thisWeekLotteries,
        trend: Math.round(thisWeekTrend * 100) / 100
      },
      totalParticipants: {
        count: totalParticipants,
        trend: Math.round(totalParticipantsTrend * 100) / 100
      },
      completedLotteries: {
        count: completedLotteries,
        trend: Math.round(completedLotteriesTrend * 100) / 100
      },
      endedToday: {
        count: endedTodayCount,
        lotteries: endedTodayLotteries.map(l => ({ id: l._id, title: l.title }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching lotteries dashboard:', error);
    res.status(500).json({
      message: 'Failed to fetch lotteries dashboard',
      error: error.message
    });
  }
};

export const getLotteryById = async (req, res) => {
  try {
    const { id } = req.params;

    const lottery = await Lottery.findById(id)
      .populate('createdBy', 'name role');

    if (!lottery) {
      return res.status(404).json({
        message: 'Lottery not found'
      });
    }

    // Get ticket count for this lottery
    const ticketsSold = await Ticket.countDocuments({
      lotteryId: lottery._id,
      paymentStatus: 'paid'
    });

    const lotteryData = {
      _id: lottery._id,
      title: lottery.title,
      description: lottery.description,
      creator: lottery.createdBy?.name || 'Unknown',
      type: lottery.type,
      status: lottery.status,
      soldTickets: ticketsSold,
      ticketCount: lottery.ticketCount,
      ticketPrice: lottery.ticketPrice,
      commissionPerTicket: lottery.commissionPerTicket,
      startDate: lottery.startDate,
      endDate: lottery.endDate,
      createdAt: lottery.createdAt,
      imageUrl: Array.isArray(lottery.images) && lottery.images.length > 0 ? lottery.images[0] : undefined,
      images: lottery.images || [],
      numberOfWinners: lottery.numberOfWinners,
      prizes: lottery.prizes // include prizes only in detail
    };

    res.json(lotteryData);
  } catch (error) {
    console.error('Get lottery by ID error:', error);
    res.status(500).json({
      message: 'Failed to fetch lottery',
      error: error.message
    });
  }
};

export const updateLottery = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if lottery exists
    const existingLottery = await Lottery.findById(id);
    if (!existingLottery) {
      return res.status(404).json({
        message: 'Lottery not found'
      });
    }

    // Only allow updates if lottery is not ended
    if (existingLottery.status === 'ended') {
      return res.status(400).json({
        message: 'Cannot edit ended lotteries'
      });
    }

    // Validate ticket count - only allow increasing
    if (updateData.ticketCount !== undefined) {
      const soldTickets = await Ticket.countDocuments({
        lotteryId: existingLottery._id,
        paymentStatus: 'paid'
      });
      
      if (updateData.ticketCount < soldTickets) {
        return res.status(400).json({
          message: `Cannot set ticket count below ${soldTickets} (already sold tickets)`
        });
      }
    }

    // Validate prizes count doesn't exceed ticket count
    if (updateData.prizes && Array.isArray(updateData.prizes)) {
      const maxPrizes = updateData.ticketCount || existingLottery.ticketCount;
      if (updateData.prizes.length > maxPrizes) {
        return res.status(400).json({
          message: `Cannot have more prizes (${updateData.prizes.length}) than ticket count (${maxPrizes})`
        });
      }
    }

    // Update the lottery
    const updatedLottery = await Lottery.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name role');

    // Log activity
    await logActivity(
      'Lottery Updated', 
      `Lottery "${updatedLottery.title}" updated by ${req.user.name || req.user.role}`,
      'info'
    );

    res.json({
      message: 'Lottery updated successfully',
      lottery: updatedLottery
    });
  } catch (error) {
    console.error('Update lottery error:', error);
    res.status(500).json({
      message: 'Failed to update lottery',
      error: error.message
    });
  }
};

export const deleteLottery = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if lottery exists
    const lottery = await Lottery.findById(id);
    if (!lottery) {
      return res.status(404).json({
        message: 'Lottery not found'
      });
    }

    // Delete all related tickets first
    await Ticket.deleteMany({ lotteryId: id });

    // Delete the lottery
    await Lottery.findByIdAndDelete(id);

    // Log activity
    await logActivity(
      'Lottery Deleted', 
      `Lottery "${lottery.title}" deleted by ${req.user.name || req.user.role}`,
      'info'
    );

    res.json({
      message: 'Lottery and all related tickets deleted successfully'
    });
  } catch (error) {
    console.error('Delete lottery error:', error);
    res.status(500).json({
      message: 'Failed to delete lottery',
      error: error.message
    });
  }
};

// Get all sold tickets for a lottery (returns array of sold ticket numbers)
export const getSoldTicketsForLottery = async (req, res) => {
  try {
    const { id } = req.params;
    const soldTickets = await Ticket.find({
      lotteryId: id,
      paymentStatus: 'paid'
    }, 'ticketNumber');
    const soldNumbers = soldTickets.map(t => t.ticketNumber);
    res.json({ soldNumbers });
  } catch (error) {
    console.error('Get sold tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch sold tickets', error: error.message });
  }
};

// Normalize phone to 09/07 format
function normalizePhone(phone) {
  let p = phone.trim();
  if (p.startsWith('+2519')) return '09' + p.slice(5);
  if (p.startsWith('+2517')) return '07' + p.slice(5);
  if (p.startsWith('2519')) return '09' + p.slice(4);
  if (p.startsWith('2517')) return '07' + p.slice(4);
  if (p.startsWith('9')) return '09' + p.slice(1);
  if (p.startsWith('7')) return '07' + p.slice(1);
  if (p.startsWith('09') || p.startsWith('07')) return p;
  return p; // fallback, may want to add more cases
}

// Atomically sell a ticket
export const sellTicketAtomic = async (req, res) => {
  try {
    // Joi validation
    const { error, value } = sellTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    let { lotteryId, ticketNumber, customerName, customerPhone } = value;
    // Sanitize customerName
    customerName = customerName.replace(/[&<>'"]/g, function (tag) {
      const charsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return charsToReplace[tag] || tag;
    });
    // Normalize phone
    const normalizedPhone = normalizePhone(customerPhone);
    // Find or create customer
    let customer = await Customer.findOne({ phone: normalizedPhone });
    if (!customer) {
      customer = await Customer.create({ name: customerName, phone: normalizedPhone });
    }
    // Use utility to check lottery status
    const lottery = await checkLotteryStatus(lotteryId, 'active');
    if (lottery.ticketsSold >= lottery.ticketCount) {
      return res.status(400).json({ message: 'All tickets are sold for this lottery.' });
    }
    // Atomically create ticket if not already sold
    const now = new Date();
    const uniqueTicketCode = `${lotteryId}-${ticketNumber}`;
    // First check if ticket already exists and is paid
    const existingTicket = await Ticket.findOne({
      lotteryId,
      ticketNumber,
      paymentStatus: 'paid'
    });
    if (existingTicket) {
      return res.status(409).json({ message: 'Ticket already sold' });
    }
    // Try to create the ticket atomically
    const ticket = await Ticket.findOneAndUpdate(
      {
        lotteryId,
        ticketNumber,
        paymentStatus: { $ne: 'paid' }
      },
      {
        $setOnInsert: {
          lotteryId,
          ticketNumber,
          uniqueTicketCode,
          customer: customer._id,
          soldBy: req.user?.id,
          soldAt: now,
          paymentStatus: 'paid',
          paymentConfirmedAt: now,
          status: 'sold',
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    // Use utility to increment tickets sold
    await incrementTicketsSold(lottery);
    // Use utility to end lottery if sold out
    await endLotteryIfSoldOut(lottery);
    // Return updated sold numbers
    const soldTickets = await Ticket.find({
      lotteryId,
      paymentStatus: 'paid'
    }, 'ticketNumber');
    const soldNumbers = soldTickets.map(t => t.ticketNumber);
    // Log activity for ticket sale
    await logActivity(
      'Ticket Sold',
      `Ticket #${ticketNumber} sold for "${lottery?.title || 'Unknown Lottery'}" to ${customerName}`,
      'success'
    );
    return res.json({ success: true, soldNumbers });
  } catch (error) {
    console.error('Sell ticket error:', error);
    res.status(500).json({ message: 'Failed to sell ticket', error: error.message });
  }
};

// Get tickets with filters and pagination
export const getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      status = '',
      smsStatus = '',
    } = req.query;

    const filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // SMS status filter
    if (smsStatus && smsStatus !== 'all') {
      filter.smsSent = smsStatus === 'sent';
    }

    // Search by customer name, phone, or ticket number
    if (search) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }, { _id: 1 });
      const customerIds = customers.map(c => c._id);
      const orFilters = [];
      if (customerIds.length > 0) orFilters.push({ customer: { $in: customerIds } });
      if (!isNaN(Number(search))) orFilters.push({ ticketNumber: Number(search) });
      if (orFilters.length > 0) filter.$or = orFilters;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await Ticket.countDocuments(filter);

    // Log the filter for debugging
    console.log('Ticket filter:', filter);

    // Get tickets with population
    let tickets = [];
    try {
      tickets = await Ticket.find(filter)
        .populate('lotteryId', 'title status winningTicketNumber prizes')
        .populate('customer', 'name phone')
        .populate({ path: 'soldBy', select: 'name role', options: { strictPopulate: false } })
        .sort({ soldAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    } catch (popError) {
      console.error('Ticket population error:', popError);
      return res.status(500).json({ message: 'Failed to populate ticket references', error: popError.message });
    }

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
};

// Ticket widgets dashboard
export const getTicketsDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Total Tickets Sold
    const totalTickets = await Ticket.countDocuments({});

    // 2. Active Tickets (tickets for active lotteries)
    const activeLotteries = await Lottery.find({ status: 'active' }, { _id: 1 });
    const activeLotteryIds = activeLotteries.map(l => l._id);
    const activeTickets = await Ticket.countDocuments({ lotteryId: { $in: activeLotteryIds } });

    // 3. Total Revenue (sum of ticket prices for all sold tickets)
    const tickets = await Ticket.find({ paymentStatus: 'paid' }).populate('lotteryId', 'ticketPrice');
    let totalRevenue = 0;
    let totalTicketValue = 0;
    let ticketCount = 0;
    tickets.forEach(t => {
      const price = t.lotteryId?.ticketPrice || 0;
      totalRevenue += price;
      totalTicketValue += price;
      ticketCount++;
    });

    // 4. Tickets Sold Today
    const ticketsSoldToday = await Ticket.countDocuments({ soldAt: { $gte: today, $lt: tomorrow } });

    // 5. Average Ticket Value
    const avgTicketValue = ticketCount > 0 ? totalTicketValue / ticketCount : 0;

    res.json({
      totalTickets,
      activeTickets,
      totalRevenue,
      ticketsSoldToday,
      avgTicketValue,
    });
  } catch (error) {
    console.error('Error fetching tickets dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch tickets dashboard', error: error.message });
  }
};

// Delete a ticket by ID (only if status is 'pending' or for testing)
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    // Fetch the associated lottery
    const lottery = await Lottery.findById(ticket.lotteryId);
    if (!lottery) {
      return res.status(404).json({ message: 'Associated lottery not found' });
    }
    // Allow if: lottery is active, or ended but winners not assigned
    const winningNumbers = await getWinningNumbersForLottery(lottery._id);
    const winnersAssigned = Array.isArray(winningNumbers) && winningNumbers.length > 0;
    if (lottery.status === 'ended' && winnersAssigned) {
      return res.status(400).json({ message: 'Cannot delete ticket: winners have already been announced for this lottery.' });
    }
    // Delete the ticket
    await Ticket.findByIdAndDelete(id);
    // Log activity
    await logActivity(
      'Ticket Deleted',
      `Ticket #${ticket.ticketNumber} for lottery "${lottery.title}" was deleted by ${req.user?.name || req.user?.role || 'system'}`,
      'success'
    );
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
  }
}; 

// Get ended lotteries without winners
export const getEndedLotteriesWithoutWinners = async (req, res) => {
  try {
    const lotteries = await Lottery.find({
      status: "ended",
      $or: [
        { winningTicketNumber: { $exists: false } },
        { winningTicketNumber: { $size: 0 } },
        { winningTicketNumber: null }
      ]
    }).select('title prizes winningTicketNumber tiktokStreamLink');

    res.json(lotteries);
  } catch (error) {
    console.error('Error fetching ended lotteries without winners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Enter winners for a lottery
export const enterWinners = async (req, res) => {
  try {
    const { id } = req.params;
    const { tiktokStreamLink, winningTickets } = req.body;

    // Debug logging
    console.log('[enterWinners] id param:', id);
    const lottery = await Lottery.findById(id);
    console.log('[enterWinners] Lottery.findById result:', lottery);
    if (!lottery) {
      return res.status(404).json({ message: 'Lottery not found' });
    }

    if (lottery.status !== 'ended') {
      return res.status(400).json({ message: 'Lottery is not ended yet' });
    }

    const winningNumbers = await getWinningNumbersForLottery(lottery._id);
    if (winningNumbers && winningNumbers.length > 0) {
      return res.status(400).json({ message: 'Winners have already been entered for this lottery' });
    }

    // Validate winning tickets
    const validationErrors = [];
    const usedTicketNumbers = new Set();

    for (const winningTicket of winningTickets) {
      const { rank, ticketNumber } = winningTicket;

      // Check if ticket number is already used
      if (usedTicketNumbers.has(ticketNumber)) {
        validationErrors.push(`Ticket number ${ticketNumber} is used for multiple prizes`);
        continue;
      }
      usedTicketNumbers.add(ticketNumber);

      // Find the ticket
      const ticket = await Ticket.findOne({
        lotteryId: id,
        ticketNumber: ticketNumber
      });

      if (!ticket) {
        validationErrors.push(`Ticket number ${ticketNumber} does not exist in this lottery`);
        continue;
      }

      if (ticket.paymentStatus !== 'paid') {
        validationErrors.push(`Ticket number ${ticketNumber} is not paid`);
        continue;
      }

      if (ticket.status === 'winner') {
        validationErrors.push(`Ticket number ${ticketNumber} is already a winner in another lottery`);
        continue;
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Update tickets and mark as winners
    const winningTicketNumbers = [];
    for (const winningTicket of winningTickets) {
      const { rank, ticketNumber } = winningTicket;
      
      await Ticket.findOneAndUpdate(
        {
          lotteryId: id,
          ticketNumber: ticketNumber
        },
        {
          status: 'winner',
          winnerRank: rank
        }
      );

      winningTicketNumbers.push(ticketNumber);
    }

    // Update lottery with winning ticket numbers and TikTok link
    await Lottery.findByIdAndUpdate(id, {
      winningTicketNumber: winningTicketNumbers,
      tiktokStreamLink: tiktokStreamLink
    });

    // Log activity
    const activityMessage = `${winningTickets.length} winners recorded for '${lottery.title}'`;
    await logActivity("Winners Entered", activityMessage, "success");

    res.json({ 
      message: 'Winners entered successfully',
      winningTicketNumbers,
      tiktokStreamLink
    });

  } catch (error) {
    console.error('Error entering winners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

export const updateWinners = async (req, res) => {
  try {
    const { id } = req.params;
    const { tiktokStreamLink, winningTickets } = req.body;

    const lottery = await Lottery.findById(id);
    if (!lottery) {
      return res.status(404).json({ message: 'Lottery not found' });
    }

    // 1. Remove winner status from all previous winner tickets for this lottery
    await Ticket.updateMany(
      { lotteryId: id, status: 'winner' },
      { $set: { status: 'sold', winnerRank: null } }
    );

    // 2. Set new winner tickets
    if (winningTickets) {
      for (const winningTicket of winningTickets) {
        await Ticket.findOneAndUpdate(
          { lotteryId: id, ticketNumber: winningTicket.ticketNumber },
          { $set: { status: 'winner', winnerRank: winningTicket.rank } }
        );
      }
      lottery.winningTicketNumber = winningTickets.map(w => w.ticketNumber);
    }
    if (tiktokStreamLink !== undefined) {
      lottery.tiktokStreamLink = tiktokStreamLink;
    }
    await lottery.save();

    res.json({ message: 'Winners/TikTok link updated successfully' });
  } catch (error) {
    console.error('Error updating winners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 



// --- OPERATOR DASHBOARD STATS ---
export const getOperatorDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Active lotteries
    const activeLotteries = await Lottery.find({ status: 'active' }, { _id: 1 });
    const activeLotteryIds = activeLotteries.map(l => l._id);

    // Ended lotteries with winners assigned
    const endedLotteriesWithWinners = await Lottery.find({
      status: 'ended',
      $or: [
        { winningTicketNumber: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { winners: { $exists: true, $ne: [], $not: { $size: 0 } } }
      ]
    }, { _id: 1 });
    const endedLotteryIds = endedLotteriesWithWinners.map(l => l._id);

    // --- Pending SMS ---
    const pendingSmsNow = await Ticket.countDocuments({
      lotteryId: { $in: activeLotteryIds },
      smsSent: false
    });
    const pendingSmsPrev = await Ticket.countDocuments({
      lotteryId: { $in: activeLotteryIds },
      smsSent: false,
      updatedAt: { $lte: last24h, $gt: prev24h }
    });
    const pendingSmsTrend = ((pendingSmsNow - pendingSmsPrev) / (pendingSmsPrev || 1)) * 100;

    // --- SMS Sent Today ---
    const smsSentToday = await Ticket.countDocuments({
      smsSent: true,
      soldAt: { $gte: last24h, $lt: now }
    });
    const smsSentYesterday = await Ticket.countDocuments({
      smsSent: true,
      soldAt: { $gte: prev24h, $lt: last24h }
    });
    const smsSentTodayTrend = ((smsSentToday - smsSentYesterday) / (smsSentYesterday || 1)) * 100;

    // --- Pending Winner SMS ---
    const pendingWinnerSmsNow = await Ticket.countDocuments({
      lotteryId: { $in: endedLotteryIds },
      winnerSmsSent: false
    });
    const pendingWinnerSmsPrev = await Ticket.countDocuments({
      lotteryId: { $in: endedLotteryIds },
      winnerSmsSent: false,
      updatedAt: { $lte: last24h, $gt: prev24h }
    });
    const pendingWinnerSmsTrend = ((pendingWinnerSmsNow - pendingWinnerSmsPrev) / (pendingWinnerSmsPrev || 1)) * 100;

    // --- Winner SMS Sent Today ---
    const winnerSmsSentToday = await Ticket.countDocuments({
      winnerSmsSent: true,
      updatedAt: { $gte: last24h, $lt: now }
    });
    const winnerSmsSentYesterday = await Ticket.countDocuments({
      winnerSmsSent: true,
      updatedAt: { $gte: prev24h, $lt: last24h }
    });
    const winnerSmsSentTodayTrend = ((winnerSmsSentToday - winnerSmsSentYesterday) / (winnerSmsSentYesterday || 1)) * 100;

    res.json({
      pendingSms: { count: pendingSmsNow, trend: pendingSmsTrend },
      smsSentToday: { count: smsSentToday, trend: smsSentTodayTrend },
      pendingWinnerSms: { count: pendingWinnerSmsNow, trend: pendingWinnerSmsTrend },
      winnerSmsSentToday: { count: winnerSmsSentToday, trend: winnerSmsSentTodayTrend }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch operator dashboard stats', error: error.message });
  }
};

// --- OPERATOR PENDING SMS TICKETS ---
export const getOperatorPendingSmsTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ smsSent: false, status: { $in: ['sold', 'winner'] } })
      .populate('lotteryId', 'title prizes')
      .populate('customer', 'name phone')
      .sort({ soldAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending SMS tickets', error: error.message });
  }
};

// --- OPERATOR PENDING WINNER SMS TICKETS ---
export const getOperatorPendingWinnerSmsTickets = async (req, res) => {
  try {
    // Find ended lotteries that have winners assigned
    const endedLotteriesWithWinners = await Lottery.find({
      status: 'ended',
      $or: [
        { winningTicketNumber: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { winners: { $exists: true, $ne: [], $not: { $size: 0 } } }
      ]
    }, { _id: 1, prizes: 1 });
    const endedLotteryIds = endedLotteriesWithWinners.map(l => l._id);
    // Find tickets with winnerSmsSent: false
    const tickets = await Ticket.find({
      lotteryId: { $in: endedLotteryIds },
      winnerSmsSent: false
    })
      .populate('lotteryId', 'title prizes winningTicketNumber tiktokStreamLink')
      .populate('customer', 'name phone')
      .sort({ soldAt: -1 });
    // Separate into winner and non-winner
    const winnerTickets = tickets.filter(t => t.status === 'winner');
    const nonWinnerTickets = tickets.filter(t => t.status !== 'winner');
    res.json({ winnerTickets, nonWinnerTickets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending winner SMS tickets', error: error.message });
  }
};

// --- MARK TICKET SMS SENT ---
export const markTicketSmsSent = async (req, res) => {
  try {
    const { id } = req.params;
    const operatorId = req.user.id;
    const operatorName = req.user.name || '';
    const operatorRole = req.user.role || '';
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.smsSent = true;
    ticket.smsSentAt = new Date();
    await ticket.save();
    await logActivity(
      'Sent SMS (sold)',
      `Operator ${operatorName} (${operatorRole} sent SMS for ticket ${ticket._id}`,
      'success'
    );
    res.json({ message: 'Ticket marked as SMS sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark ticket as SMS sent', error: error.message });
  }
};

// --- MARK TICKET WINNER SMS SENT ---
export const markTicketWinnerSmsSent = async (req, res) => {
  try {
    const { id } = req.params;
    const operatorId = req.user.id;
    const operatorName = req.user.name || '';
    const operatorRole = req.user.role || '';
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.winnerSmsSent = true;
    await ticket.save();
    await logActivity(
      'Sent SMS (winner)',
      `Operator ${operatorName} (${operatorRole} sent winner SMS for ticket ${ticket._id}`,
      'success'
    );
    res.json({ message: 'Ticket marked as winner SMS sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark ticket as winner SMS sent', error: error.message });
  }
};

// GET /api/lotteries?type=company|agent&status=active|ended|all&search=...&sort=createdAt
export const getFilteredLotteries = async (req, res) => {
  try {
    const { type, status = 'all', search = '', sort = 'createdAt' } = req.query;
    if (!type || (type !== 'company' && type !== 'agent')) {
      return res.status(400).json({ message: 'type must be company or agent' });
    }
    const query = { type };
    if (status !== 'all') query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };
    const lotteries = await Lottery.find(query).sort({ [sort]: -1 });
    res.json(lotteries);
  } catch (error) {
    console.error('Error fetching filtered lotteries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/lotteries/:id/sales-summary (company lotteries)
export const getCompanyLotterySalesSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const lottery = await Lottery.findById(id);
    if (!lottery || lottery.type !== 'company') {
      return res.status(404).json({ message: 'Company lottery not found' });
    }
    // Active: Pie chart data
    if (lottery.status === 'active') {
      const sold = await Ticket.countDocuments({ lotteryId: id, status: { $in: ['sold', 'winner'] } });
      const total = lottery.ticketCount;
      const unsold = total - sold;
      return res.json({
        type: 'active',
        sold,
        unsold,
        total
      });
    }
    // Ended: Seller summary
    if (lottery.status === 'ended') {
      // Group by seller (staff)
      const tickets = await Ticket.find({ lotteryId: id, status: { $in: ['sold', 'winner'] } }).populate('soldBy', 'name');
      const sellerMap = {};
      let totalSold = 0;
      let totalCollected = 0;
      for (const t of tickets) {
        const seller = t.soldBy ? t.soldBy.name : 'Unknown';
        if (!sellerMap[seller]) sellerMap[seller] = { sellerName: seller, ticketsSold: 0, collectedAmount: 0, commissionEarned: 0 };
        sellerMap[seller].ticketsSold++;
        sellerMap[seller].collectedAmount += lottery.ticketPrice;
        sellerMap[seller].commissionEarned += lottery.commissionPerTicket;
        totalSold++;
        totalCollected += lottery.ticketPrice;
      }
      const sellers = Object.values(sellerMap);
      return res.json({
        type: 'ended',
        sellers,
        totalSold,
        totalCollected
      });
    }
    res.status(400).json({ message: 'Invalid lottery status' });
  } catch (error) {
    console.error('Error fetching company lottery sales summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/lotteries/:id/agent-summary (agent lotteries)
export const getAgentLotterySummary = async (req, res) => {
  try {
    const { id } = req.params;
    const lottery = await Lottery.findById(id);
    if (!lottery || lottery.type !== 'agent') {
      return res.status(404).json({ message: 'Agent lottery not found' });
    }
    // Find agent name
    const agent = await User.findById(lottery.createdBy);
    const agentName = agent ? agent.name : 'Unknown';
    // Tickets sold
    const ticketsSold = await Ticket.countDocuments({ lotteryId: id, status: { $in: ['sold', 'winner'] } });
    const totalCollected = ticketsSold * lottery.ticketPrice;
    const commissionOwed = lottery.commissionPerTicket * ticketsSold;
    res.json({
      agentName,
      lotteryTitle: lottery.title,
      ticketsSold,
      totalCollected,
      commissionOwed
    });
  } catch (error) {
    console.error('Error fetching agent lottery summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 