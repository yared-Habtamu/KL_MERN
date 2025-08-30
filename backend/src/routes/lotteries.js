import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  createLottery,
  getAllLotteries,
  getLotteriesDashboard,
  getLotteryById,
  updateLottery,
  deleteLottery,
  getSoldTicketsForLottery,
  sellTicketAtomic,
  getTickets,
  getTicketsDashboard,
  deleteTicket,
  getEndedLotteriesWithoutWinners,
  enterWinners,
  updateWinners,
  // New report endpoints
  getFilteredLotteries,
  getCompanyLotterySalesSummary,
  getAgentLotterySummary,
  // Operator endpoints
  getOperatorDashboardStats,
  getOperatorPendingSmsTickets,
  getOperatorPendingWinnerSmsTickets,
  markTicketSmsSent,
  markTicketWinnerSmsSent
} from '../controllers/lotteryController.js';
import { ticketSellLimiter } from '../middleware/rateLimiters.js';
import { requireOperator, requireAdminOrManager, requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Create lottery endpoint (admin, manager, agent only)
router.post('/', authenticateJWT, createLottery);

// Get all lotteries
router.get('/', authenticateJWT, getAllLotteries);

// Get lotteries dashboard data
router.get('/dashboard', authenticateJWT, getLotteriesDashboard);

// Get ended lotteries without winners
router.get('/ended-without-winners', authenticateJWT, getEndedLotteriesWithoutWinners);

// Example protected route
router.get('/', authenticateJWT, (req, res) => {
  res.json({ lotteries: [
    { id: 1, name: 'Biggie Jackpot', status: 'active' },
    { id: 2, name: 'Kiya Daily', status: 'inactive' },
  ] });
});

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Routes
router.get('/tickets', getTickets);
router.get('/tickets/dashboard', getTicketsDashboard);
router.get('/:id/sold-tickets', getSoldTicketsForLottery);
router.post('/:id/sell-ticket', ticketSellLimiter, sellTicketAtomic);
router.post('/:id/enter-winners', enterWinners);
// Reports & Filtering Endpoints (admin/manager only)
router.get('/filtered', authenticateJWT, requireAdminOrManager, getFilteredLotteries);
router.get('/:id/sales-summary', authenticateJWT, requireAdminOrManager, getCompanyLotterySalesSummary);
router.get('/:id/agent-summary', authenticateJWT, requireAdminOrManager, getAgentLotterySummary);
router.get('/:id', getLotteryById);
router.put('/:id', updateLottery);
router.put('/:id/update-winners', updateWinners);
router.delete('/:id', deleteLottery);
router.delete('/tickets/:id', requireAdmin, deleteTicket);

// --- OPERATOR ENDPOINTS ---
// Dashboard stats for operator widgets
router.get('/operator/dashboard-stats', authenticateJWT, requireOperator, getOperatorDashboardStats);
// Tickets pending SMS
router.get('/operator/tickets/pending-sms', authenticateJWT, requireOperator, getOperatorPendingSmsTickets);
// Tickets pending winner SMS
router.get('/operator/tickets/pending-winner-sms', authenticateJWT, requireOperator, getOperatorPendingWinnerSmsTickets);
// Mark ticket as SMS sent
router.put('/operator/tickets/:id/mark-sms-sent', authenticateJWT, requireOperator, markTicketSmsSent);
// Mark ticket as winner SMS sent
router.put('/operator/tickets/:id/mark-winner-sms-sent', authenticateJWT, requireOperator, markTicketWinnerSmsSent);

export default router; 