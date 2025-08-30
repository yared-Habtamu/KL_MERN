import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { getDashboardOverview, getStaffByRole, getSellerDashboardSummary, getSellerActiveLotteries } from '../controllers/adminWidgetController.js';

const router = express.Router();

// Dashboard overview endpoint
router.get('/overview', authenticateJWT, getDashboardOverview);
router.get('/staff', getStaffByRole);

// Seller dashboard endpoints
router.get('/seller/summary', authenticateJWT, getSellerDashboardSummary);
router.get('/seller/active-lotteries', authenticateJWT, getSellerActiveLotteries);

export default router;   