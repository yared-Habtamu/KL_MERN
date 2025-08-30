import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { getRecentActivities } from '../controllers/activityController.js';

const router = express.Router();

// Recent activities endpoint
router.get('/recent', authenticateJWT, getRecentActivities);

export default router; 