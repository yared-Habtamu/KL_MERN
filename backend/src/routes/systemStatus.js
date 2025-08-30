import express from 'express';
import { getSystemStatus } from '../controllers/systemStatusController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get system status based on recent warnings
router.get('/status', authenticateJWT, getSystemStatus);

export default router; 