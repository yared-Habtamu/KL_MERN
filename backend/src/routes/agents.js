import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  getAgentsDashboard,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  createAgent
} from '../controllers/agentsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Get agents dashboard data
router.get('/dashboard', getAgentsDashboard);

// Get all agents with filters and pagination
router.get('/', getAgents);

// Get agent by ID
router.get('/:id', getAgentById);

// Update agent
router.put('/:id', updateAgent);

// Delete agent
router.delete('/:id', deleteAgent);

// Create agent
router.post('/', createAgent);

export default router; 