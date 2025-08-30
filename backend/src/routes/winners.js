import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { getAllWinners } from '../controllers/winnersController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get all winners
router.get('/', getAllWinners);

export default router; 