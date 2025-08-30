import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { createStaff, deleteStaff, getAllStaff, getStaffById, updateStaff, changePassword, getCommissionReportForStaff } from '../controllers/staffController.js';
import { adminLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);
// Apply rate limiting for admin/moderator actions
router.use(adminLimiter);

// Create new staff member
router.post('/', createStaff);

// Delete staff member
router.delete('/:id', deleteStaff);

// Get all staff members
router.get('/', getAllStaff);

// Get staff member by ID
router.get('/:id', getStaffById);

// Update staff member
router.put('/:id', updateStaff);

// Change password
router.put('/:id/password', changePassword);

// Get commission report for staff member
router.get('/:id/commission-report', getCommissionReportForStaff);

export default router;