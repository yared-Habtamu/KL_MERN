import express from 'express';
import { loginController } from '../controllers/loginController.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Test route to verify auth router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

router.post('/login', loginLimiter, loginController);

export default router; 